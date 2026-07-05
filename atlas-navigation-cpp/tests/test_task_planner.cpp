#include <gtest/gtest.h>
#include "atlas_navigation/Planning/TaskPlanner.h"

using namespace atlas_navigation;
using namespace atlas_navigation::planning;

TEST(TaskPlannerTest, GenerateDefaultTasks) {
    TaskPlanner planner;
    auto tasks = planner.generateTasks();
    ASSERT_EQ(tasks.size(), 2);
    EXPECT_EQ(tasks[0].name, "Move forward");
    EXPECT_EQ(tasks[1].name, "Scan surroundings");
    EXPECT_EQ(tasks[0].status, TaskStatus::PENDING);
}

TEST(TaskPlannerTest, GenerateWithGoal) {
    TaskPlanner planner;
    auto tasks = planner.generateTasks("Explore the environment");
    ASSERT_EQ(tasks.size(), 2);
}

TEST(TaskPlannerTest, InspectGoalDecomposition) {
    TaskPlanner planner;
    auto tasks = planner.generateTasks("inspect");
    ASSERT_GE(tasks.size(), 4);
    EXPECT_EQ(tasks[2].name, "Navigate to inspection point");
    EXPECT_EQ(tasks[3].name, "Capture inspection data");
    EXPECT_EQ(tasks[4].name, "Analyze inspection data");
}

TEST(TaskPlannerTest, SurveyGoalDecomposition) {
    TaskPlanner planner;
    auto tasks = planner.generateTasks("survey");
    ASSERT_GE(tasks.size(), 4);
    EXPECT_EQ(tasks[2].name, "Takeoff");
    EXPECT_EQ(tasks[3].name, "Search area");
    EXPECT_EQ(tasks[4].name, "Land");
}

TEST(TaskPlannerTest, TaskStatusValues) {
    EXPECT_NE(static_cast<int>(TaskStatus::PENDING), static_cast<int>(TaskStatus::ACTIVE));
    EXPECT_NE(static_cast<int>(TaskStatus::ACTIVE), static_cast<int>(TaskStatus::COMPLETED));
    EXPECT_NE(static_cast<int>(TaskStatus::COMPLETED), static_cast<int>(TaskStatus::FAILED));
}
