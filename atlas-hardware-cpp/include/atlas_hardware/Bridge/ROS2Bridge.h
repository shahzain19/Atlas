#pragma once

#include "../Drivers/Device/NMEAGPSSensor.h"
#include "../Drivers/Device/SerialMotorController.h"
#include "../Drivers/Device/V4L2CameraDriver.h"
#include <memory>
#include <atomic>
#include <thread>

namespace atlas {

class ROS2Bridge {
  std::shared_ptr<NMEAGPSSensor> gps_;
  std::shared_ptr<SerialMotorController> motor_;
  std::shared_ptr<V4L2CameraDriver> camera_;
  std::atomic<bool> running_{false};
  std::thread spinThread_;

public:
  ROS2Bridge(std::shared_ptr<NMEAGPSSensor> gps,
             std::shared_ptr<SerialMotorController> motor,
             std::shared_ptr<V4L2CameraDriver> camera);

  ~ROS2Bridge();

  bool start();
  void stop();
  bool isRunning() const { return running_.load(); }
};

} // namespace atlas
