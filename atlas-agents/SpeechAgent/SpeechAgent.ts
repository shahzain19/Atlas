import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";

export class SpeechAgent extends BaseAgent {
  readonly name = "SpeechAgent";

  initialize(): void {
    console.log("Speech Agent initialized");
  }

  handle(event: Event): Decision[] {
    if (event.type !== "SPEAK_REQUEST" || !event.payload?.text) {
      return [];
    }

    const text = event.payload.text as string;

    return [
      {
        name: "SpeakDecision",
        confidence: 1.0,
        execute: () => {
          void this.speak(text);
        },
      },
    ];
  }

  async speak(text: string): Promise<void> {
    console.log(`🤖 Speaking: "${text}"`);
  }

  async listen(): Promise<string> {
    await new Promise((r) => setTimeout(r, 1000));
    return "I heard something";
  }
}
