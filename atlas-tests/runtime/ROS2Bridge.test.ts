import { ROS2Bridge } from "../../atlas-runtime/Communication/ROS2Bridge";
import { ROS2Message } from "../../atlas-kernel/Communication/ROS2";

describe("ROS2Bridge", () => {
  let bridge: ROS2Bridge;

  beforeEach(() => {
    bridge = new ROS2Bridge();
  });

  it("should publish and receive messages on a topic", () => {
    const callback = jest.fn();
    bridge.subscribe("/test/topic", callback);

    const data = { value: 42 };
    bridge.publish("/test/topic", "std_msgs/Int32", data);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "/test/topic",
        msgType: "std_msgs/Int32",
        data: data,
      })
    );
  });

  it("should handle multiple subscribers on the same topic", () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    bridge.subscribe("/test/multi", cb1);
    bridge.subscribe("/test/multi", cb2);

    bridge.publish("/test/multi", "std_msgs/String", { data: "hello" });

    expect(cb1).toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });

  it("should not notify subscribers of other topics", () => {
    const callback = jest.fn();
    bridge.subscribe("/topic/a", callback);

    bridge.publish("/topic/b", "std_msgs/Empty", {});

    expect(callback).not.toHaveBeenCalled();
  });
});
