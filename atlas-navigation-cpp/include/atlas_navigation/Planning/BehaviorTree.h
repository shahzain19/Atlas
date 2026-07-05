#pragma once

#include <string>
#include <vector>
#include <memory>
#include <functional>

namespace atlas_navigation {
namespace planning {

enum class NodeStatus : uint8_t {
    SUCCESS,
    FAILURE,
    RUNNING
};

class BehaviorNode {
public:
    explicit BehaviorNode(const std::string& name) : name_(name) {}
    virtual ~BehaviorNode() = default;
    virtual NodeStatus tick() = 0;
    virtual void reset() {}
    const std::string& getName() const { return name_; }

private:
    std::string name_;
};

class ActionNode : public BehaviorNode {
public:
    using ActionFn = std::function<NodeStatus()>;
    ActionNode(const std::string& name, ActionFn action);
    NodeStatus tick() override;

private:
    ActionFn action_;
};

inline ActionNode::ActionNode(const std::string& name, ActionFn action)
    : BehaviorNode(name), action_(std::move(action)) {}

inline NodeStatus ActionNode::tick() {
    return action_();
}

class ConditionNode : public BehaviorNode {
public:
    using ConditionFn = std::function<bool()>;
    ConditionNode(const std::string& name, ConditionFn condition);
    NodeStatus tick() override;

private:
    ConditionFn condition_;
};

inline ConditionNode::ConditionNode(const std::string& name, ConditionFn condition)
    : BehaviorNode(name), condition_(std::move(condition)) {}

inline NodeStatus ConditionNode::tick() {
    return condition_() ? NodeStatus::SUCCESS : NodeStatus::FAILURE;
}

class SequenceNode : public BehaviorNode {
public:
    SequenceNode(const std::string& name, std::vector<std::shared_ptr<BehaviorNode>> children);
    NodeStatus tick() override;
    void reset() override;

private:
    std::vector<std::shared_ptr<BehaviorNode>> children_;
};

inline SequenceNode::SequenceNode(const std::string& name, std::vector<std::shared_ptr<BehaviorNode>> children)
    : BehaviorNode(name), children_(std::move(children)) {}

inline NodeStatus SequenceNode::tick() {
    for (auto& child : children_) {
        NodeStatus status = child->tick();
        if (status == NodeStatus::FAILURE || status == NodeStatus::RUNNING) {
            return status;
        }
    }
    return NodeStatus::SUCCESS;
}

inline void SequenceNode::reset() {
    for (auto& child : children_) {
        child->reset();
    }
}

class SelectorNode : public BehaviorNode {
public:
    SelectorNode(const std::string& name, std::vector<std::shared_ptr<BehaviorNode>> children);
    NodeStatus tick() override;
    void reset() override;

private:
    std::vector<std::shared_ptr<BehaviorNode>> children_;
};

inline SelectorNode::SelectorNode(const std::string& name, std::vector<std::shared_ptr<BehaviorNode>> children)
    : BehaviorNode(name), children_(std::move(children)) {}

inline NodeStatus SelectorNode::tick() {
    for (auto& child : children_) {
        NodeStatus status = child->tick();
        if (status == NodeStatus::SUCCESS || status == NodeStatus::RUNNING) {
            return status;
        }
    }
    return NodeStatus::FAILURE;
}

inline void SelectorNode::reset() {
    for (auto& child : children_) {
        child->reset();
    }
}

class ParallelNode : public BehaviorNode {
public:
    ParallelNode(const std::string& name, std::vector<std::shared_ptr<BehaviorNode>> children,
                 int successThreshold);
    NodeStatus tick() override;
    void reset() override;

private:
    std::vector<std::shared_ptr<BehaviorNode>> children_;
    int successThreshold_;
};

inline ParallelNode::ParallelNode(const std::string& name, std::vector<std::shared_ptr<BehaviorNode>> children,
                                   int successThreshold)
    : BehaviorNode(name), children_(std::move(children)), successThreshold_(successThreshold) {}

inline NodeStatus ParallelNode::tick() {
    int successes = 0;
    int failures = 0;
    for (auto& child : children_) {
        NodeStatus status = child->tick();
        if (status == NodeStatus::SUCCESS) successes++;
        else if (status == NodeStatus::FAILURE) failures++;
    }
    if (successes >= successThreshold_) return NodeStatus::SUCCESS;
    int maxPossible = static_cast<int>(children_.size()) - failures;
    if (maxPossible < successThreshold_) return NodeStatus::FAILURE;
    return NodeStatus::RUNNING;
}

inline void ParallelNode::reset() {
    for (auto& child : children_) {
        child->reset();
    }
}

class RepeatNode : public BehaviorNode {
public:
    RepeatNode(const std::string& name, std::shared_ptr<BehaviorNode> child, int times);
    NodeStatus tick() override;
    void reset() override;

private:
    std::shared_ptr<BehaviorNode> child_;
    int times_;
    int successCount_ = 0;
};

inline RepeatNode::RepeatNode(const std::string& name, std::shared_ptr<BehaviorNode> child, int times)
    : BehaviorNode(name), child_(std::move(child)), times_(times) {}

inline NodeStatus RepeatNode::tick() {
    NodeStatus status = child_->tick();
    if (status == NodeStatus::FAILURE) return NodeStatus::FAILURE;
    if (status == NodeStatus::SUCCESS) {
        if (times_ == -1) return NodeStatus::RUNNING;
        successCount_++;
        if (successCount_ >= times_) return NodeStatus::SUCCESS;
    }
    return NodeStatus::RUNNING;
}

inline void RepeatNode::reset() {
    successCount_ = 0;
    child_->reset();
}

class InverterNode : public BehaviorNode {
public:
    InverterNode(const std::string& name, std::shared_ptr<BehaviorNode> child);
    NodeStatus tick() override;
    void reset() override;

private:
    std::shared_ptr<BehaviorNode> child_;
};

inline InverterNode::InverterNode(const std::string& name, std::shared_ptr<BehaviorNode> child)
    : BehaviorNode(name), child_(std::move(child)) {}

inline NodeStatus InverterNode::tick() {
    NodeStatus status = child_->tick();
    if (status == NodeStatus::SUCCESS) return NodeStatus::FAILURE;
    if (status == NodeStatus::FAILURE) return NodeStatus::SUCCESS;
    return NodeStatus::RUNNING;
}

inline void InverterNode::reset() {
    child_->reset();
}

class BehaviorTree {
public:
    explicit BehaviorTree(std::shared_ptr<BehaviorNode> root);
    NodeStatus tick();
    void reset();

private:
    std::shared_ptr<BehaviorNode> root_;
};

inline BehaviorTree::BehaviorTree(std::shared_ptr<BehaviorNode> root) : root_(std::move(root)) {}

inline NodeStatus BehaviorTree::tick() {
    return root_->tick();
}

inline void BehaviorTree::reset() {
    root_->reset();
}

} // namespace planning
} // namespace atlas_navigation
