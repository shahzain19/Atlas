import { BaseAgent } from "../BaseAgent/BaseAgent";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();

  register(agent: BaseAgent) {
    this.agents.set(agent.name, agent);
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Routes a message to the appropriate agent(s).
   */
  route(message: AgentMessage) {
    if (message.recipient === "all") {
      // Broadcast
      for (const agent of this.agents.values()) {
        if (agent.name !== message.sender && agent.receive) {
          agent.receive(message);
        }
      }
    } else {
      // Direct message
      const recipient = this.agents.get(message.recipient);
      if (recipient && recipient.receive) {
        recipient.receive(message);
      }
    }
  }
}