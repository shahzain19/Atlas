import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { Event } from "../../atlas-kernel/Event/Event";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("should emit events to registered handlers", () => {
    const handler = jest.fn();
    bus.on("TEST", handler);

    const event: Event = { type: "TEST", timestamp: Date.now(), payload: { value: 1 } };
    bus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should not emit to unregistered event types", () => {
    const handler = jest.fn();
    bus.on("OTHER", handler);
    bus.emit({ type: "TEST", timestamp: Date.now() });
    expect(handler).not.toHaveBeenCalled();
  });

  it("notifies wildcard handlers for every emitted event", () => {
    const handler = jest.fn();
    bus.onAll(handler);

    const event: Event = { type: "TEST", timestamp: Date.now() };
    bus.emit(event);

    expect(handler).toHaveBeenCalledWith(event);
  });
});
