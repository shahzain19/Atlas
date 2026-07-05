import { NATSTransport } from "../../atlas-network/Transport/NATSTransport";

describe("NATS Error Handling", () => {
  let transport: NATSTransport;

  beforeEach(async () => {
    transport = new NATSTransport(["nats://localhost:4222"]);
    await transport.connect();
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  it("one throwing handler does not break other handlers", () => {
    const throwingHandler = jest.fn().mockImplementation(() => {
      throw new Error("handler error");
    });
    const goodHandler = jest.fn();

    transport.subscribe("test.errors", throwingHandler);
    transport.subscribe("test.errors", goodHandler);

    expect(() => {
      transport.publish("test.errors", {});
    }).not.toThrow();

    expect(throwingHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });

  it("subscriptions work with wildcard and throwing handlers", () => {
    const throwing = jest.fn().mockImplementation(() => {
      throw new Error("bad");
    });
    const good = jest.fn();

    transport.subscribe("wildcard.*", throwing);
    transport.subscribe("wildcard.*", good);

    expect(() => {
      transport.publish("wildcard.test", {});
    }).not.toThrow();

    expect(good).toHaveBeenCalledTimes(1);
  });

  it("handles unsubscribe of non-existent subject gracefully", () => {
    expect(() => {
      transport.unsubscribe("does.not.exist");
    }).not.toThrow();
  });

  it("handles unsubscribe of non-existent handler gracefully", () => {
    transport.subscribe("test", jest.fn());
    expect(() => {
      transport.unsubscribe("test", jest.fn());
    }).not.toThrow();
  });

  it("connect and disconnect multiple times is safe", async () => {
    for (let i = 0; i < 5; i++) {
      const t = new NATSTransport([]);
      await t.connect();
      expect(t.isConnected()).toBe(true);
      await t.disconnect();
      expect(t.isConnected()).toBe(false);
    }
  });
});
