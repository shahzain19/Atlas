import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";

export class SpeechAgent extends BaseAgent {
  readonly name = "SpeechAgent";

  private state: "idle" | "speaking" | "listening" = "idle";

  initialize(): void {
    console.log("Speech Agent initialized");
  }

  handle(event: Event): Decision[] {
    switch (event.type) {
      case "SPEAK_REQUEST":
        if (!event.payload?.text) return [];
        this.state = "speaking";
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
      case "LISTEN_REQUEST":
        this.state = "listening";
        return [
          {
            name: "ListenDecision",
            confidence: 0.8,
            execute: () => {
              void this.listen();
            },
          },
        ];
      case "LISTEN_COMPLETE":
        this.state = "idle";
        return [];
      case "SPEAK_COMPLETE":
        this.state = "idle";
        return [];
      default:
        return [];
    }
  }

  async speak(text: string): Promise<void> {
    console.log(`🤖 Speaking: "${text}"`);
    await new Promise((r) => setTimeout(r, 100));
  }

  async listen(): Promise<string> {
    await new Promise((r) => setTimeout(r, 500));
    const phrase = `Heard at ${new Date().toISOString()}`;
    this.state = "idle";
    return phrase;
  }
}
