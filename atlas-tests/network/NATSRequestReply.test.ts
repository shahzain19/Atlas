import { NATSTransport } from "../../atlas-network/Transport/NATSTransport";

describe("NATS Request-Reply", () => {
  let transport: NATSTransport;

  beforeEach(async () => {
    transport = new NATSTransport(["nats://localhost:4222"]);
    await transport.connect();
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  it("request receives a reply", async () => {
    transport.subscribe("math.add", (msg) => {
      const { a, b } = msg.payload as any;
      transport.replyTo(msg, { result: a + b });
    });

    const reply = await transport.request("math.add", { a: 3, b: 4 });
    expect(reply.payload).toEqual({ result: 7 });
  });

  it("request times out with no responder", async () => {
    await expect(
      transport.request("no.handler", { x: 1 }, 100),
    ).rejects.toThrow("timed out");
  });

  it("multiple concurrent requests resolve correctly", async () => {
    transport.subscribe("square", (msg) => {
      const { n } = msg.payload as any;
      transport.replyTo(msg, { result: n * n });
    });

    const [r1, r2, r3] = await Promise.all([
      transport.request("square", { n: 2 }),
      transport.request("square", { n: 3 }),
      transport.request("square", { n: 4 }),
    ]);

    expect(r1.payload).toEqual({ result: 4 });
    expect(r2.payload).toEqual({ result: 9 });
    expect(r3.payload).toEqual({ result: 16 });
  });

  it("replyTo throws when message has no replyTo", () => {
    expect(() =>
      transport.replyTo(
        {
          id: "x",
          type: "test",
          source: "x",
          payload: {},
          timestamp: Date.now(),
        },
        {},
      ),
    ).toThrow("No replyTo");
  });
});
