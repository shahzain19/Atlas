import { NATSTransport } from "../Transport/NATSTransport";
import { TransportMessage } from "../Transport/Transport";

export interface ServiceDefinition {
  serviceName: string;
  methods: Record<
    string,
    {
      requestType: string;
      responseType: string;
      requestStream: boolean;
      responseStream: boolean;
    }
  >;
}

export interface GrpcCallOptions {
  timeoutMs?: number;
}

export class GrpcStub {
  private transport: NATSTransport;
  private serviceDef: ServiceDefinition;

  constructor(transport: NATSTransport, serviceDef: ServiceDefinition) {
    this.transport = transport;
    this.serviceDef = serviceDef;
  }

  get serviceName(): string {
    return this.serviceDef.serviceName;
  }

  async unaryCall<TReq, TRes>(
    methodName: string,
    request: TReq,
    options?: GrpcCallOptions,
  ): Promise<TRes> {
    const method = this.serviceDef.methods[methodName];
    if (!method) throw new Error(`Unknown method: ${methodName}`);
    if (method.requestStream || method.responseStream) {
      throw new Error(`Method ${methodName} is not a unary RPC`);
    }

    const subject = `${this.serviceDef.serviceName}.${methodName}`;
    const reply = await this.transport.request(
      subject,
      request,
      options?.timeoutMs ?? 5000,
    );
    return reply.payload as TRes;
  }

  async serverStreamingCall<TReq, TRes>(
    methodName: string,
    request: TReq,
    options?: GrpcCallOptions,
  ): Promise<AsyncIterable<TRes>> {
    const method = this.serviceDef.methods[methodName];
    if (!method) throw new Error(`Unknown method: ${methodName}`);
    if (!method.responseStream) {
      throw new Error(`Method ${methodName} is not a server-streaming RPC`);
    }

    const subject = `${this.serviceDef.serviceName}.${methodName}`;
    const replySubject = `_STREAM.${this.serviceDef.serviceName}.${methodName}.${Date.now()}`;

    return this.createStream(subject, replySubject, request, options);
  }

  private async createStream<TReq, TRes>(
    subject: string,
    replySubject: string,
    request: TReq,
    options?: GrpcCallOptions,
  ): Promise<AsyncIterable<TRes>> {
    const transport = this.transport;
    const timeoutMs = options?.timeoutMs ?? 10000;

    const stream: AsyncIterable<TRes> = {
      [Symbol.asyncIterator](): AsyncIterator<TRes> {
        const buffer: TRes[] = [];
        let done = false;
        let error: Error | null = null;
        let resolveNext: ((value: IteratorResult<TRes>) => void) | null = null;

        const handler = (msg: TransportMessage) => {
          const payload = msg.payload as any;
          if (payload && payload._stream_end === true) {
            done = true;
            transport.unsubscribe(replySubject, handler);
            if (resolveNext) {
              resolveNext({ value: undefined as any, done: true });
              resolveNext = null;
            }
            return;
          }
          if (resolveNext) {
            resolveNext({ value: msg.payload as TRes, done: false });
            resolveNext = null;
          } else {
            buffer.push(msg.payload as TRes);
          }
        };

        transport.subscribe(replySubject, handler);

        transport.publish(subject, request, replySubject);

        const timer = setTimeout(() => {
          error = new Error(`Stream timed out after ${timeoutMs}ms`);
          transport.unsubscribe(replySubject, handler);
          if (resolveNext) {
            resolveNext({ value: undefined as any, done: true });
            resolveNext = null;
          }
        }, timeoutMs);

        return {
          next(): Promise<IteratorResult<TRes>> {
            if (done) return Promise.resolve({ value: undefined as any, done: true });
            if (error) return Promise.reject(error);
            if (buffer.length > 0) {
              return Promise.resolve({ value: buffer.shift()!, done: false });
            }
            return new Promise<IteratorResult<TRes>>((res) => {
              resolveNext = res;
            });
          },
          return(): Promise<IteratorResult<TRes>> {
            done = true;
            clearTimeout(timer);
            transport.unsubscribe(replySubject, handler);
            return Promise.resolve({ value: undefined as any, done: true });
          },
        };
      },
    };

    return stream;
  }

  registerService(handlers: Record<string, (req: unknown) => unknown | Promise<unknown>>): void {
    for (const [methodName, handlerFn] of Object.entries(handlers)) {
      const method = this.serviceDef.methods[methodName];
      if (!method) throw new Error(`Unknown method: ${methodName}`);

      const subject = `${this.serviceDef.serviceName}.${methodName}`;

      this.transport.subscribe(subject, async (msg: TransportMessage) => {
        try {
          if (method.responseStream) {
            const result = await handlerFn(msg.payload);
            if (result && typeof (result as any)[Symbol.asyncIterator] === "function") {
              for await (const item of result as AsyncIterable<unknown>) {
                if (msg.replyTo) {
                  this.transport.publish(msg.replyTo, item);
                }
              }
            }
            if (msg.replyTo) {
              this.transport.publish(msg.replyTo, { _stream_end: true });
            }
          } else {
            const result = await handlerFn(msg.payload);
            if (msg.replyTo) {
              this.transport.publish(msg.replyTo, result);
            }
          }
        } catch (e: any) {
          if (msg.replyTo) {
            this.transport.publish(msg.replyTo, {
              _error: true,
              message: e.message || "Internal error",
            });
          }
        }
      });
    }
  }
}
