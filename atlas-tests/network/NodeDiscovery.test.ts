import { NodeDiscovery, DiscoveryEvent } from "../../atlas-network/Discovery/NodeDiscovery";
import { NATSTransport } from "../../atlas-network/Transport/NATSTransport";

describe("NodeDiscovery", () => {
  let transport: NATSTransport;
  let discovery1: NodeDiscovery;
  let discovery2: NodeDiscovery;

  beforeEach(async () => {
    transport = new NATSTransport(["nats://localhost:4222"]);
    await transport.connect();

    discovery1 = new NodeDiscovery(transport, {
      nodeId: "node-1",
      nodeName: "Alpha",
      nodeAddress: "192.168.1.1",
      capabilities: ["core", "vision"],
      version: "2.0.0",
    });

    discovery2 = new NodeDiscovery(transport, {
      nodeId: "node-2",
      nodeName: "Beta",
      nodeAddress: "192.168.1.2",
      capabilities: ["core", "audio"],
      version: "1.5.0",
    });
  });

  afterEach(async () => {
    await discovery1.stop();
    await discovery2.stop();
    await transport.disconnect();
  });

  it("initializes with empty node list", () => {
    expect(discovery1.getDiscoveredNodes()).toHaveLength(0);
  });

  it("discovers another node via hello messages", (done) => {
    discovery1.on(DiscoveryEvent.NODE_DISCOVERED, (node) => {
      expect(node.id).toBe("node-2");
      expect(node.name).toBe("Beta");
      expect(node.capabilities).toContain("audio");
      done();
    });

    discovery1.start(5000, 30000);
    discovery2.start(5000, 30000);

    // Manually trigger a hello from node-2
    (discovery2 as any).broadcastHello();
  });

  it("provides node info", () => {
    const info = discovery1.nodeInfo;
    expect(info.id).toBe("node-1");
    expect(info.name).toBe("Alpha");
    expect(info.version).toBe("2.0.0");
    expect(info.uptime).toBeGreaterThanOrEqual(0);
  });

  it("getNode returns specific node", async () => {
    discovery1.start(5000, 30000);
    discovery2.start(5000, 30000);

    (discovery2 as any).broadcastHello();

    // Wait a tick for the message to be processed
    await new Promise((r) => setTimeout(r, 10));

    const node = discovery1.getNode("node-2");
    expect(node).toBeDefined();
    expect(node!.name).toBe("Beta");
  });

  it("does not discover itself", () => {
    const handler = jest.fn();
    discovery1.on(DiscoveryEvent.NODE_DISCOVERED, handler);

    (discovery1 as any).broadcastHello();

    expect(handler).not.toHaveBeenCalled();
  });

  it("emits NODE_UPDATED when existing node sends hello again", (done) => {
    discovery1.on(DiscoveryEvent.NODE_UPDATED, (node) => {
      expect(node.id).toBe("node-2");
      done();
    });

    discovery1.start(5000, 30000);
    discovery2.start(5000, 30000);

    // First hello (discovery)
    (discovery2 as any).broadcastHello();

    setTimeout(() => {
      // Second hello (update)
      (discovery2 as any).broadcastHello();
    }, 10);
  });

  it("stops and starts cleanly", async () => {
    await discovery1.start(100, 500);
    await discovery1.stop();
    expect(discovery1.getDiscoveredNodes()).toHaveLength(0);
  });
});
