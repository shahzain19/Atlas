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

# Collect all test sources
file(GLOB_RECURSE TEST_SOURCES tests/*.cpp)

# Build the hardware library (header-only library target)
add_library(atlas_hardware INTERFACE)
target_include_directories(atlas_hardware INTERFACE include)

# Test executable
add_executable(atlas_hardware_tests ${TEST_SOURCES})
target_link_libraries(atlas_hardware_tests PRIVATE atlas_hardware GTest::gtest_main GTest::gmock)

# Enable testing
enable_testing()
add_test(NAME atlas_hardware COMMAND atlas_hardware_tests)
