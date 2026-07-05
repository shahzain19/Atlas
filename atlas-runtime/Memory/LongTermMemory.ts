import * as fs from "fs";
import * as path from "path";
import { Event } from "../../atlas-kernel/Event/Event";

export interface MemoryData {
  events: Event[];
  lastUpdate: number;
}

export class LongTermMemory {
  private storagePath: string;
  private data: MemoryData;

  constructor(storageDir: string = "storage") {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.storagePath = path.join(storageDir, "memory.json");
    this.data = this.load();
  }

  /**
   * Appends an event to persistent storage.
   */
  async logEvent(event: Event): Promise<void> {
    this.data.events.push(event);
    this.data.lastUpdate = Date.now();
    await this.save();
  }

  /**
   * Retrieves all logged events.
   */
  getEvents(): Event[] {
    return [...this.data.events];
  }

  /**
   * Finds events by type in persistent storage.
   */
  findEventsByType(type: string): Event[] {
    return this.data.events.filter((e) => e.type === type);
  }

  /**
   * Clears all persistent memory.
   */
  async clear(): Promise<void> {
    this.data = { events: [], lastUpdate: Date.now() };
    await this.save();
  }

  private load(): MemoryData {
    if (fs.existsSync(this.storagePath)) {
      try {
        const content = fs.readFileSync(this.storagePath, "utf-8");
        return JSON.parse(content);
      } catch (err) {
        console.error("Failed to load long-term memory, starting fresh:", err);
      }
    }
    return { events: [], lastUpdate: Date.now() };
  }

  private async save(): Promise<void> {
    try {
      const content = JSON.stringify(this.data, null, 2);
      await fs.promises.writeFile(this.storagePath, content, "utf-8");
    } catch (err) {
      console.error("Failed to save long-term memory:", err);
    }
  }
}
