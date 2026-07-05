import { NATSClient, ConnectionState } from "../../atlas-network/Transport/NATSClient";
import { NATSTransport } from "../../atlas-network/Transport/NATSTransport";

describe("NATSClient", () => {
  let client: NATSClient;

  beforeEach(async () => {
    client = new NATSClient();
    await client.connect(["nats://localhost:4222"]);
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it("connects successfully", () => {
    expect(client.connectionState).toBe(ConnectionState.CONNECTED);
  });

  it("disconnects and changes state", async () => {
    await client.disconnect();
    expect(client.connectionState).toBe(ConnectionState.DISCONNECTED);
  });

  it("publishes and subscribes", (done) => {
    client.subscribe("events.user.created", (msg) => {
      expect(msg.payload).toEqual({ userId: 123 });
      done();
    });

    client.publish("events.user.created", { userId: 123 });
  });

  it("subscribe returns a subscription ID", () => {
    const id1 = client.subscribe("topic.a", jest.fn());
    const id2 = client.subscribe("topic.b", jest.fn());

    expect(typeof id1).toBe("number");
    expect(typeof id2).toBe("number");
    expect(id2).toBeGreaterThan(id1);
  });

  it("unsubscribe by ID removes specific handler", () => {
    const h1 = jest.fn();
    const h2 = jest.fn();

    const id1 = client.subscribe("test", h1);
    client.subscribe("test", h2);

    client.unsubscribe(id1);

    client.publish("test", { x: 1 });

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe by subject removes all handlers", () => {
    const h1 = jest.fn();
    const h2 = jest.fn();

    client.subscribe("test", h1);
    client.subscribe("test", h2);

    client.unsubscribe("test");

    client.publish("test", { x: 1 });

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("request receives reply", async () => {
    // Manually add a handler via the underlying transport
    (client as any).transport.subscribe("math.add", (msg: any) => {
      (client as any).transport.replyTo(msg, { result: 7 });
    });

    const reply = await client.request("math.add", { a: 3, b: 4 });
    expect(reply.payload).toEqual({ result: 7 });
  });

  it("throws when not connected", async () => {
    await client.disconnect();
    expect(() => client.publish("x", {})).toThrow("not connected");
    expect(() => client.subscribe("x", jest.fn())).toThrow("not connected");
    expect(() => client.unsubscribe("x")).toThrow("not connected");
  });
});
