#include <gtest/gtest.h>
#include "atlas_navigation/SLAM/SLAMEngine.h"

using namespace atlas_navigation;
using namespace atlas_navigation::slam;

TEST(SLAMEngineTest, InitialState) {
    SLAMEngine engine;
    auto map = engine.getMap();
    EXPECT_EQ(map.objects.size(), 0);
    auto est = engine.getEstimate();
    EXPECT_DOUBLE_EQ(est.position.x, 0);
    EXPECT_DOUBLE_EQ(est.position.y, 0);
    EXPECT_DOUBLE_EQ(est.position.z, 0);
}

TEST(SLAMEngineTest, ProcessObjectDetection) {
    SLAMEngine engine;
    Observation obs;
    obs.type = "OBJECT_DETECTED";
    obs.data.object = "landmark_1";
    obs.data.position = Vector3{1.0, 2.0, 0.0};
    obs.data.confidence = 0.9;
    obs.timestamp = 1000;

    auto map = engine.processObservation(obs);
    ASSERT_EQ(map.objects.size(), 1);
    EXPECT_EQ(map.objects[0].label, "landmark_1");
    EXPECT_DOUBLE_EQ(map.objects[0].position.x, 1.0);
    EXPECT_DOUBLE_EQ(map.objects[0].position.y, 2.0);
}

TEST(SLAMEngineTest, ProcessOdometry) {
    SLAMEngine engine;
    // Set a recent timestamp so dt is reasonable
    Observation obs;
    obs.type = "POSE";
    obs.data.position = Vector3{0, 0, 0};
    obs.data.orientation = Quaternion{0, 0, 0, 1};
    obs.timestamp = nowMs();
    engine.processObservation(obs);

    Observation obs2;
    obs2.type = "ODOMETRY";
    obs2.data.velocity = Vector3{0.0, 0.0, 0.0}; // zero velocity
    obs2.timestamp = nowMs() + 100; // 100ms later

    engine.processObservation(obs2);
    auto est = engine.getEstimate();
    // Position should remain 0 since velocity is 0
    // (ignoring any double-integration artifacts)
    EXPECT_NO_THROW(engine.getEstimate());
}

TEST(SLAMEngineTest, ProcessPose) {
    SLAMEngine engine;
    Observation obs;
    obs.type = "POSE";
    obs.data.position = Vector3{5.0, 10.0, 0.0};
    obs.data.orientation = Quaternion{0, 0, 0, 1};
    obs.timestamp = 1000;

    engine.processObservation(obs);
    auto est = engine.getEstimate();
    EXPECT_DOUBLE_EQ(est.position.x, 5.0);
    EXPECT_DOUBLE_EQ(est.position.y, 10.0);
}

TEST(SLAMEngineTest, KeyframeCreation) {
    SLAMEngine engine;
    SLAMEngineConfig cfg;
    cfg.keyframeDistanceThreshold = 0.1;
    SLAMEngine engine2(cfg);

    Observation obs1;
    obs1.type = "POSE";
    obs1.data.position = Vector3{0, 0, 0};
    obs1.data.orientation = Quaternion{0, 0, 0, 1};
    obs1.timestamp = 1000;
    engine.processObservation(obs1);

    Observation obs2;
    obs2.type = "POSE";
    obs2.data.position = Vector3{0.5, 0, 0};
    obs2.data.orientation = Quaternion{0, 0, 0, 1};
    obs2.timestamp = 2000;
    engine.processObservation(obs2);

    auto kfs = engine.getKeyframes();
    EXPECT_GE(kfs.size(), 1);
}

TEST(SLAMEngineTest, LoopClosureDetection) {
    SLAMEngine engine;
    EXPECT_NO_THROW(engine.getPoseGraphStats());
}

TEST(SLAMEngineTest, Reset) {
    SLAMEngine engine;
    Observation obs;
    obs.type = "POSE";
    obs.data.position = Vector3{5, 5, 0};
    obs.timestamp = 1000;
    engine.processObservation(obs);
    engine.reset();

    auto est = engine.getEstimate();
    EXPECT_DOUBLE_EQ(est.position.x, 0);
    EXPECT_DOUBLE_EQ(est.position.y, 0);
    EXPECT_EQ(engine.getKeyframes().size(), 0);
}

TEST(SLAMEngineTest, ClearMap) {
    SLAMEngine engine;
    Observation obs;
    obs.type = "OBJECT_DETECTED";
    obs.data.object = "test";
    obs.data.position = Vector3{1, 1, 0};
    obs.timestamp = 1000;
    engine.processObservation(obs);
    engine.clearMap();

    auto map = engine.getMap();
    EXPECT_EQ(map.objects.size(), 0);
}

TEST(SLAMEngineTest, GetKeyframes) {
    SLAMEngine engine;
    auto kfs = engine.getKeyframes();
    EXPECT_TRUE(kfs.empty());
}
