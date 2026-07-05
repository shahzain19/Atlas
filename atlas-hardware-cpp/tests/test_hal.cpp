#include <gtest/gtest.h>
#include "atlas_hardware/HAL/HardwareAbstractionLayer.h"

using namespace atlas;

class MockTestDriver : public BaseDriver {
  std::string id_;
  std::string name_;
  std::string type_;
  HardwareStatus status_ = HardwareStatus::DISCONNECTED;
public:
  MockTestDriver(std::string id, std::string name, std::string type)
    : id_(std::move(id)), name_(std::move(name)), type_(std::move(type)) {}
  std::string id() const override { return id_; }
  std::string name() const override { return name_; }
  std::string type() const override { return type_; }
  HardwareStatus status() const override { return status_; }
  std::vector<std::string> capabilities() const override { return {"test"}; }
  void initialize() override { status_ = HardwareStatus::CONNECTED; }
  void shutdown() override { status_ = HardwareStatus::DISCONNECTED; }
  void reset() override { status_ = HardwareStatus::INITIALIZING; }
  HealthResult getHealth() override {
    HealthResult r; r.value = 1.0; return r;
  }
};

TEST(HALTest, RegistersAndRetrievesDrivers) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto driver = std::make_shared<MockTestDriver>("mock-001", "Mock Driver", "mock");

  hal->registerDriver(driver);
  auto retrieved = hal->getDriver("mock-001");
  EXPECT_EQ(retrieved->id(), "mock-001");
  EXPECT_EQ(retrieved->name(), "Mock Driver");
}

TEST(HALTest, GetsDriversByType) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  hal->registerDriver(std::make_shared<MockTestDriver>("d1", "D1", "mock"));
  hal->registerDriver(std::make_shared<MockTestDriver>("d2", "D2", "other"));

  auto mocks = hal->getDriversByType("mock");
  EXPECT_EQ(mocks.size(), 1);
  EXPECT_EQ(mocks[0]->id(), "d1");
}

TEST(HALTest, GetAllHardwareInfo) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  hal->registerDriver(std::make_shared<MockTestDriver>("d1", "D1", "mock"));

  auto infos = hal->getAllHardwareInfo();
  ASSERT_EQ(infos.size(), 1);
  EXPECT_EQ(infos[0].id, "d1");
  EXPECT_EQ(infos[0].name, "D1");
}

TEST(HALTest, InitializeAndShutdownAll) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto driver = std::make_shared<MockTestDriver>("d1", "D1", "mock");
  hal->registerDriver(driver);

  EXPECT_EQ(driver->status(), HardwareStatus::DISCONNECTED);
  hal->initializeAll();
  EXPECT_EQ(driver->status(), HardwareStatus::CONNECTED);
  hal->shutdownAll();
  EXPECT_EQ(driver->status(), HardwareStatus::DISCONNECTED);
}

TEST(HALTest, UnregisterDriver) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  hal->registerDriver(std::make_shared<MockTestDriver>("d1", "D1", "mock"));
  EXPECT_TRUE(hal->getDriver("d1") != nullptr);
  hal->unregisterDriver("d1");
  EXPECT_TRUE(hal->getDriver("d1") == nullptr);
}
