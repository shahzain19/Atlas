#pragma once

#include "../Types.h"
#include <string>
#include <vector>
#include <functional>

namespace atlas_navigation {
namespace planning {

enum class TaskStatus : uint8_t {
    PENDING,
    ACTIVE,
    COMPLETED,
    FAILED
};

struct Task {
    std::string id;
    std::string name;
    TaskStatus status = TaskStatus::PENDING;
    std::function<void()> run;
};

class TaskPlanner {
public:
    std::vector<Task> generateTasks(const std::string& goal = "Explore the environment");
};

inline std::vector<Task> TaskPlanner::generateTasks(const std::string& goal) {
    std::vector<Task> tasks;

    tasks.push_back({
        "task-1",
        "Move forward",
        TaskStatus::PENDING,
        []() { /* Moving forward */ }
    });

    tasks.push_back({
        "task-2",
        "Scan surroundings",
        TaskStatus::PENDING,
        []() { /* Scanning surroundings */ }
    });

    if (goal.find("inspect") != std::string::npos) {
        tasks.push_back({
            "task-3",
            "Navigate to inspection point",
            TaskStatus::PENDING,
            []() { /* Navigating to inspection point */ }
        });
        tasks.push_back({
            "task-4",
            "Capture inspection data",
            TaskStatus::PENDING,
            []() { /* Capturing inspection data */ }
        });
        tasks.push_back({
            "task-5",
            "Analyze inspection data",
            TaskStatus::PENDING,
            []() { /* Analyzing inspection data */ }
        });
    } else if (goal.find("survey") != std::string::npos) {
        tasks.push_back({
            "task-3",
            "Takeoff",
            TaskStatus::PENDING,
            []() { /* Taking off */ }
        });
        tasks.push_back({
            "task-4",
            "Search area",
            TaskStatus::PENDING,
            []() { /* Searching area */ }
        });
        tasks.push_back({
            "task-5",
            "Land",
            TaskStatus::PENDING,
            []() { /* Landing */ }
        });
    }

    return tasks;
}

} // namespace planning
} // namespace atlas_navigation
