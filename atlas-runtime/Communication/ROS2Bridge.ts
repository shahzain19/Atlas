import { IROS2Bridge, ROS2Message, ROS2Callback } from "../../atlas-kernel/Communication/ROS2";
import { Event } from "../../atlas-kernel/Event/Event";

export class ROS2Bridge implements IROS2Bridge {
  private subscribers: Map<string, ROS2Callback[]> = new Map();
  private eventBridges: Map<string, { topic: string; msgType: string }> = new Map();

  publish(topic: string, msgType: string, data: unknown): void {
    const message: ROS2Message = {
      topic,
      msgType,
      data,
      timestamp: Date.now(),
    };

    const callbacks = this.subscribers.get(topic);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message));
    }
  }

  subscribe(topic: string, callback: ROS2Callback): void {
    const callbacks = this.subscribers.get(topic) || [];
    callbacks.push(callback);
    this.subscribers.set(topic, callbacks);
  }

  bridgeEventToTopic(eventType: string, topic: string, msgType: string): void {
    this.eventBridges.set(eventType, { topic, msgType });
  }

  mirrorEvent(event: Event): void {
    const bridge = this.eventBridges.get(event.type);
    if (!bridge) return;
    this.publish(bridge.topic, bridge.msgType, event.payload);
  }

  getSubscribers(topic: string): number {
    return this.subscribers.get(topic)?.length ?? 0;
  }
}
