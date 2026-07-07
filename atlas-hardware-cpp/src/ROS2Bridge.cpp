#include "atlas_hardware/Bridge/ROS2Bridge.h"

#include <chrono>
#include <cstring>
#include <iostream>
#include <thread>

namespace atlas {

ROS2Bridge::ROS2Bridge(std::shared_ptr<NMEAGPSSensor> gps,
                       std::shared_ptr<SerialMotorController> motor,
                       std::shared_ptr<V4L2CameraDriver> camera)
  : gps_(std::move(gps)), motor_(std::move(motor)), camera_(std::move(camera)) {
}

ROS2Bridge::~ROS2Bridge() {
  stop();
}

bool ROS2Bridge::start() {
  if (running_.load()) return true;

#ifdef ATLAS_HAS_ROS2
  try {
    int argc = 0;
    rclcpp::init(argc, nullptr);
    auto node = std::make_shared<rclcpp::Node>("atlas_hardware_bridge");

    auto gpsPub = node->create_publisher<sensor_msgs::msg::NavSatFix>("/atlas/gps", 10);
    auto cameraPub = node->create_publisher<sensor_msgs::msg::Image>("/atlas/camera/image_raw", 10);
    auto cameraInfoPub = node->create_publisher<sensor_msgs::msg::CameraInfo>("/atlas/camera/camera_info", 10);

    auto motorSub = node->create_subscription<geometry_msgs::msg::Twist>(
      "/atlas/motor/cmd_vel", 10,
      [this](const geometry_msgs::msg::Twist::SharedPtr msg) {
        try {
          std::unordered_map<std::string, double> params;
          params["linear_x"] = msg->linear.x;
          params["linear_y"] = msg->linear.y;
          params["linear_z"] = msg->linear.z;
          params["angular_x"] = msg->angular.x;
          params["angular_y"] = msg->angular.y;
          params["angular_z"] = msg->angular.z;
          motor_->executeCommand("MOVE_TO", params);
        } catch (const std::exception& e) {
          std::cerr << "[ROS2Bridge] motor exec error: " << e.what() << std::endl;
        }
      }
    );

    running_.store(true);
    spinThread_ = std::thread([this, node, gpsPub, cameraPub, cameraInfoPub]() {
      auto lastGps = std::chrono::steady_clock::now();
      auto lastCamera = std::chrono::steady_clock::now();

      while (running_.load() && rclcpp::ok()) {
        auto now = std::chrono::steady_clock::now();

        // GPS: publish at 10 Hz
        if (now - lastGps >= std::chrono::milliseconds(100)) {
          lastGps = now;
          try {
            auto fix = gps_->readFix();
            sensor_msgs::msg::NavSatFix gpsMsg;
            gpsMsg.header.stamp = node->now();
            gpsMsg.header.frame_id = "gps_link";
            gpsMsg.latitude = fix.lat;
            gpsMsg.longitude = fix.lng;
            gpsMsg.altitude = fix.alt;
            gpsMsg.status.status = fix.hasFix ? sensor_msgs::msg::NavSatStatus::STATUS_FIX
                                              : sensor_msgs::msg::NavSatStatus::STATUS_NO_FIX;
            gpsPub->publish(gpsMsg);
          } catch (const std::exception& e) {
            std::cerr << "[ROS2Bridge] GPS pub error: " << e.what() << std::endl;
          }
        }

        // Camera: publish at 15 Hz
        if (now - lastCamera >= std::chrono::milliseconds(66)) {
          lastCamera = now;
          try {
            auto frame = camera_->captureFrame();

            sensor_msgs::msg::Image imgMsg;
            imgMsg.header.stamp = node->now();
            imgMsg.header.frame_id = "camera_link";
            imgMsg.width = frame.width;
            imgMsg.height = frame.height;
            imgMsg.encoding = "rgb8";
            imgMsg.is_bigendian = false;
            imgMsg.step = frame.width * frame.channels;
            imgMsg.data.resize(frame.data.size());
            std::memcpy(imgMsg.data.data(), frame.data.data(), frame.data.size());
            cameraPub->publish(imgMsg);

            sensor_msgs::msg::CameraInfo infoMsg;
            infoMsg.header.stamp = node->now();
            infoMsg.header.frame_id = "camera_link";
            infoMsg.width = frame.width;
            infoMsg.height = frame.height;
            infoMsg.distortion_model = "plumb_bob";
            cameraInfoPub->publish(infoMsg);
          } catch (const std::exception& e) {
            std::cerr << "[ROS2Bridge] Camera pub error: " << e.what() << std::endl;
          }
        }

        rclcpp::spin_some(node);
      }

      rclcpp::shutdown();
    });

    std::cout << "[ROS2Bridge] ROS2 node started" << std::endl;
    return true;
  } catch (const std::exception& e) {
    std::cerr << "[ROS2Bridge] Failed to start: " << e.what() << std::endl;
    running_.store(false);
    return false;
  }
#else
  std::cerr << "[ROS2Bridge] ROS2 support not compiled. Rebuild with -DATLAS_HAS_ROS2=ON" << std::endl;
  return false;
#endif
}

void ROS2Bridge::stop() {
  running_.store(false);
  if (spinThread_.joinable()) {
    spinThread_.join();
  }
}

} // namespace atlas
