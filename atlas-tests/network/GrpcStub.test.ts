import { GrpcStub, ServiceDefinition } from "../../atlas-network/Grpc/GrpcStub";
import { NATSTransport } from "../../atlas-network/Transport/NATSTransport";

const calculatorService: ServiceDefinition = {
  serviceName: "Calculator",
  methods: {
    Add: {
      requestType: "AddRequest",
      responseType: "AddResponse",
      requestStream: false,
      responseStream: false,
    },
    Sum: {
      requestType: "SumRequest",
      responseType: "SumResponse",
      requestStream: false,
      responseStream: true,
    },
  },
};

describe("GrpcStub", () => {
  let transport: NATSTransport;
  let server: GrpcStub;
  let client: GrpcStub;

  beforeEach(async () => {
    transport = new NATSTransport(["nats://localhost:4222"]);
    await transport.connect();

    server = new GrpcStub(transport, calculatorService);
    client = new GrpcStub(transport, calculatorService);
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  describe("unary RPC", () => {
    it("makes a unary call and receives response", async () => {
      server.registerService({
        Add: async (req: any) => {
          return { result: req.a + req.b };
        },
      });

      const result = await client.unaryCall<{ a: number; b: number }, { result: number }>(
        "Add",
        { a: 5, b: 3 },
      );

      expect(result).toEqual({ result: 8 });
    });

    it("rejects unknown method", async () => {
      await expect(
        client.unaryCall("UnknownMethod", {}),
      ).rejects.toThrow("Unknown method");
    });

    it("rejects streaming method in unaryCall", async () => {
      await expect(
        client.unaryCall("Sum", {}),
      ).rejects.toThrow("not a unary RPC");
    });

    it("handles timeout", async () => {
      server.registerService({
        Add: async () => {
          await new Promise((r) => setTimeout(r, 200));
          return { result: 0 };
        },
      });

      await expect(
        client.unaryCall("Add", { a: 1, b: 2 }, { timeoutMs: 50 }),
      ).rejects.toThrow();
    });
  });

  describe("server streaming RPC", () => {
    it("receives streamed results", async () => {
      server.registerService({
        Sum: async function* (req: any) {
          for (let i = req.start; i <= req.end; i++) {
            yield { value: i };
          }
        },
      });

      const stream = await client.serverStreamingCall<{ start: number; end: number }, { value: number }>(
        "Sum",
        { start: 1, end: 3 },
      );

      const results: any[] = [];
      for await (const item of stream) {
        results.push(item);
      }

      expect(results).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
    });

    it("handles empty stream", async () => {
      server.registerService({
        Sum: async function* (_req: any) {
          // no yield
        },
      });

      const stream = await client.serverStreamingCall("Sum", { start: 1, end: 0 });
      const results: any[] = [];
      for await (const item of stream) {
        results.push(item);
      }
      expect(results).toEqual([]);
    });
  });
});
