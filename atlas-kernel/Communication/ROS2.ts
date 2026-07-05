export interface ROS2Message {
  topic: string;
  msgType: string;
  data: any;
  timestamp: number;
}

export type ROS2Callback = (msg: ROS2Message) => void;

export interface IROS2Bridge {
  publish(topic: string, msgType: string, data: any): void;
  subscribe(topic: string, callback: ROS2Callback): void;
}
