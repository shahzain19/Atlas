export { Human, Interaction } from "./Human";
import { Human, Interaction } from "./Human";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class HumanTracker {
  private humans: Map<string, Human> = new Map();
  private knownHumanIds: Set<string> = new Set();

  addHuman(human: Omit<Human, "id" | "lastSeen" | "interactionHistory">): Human {
    const newHuman: Human = {
      ...human,
      id: uuidv4(),
      lastSeen: Date.now(),
      interactionHistory: [],
    };
    this.humans.set(newHuman.id, newHuman);
    return newHuman;
  }

  updateHuman(id: string, updates: Partial<Human>): Human | undefined {
    const existing = this.humans.get(id);
    if (!existing) return undefined;
    const updated: Human = {
      ...existing,
      ...updates,
      id: existing.id,
      lastSeen: Date.now(),
    };
    this.humans.set(id, updated);
    return updated;
  }

  removeHuman(id: string): boolean {
    this.knownHumanIds.delete(id);
    return this.humans.delete(id);
  }

  getHuman(id: string): Human | undefined {
    return this.humans.get(id);
  }

  getAllHumans(): Human[] {
    return Array.from(this.humans.values());
  }

  recordInteraction(humanId: string, type: string, duration?: number): void {
    const human = this.humans.get(humanId);
    if (!human) return;
    const interaction: Interaction = { timestamp: Date.now(), type, duration };
    human.interactionHistory.push(interaction);
    human.lastSeen = Date.now();
  }

  getHumansByActivity(activity: string): Human[] {
    return this.getAllHumans().filter((h) => h.activity === activity);
  }

  getHumansByProximity(x: number, y: number, z: number, radius: number): Human[] {
    return this.getAllHumans().filter((h) => {
      const dx = h.position.x - x;
      const dy = h.position.y - y;
      const dz = h.position.z - z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });
  }

  getEngagement(id: string): { lastSeenAgo: number; isEngaged: boolean } | undefined {
    const human = this.humans.get(id);
    if (!human) return undefined;
    const lastSeenAgo = Date.now() - human.lastSeen;
    return { lastSeenAgo, isEngaged: lastSeenAgo < 30000 };
  }

  markAsKnown(id: string): void {
    this.knownHumanIds.add(id);
  }

  isKnown(id: string): boolean {
    return this.knownHumanIds.has(id);
  }

  getKnownHumans(): Human[] {
    return Array.from(this.knownHumanIds)
      .map((id) => this.humans.get(id))
      .filter((h): h is Human => h !== undefined);
  }

  getUnknownHumans(): Human[] {
    return this.getAllHumans().filter((h) => !this.knownHumanIds.has(h.id));
  }
}
