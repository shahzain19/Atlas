# CMake generated Testfile for 
# Source directory: /home/shyn/Desktop/Atlas/atlas-hardware-cpp
# Build directory: /home/shyn/Desktop/Atlas/build
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test([=[atlas_hardware]=] "/home/shyn/Desktop/Atlas/build/atlas_hardware_tests")
set_tests_properties([=[atlas_hardware]=] PROPERTIES  _BACKTRACE_TRIPLES "/home/shyn/Desktop/Atlas/atlas-hardware-cpp/CMakeLists.txt;33;add_test;/home/shyn/Desktop/Atlas/atlas-hardware-cpp/CMakeLists.txt;0;")
subdirs("_deps/googletest-build")
