import { WebSocketTransport } from "../../atlas-network/Transport/WebSocketTransport";

describe("WebSocketTransport", () => {
  let server: WebSocketTransport;
  let client: WebSocketTransport;
  let port: number;

  beforeAll(async () => {
    port = 0; // let OS assign
    server = new WebSocketTransport({ port: 0 });
    await server.connect();

    // Get actual port
    const addr = (server as any).httpServer?.address();
    port = addr?.port || 0;
  });

  afterAll(async () => {
    await client?.disconnect();
    await server.disconnect();
  });

  beforeEach(async () => {
    client = new WebSocketTransport({ url: `ws://localhost:${port}` });
    await client.connect();
  });

  afterEach(async () => {
    await client?.disconnect();
  });

  it("server accepts client connections", () => {
    expect(server.isConnected()).toBe(true);
    expect(client.isConnected()).toBe(true);
  });

  it("client publishes and server receives", (done) => {
    server.subscribe("test.topic", (msg) => {
      expect(msg.payload).toEqual({ hello: "world" });
      done();
    });

    client.send({
      id: "1",
      type: "test.topic",
      source: "client",
      payload: { hello: "world" },
      timestamp: Date.now(),
    });
  });

  it("server routes messages to subscribed clients", (done) => {
    const client2 = new WebSocketTransport({ url: `ws://localhost:${port}` });
    client2.connect().then(() => {
      client2.subscribe("chat.room", (msg) => {
        expect(msg.payload).toEqual({ text: "hello" });
        client2.disconnect();
        done();
      });

      // Wait a tick for subscription to propagate
      setTimeout(() => {
        client.send({
          id: "2",
          type: "chat.room",
          source: "client1",
          payload: { text: "hello" },
          timestamp: Date.now(),
        });
      }, 50);
    });
  });

  it("client can subscribe and unsubscribe", () => {
    const handler = jest.fn();

    client.subscribe("my.topic", handler);
    client.unsubscribe("my.topic", handler);

    client.send({
      id: "3",
      type: "my.topic",
      source: "client",
      payload: { x: 1 },
      timestamp: Date.now(),
    });

    // Give it a tick
    setTimeout(() => {
      expect(handler).not.toHaveBeenCalled();
    }, 50);
  });
});
