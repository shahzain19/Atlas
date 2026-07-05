import { MessageBroker } from "../../atlas-network/MessageBroker";

describe("MessageBroker", () => {
  let broker: MessageBroker;

  beforeEach(async () => {
    broker = MessageBroker.createNATSBroker();
    await broker.connect();
  });

  afterEach(async () => {
    await broker.disconnect();
  });

  describe("pub/sub", () => {
    it("publishes and receives messages", (done) => {
      broker.subscribe("events.order.created", (msg) => {
        expect(msg.payload).toEqual({ orderId: "ord-123" });
        done();
      });

      broker.publish("events.order.created", { orderId: "ord-123" });
    });

    it("supports multiple subscribers", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();

      broker.subscribe("notifications", h1);
      broker.subscribe("notifications", h2);

      broker.publish("notifications", { text: "hello" });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });

  describe("request/reply", () => {
    it("supports request-reply pattern", async () => {
      broker.subscribe("rpc.echo", (msg) => {
        broker.publish(msg.replyTo!, msg.payload);
      });

      const result = await broker.request("rpc.echo", { text: "ping" });
      expect(result).toEqual({ text: "ping" });
    });

    it("request times out with no responder", async () => {
      await expect(
        broker.request("rpc.nobody", { x: 1 }, 100),
      ).rejects.toThrow("timed out");
    });
  });

  describe("lifecycle", () => {
    it("connects and disconnects", () => {
      expect(broker.isConnected()).toBe(true);
      broker.disconnect();
      expect(broker.isConnected()).toBe(false);
    });

    it("static factory creates NATS broker", () => {
      const b = MessageBroker.createNATSBroker();
      expect(b).toBeInstanceOf(MessageBroker);
    });
  });
});
