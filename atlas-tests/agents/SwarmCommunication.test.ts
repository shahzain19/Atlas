import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { VisionAgent } from "../../atlas-agents/VisionAgent/VisionAgent";
import { NavigationAgent } from "../../atlas-agents/NavigationAgent/NavigationAgent";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";

describe("SwarmCommunication", () => {
  let runtime: AtlasRuntime;
  let visionAgent: VisionAgent;
  let navAgent: NavigationAgent;

  beforeEach(() => {
    runtime = new AtlasRuntime();
    visionAgent = new VisionAgent(runtime);
    navAgent = new NavigationAgent(runtime);

    runtime.agents.register(visionAgent);
    runtime.agents.register(navAgent);
  });

  it("should route messages between agents", () => {
    const receiveSpy = jest.spyOn(navAgent, "receive");
    
    const message: AgentMessage = {
      id: "m1",
      sender: "VisionAgent",
      recipient: "NavigationAgent",
      type: "OBJECT_DETECTED",
      payload: { object: "obstacle" },
      timestamp: Date.now()
    };

    runtime.sendMessage(message);

    expect(receiveSpy).toHaveBeenCalledWith(message);
  });

  it("should broadcast messages to all agents except sender", () => {
    const visionReceiveSpy = jest.spyOn(visionAgent, "receive");
    const navReceiveSpy = jest.spyOn(navAgent, "receive");

    const message: AgentMessage = {
      id: "m2",
      sender: "System",
      recipient: "all",
      type: "GLOBAL_STOP",
      payload: {},
      timestamp: Date.now()
    };

    runtime.sendMessage(message);

    expect(visionReceiveSpy).toHaveBeenCalledWith(message);
    expect(navReceiveSpy).toHaveBeenCalledWith(message);
  });
});
