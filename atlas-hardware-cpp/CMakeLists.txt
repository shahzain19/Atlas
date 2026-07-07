cmake_minimum_required(VERSION 3.20)
project(atlas-hardware VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# ---- Google Test ----
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.16.0
)
set(gtest_force_shared_libs ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

include_directories(include)

# Build the hardware library (header-only library target)
add_library(atlas_hardware INTERFACE)
target_include_directories(atlas_hardware INTERFACE include)

# ---- Optional ROS2 support ----
find_package(rclcpp QUIET)
find_package(sensor_msgs QUIET)
find_package(geometry_msgs QUIET)

if(rclcpp_FOUND AND sensor_msgs_FOUND AND geometry_msgs_FOUND)
  add_definitions(-DATLAS_HAS_ROS2)
  message(STATUS "ROS2 found — building ROS2Bridge")
  set(ROS2_SOURCES src/ROS2Bridge.cpp)
  set(ROS2_LIBS rclcpp::rclcpp sensor_msgs::sensor_msgs geometry_msgs::geometry_msgs)
else()
  message(STATUS "ROS2 not found — ROS2Bridge will be a stub")
  set(ROS2_SOURCES)
  set(ROS2_LIBS)
endif()

# Hardware daemon executable (JSON IPC bridge for TS/Python)
add_executable(atlas_hardware_daemon src/hardware_daemon.cpp ${ROS2_SOURCES})
target_link_libraries(atlas_hardware_daemon PRIVATE atlas_hardware ${ROS2_LIBS})

# Collect all test sources
file(GLOB_RECURSE TEST_SOURCES tests/*.cpp)

# Test executable
add_executable(atlas_hardware_tests ${TEST_SOURCES})
target_link_libraries(atlas_hardware_tests PRIVATE atlas_hardware GTest::gtest_main GTest::gmock)

# Enable testing
enable_testing()
add_test(NAME atlas_hardware COMMAND atlas_hardware_tests)
