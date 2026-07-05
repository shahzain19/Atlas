import { NATSTransport } from "../../atlas-network/Transport/NATSTransport";
import { TransportMessage } from "../../atlas-network/Transport/Transport";

describe("NATSTransport", () => {
  let transport: NATSTransport;

  beforeEach(async () => {
    transport = new NATSTransport(["nats://localhost:4222"]);
    await transport.connect();
  });

  afterEach(async () => {
    await transport.disconnect();
  });

  describe("connect / disconnect", () => {
    it("connects and sets connected flag", () => {
      expect(transport.isConnected()).toBe(true);
    });

    it("disconnects and clears state", async () => {
      await transport.disconnect();
      expect(transport.isConnected()).toBe(false);
    });

    it("rejects send when not connected", async () => {
      const t = new NATSTransport([]);
      await expect(
        t.send({
          id: "1",
          type: "test",
          source: "test",
          payload: {},
          timestamp: Date.now(),
        }),
      ).rejects.toThrow("NATSTransport not connected");
    });
  });

  describe("pub/sub", () => {
    it("delivers published messages to subscribers", (done) => {
      transport.subscribe("atlas.events", (msg) => {
        expect(msg.payload).toEqual({ value: 42 });
        done();
      });

      transport.publish("atlas.events", { value: 42 });
    });

    it("delivers to multiple subscribers", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();

      transport.subscribe("atlas.events", h1);
      transport.subscribe("atlas.events", h2);

      transport.publish("atlas.events", { value: 42 });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it("unsubscribes specific handler", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();

      transport.subscribe("test.topic", h1);
      transport.subscribe("test.topic", h2);
      transport.unsubscribe("test.topic", h1);

      transport.publish("test.topic", { x: 1 });

      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it("unsubscribes all handlers for a subject", () => {
      const h1 = jest.fn();
      transport.subscribe("test.topic", h1);
      transport.unsubscribe("test.topic");

      transport.publish("test.topic", { x: 1 });
      expect(h1).not.toHaveBeenCalled();
    });

    it("does not deliver to non-matching subjects", () => {
      const h = jest.fn();
      transport.subscribe("foo.bar", h);

      transport.publish("foo.baz", { x: 1 });

      expect(h).not.toHaveBeenCalled();
    });
  });

  describe("wildcard subjects", () => {
    it("matches single token wildcard (*)", (done) => {
      transport.subscribe("foo.*.baz", (msg) => {
        expect(msg.type).toBe("foo.bar.baz");
        done();
      });

      transport.publish("foo.bar.baz", { x: 1 });
    });

    it("does not match * beyond one token", () => {
      const h = jest.fn();
      transport.subscribe("foo.*.baz", h);

      transport.publish("foo.bar.qux.baz", { x: 1 });

      expect(h).not.toHaveBeenCalled();
    });

    it("matches multi-token wildcard (>)", (done) => {
      transport.subscribe("foo.>", (msg) => {
        expect(msg.type).toBe("foo.bar.baz.qux");
        done();
      });

      transport.publish("foo.bar.baz.qux", { x: 1 });
    });

    it("matches > at root level", (done) => {
      transport.subscribe(">", (msg) => {
        expect(msg.type).toBe("anything.here");
        done();
      });

      transport.publish("anything.here", { x: 1 });
    });
  });

  describe("queue groups", () => {
    it("distributes messages among queue group members (competing consumers)", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();

      transport.subscribe("work.orders", h1, "workers");
      transport.subscribe("work.orders", h2, "workers");

      transport.publish("work.orders", { task: 1 });
      transport.publish("work.orders", { task: 2 });

      // Each handler should receive exactly one message (round-robin)
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it("delivers all messages to non-group subscribers", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();

      transport.subscribe("work.orders", h1);
      transport.subscribe("work.orders", h2);

      transport.publish("work.orders", { task: 1 });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });

  describe("send method", () => {
    it("dispatches via send()", (done) => {
      transport.subscribe("send.test", (msg) => {
        expect(msg.payload).toEqual({ sent: true });
        done();
      });

      transport.send({
        id: "s1",
        type: "send.test",
        source: "test",
        payload: { sent: true },
        timestamp: Date.now(),
      });
    });
  });
});
