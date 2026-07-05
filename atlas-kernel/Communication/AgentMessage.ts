export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string; // "all" or specific agent name
  type: string;
  payload: any;
  timestamp: number;
}

export interface AgentSignal {
  type: "BROADCAST" | "DIRECT" | "SYNC";
  message: AgentMessage;
}
