#include <gtest/gtest.h>
#include "atlas_navigation/Planning/BehaviorTree.h"

using namespace atlas_navigation;
using namespace atlas_navigation::planning;

TEST(BehaviorTreeTest, ActionNode) {
    bool executed = false;
    auto node = std::make_shared<ActionNode>("action", [&]() {
        executed = true;
        return NodeStatus::SUCCESS;
    });
    EXPECT_EQ(node->tick(), NodeStatus::SUCCESS);
    EXPECT_TRUE(executed);
}

TEST(BehaviorTreeTest, ConditionNodeTrue) {
    auto node = std::make_shared<ConditionNode>("cond", []() { return true; });
    EXPECT_EQ(node->tick(), NodeStatus::SUCCESS);
}

TEST(BehaviorTreeTest, ConditionNodeFalse) {
    auto node = std::make_shared<ConditionNode>("cond", []() { return false; });
    EXPECT_EQ(node->tick(), NodeStatus::FAILURE);
}

TEST(BehaviorTreeTest, SequenceAllSuccess) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::SUCCESS; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::SUCCESS; });
    auto seq = std::make_shared<SequenceNode>("seq", std::vector<std::shared_ptr<BehaviorNode>>{a, b});
    EXPECT_EQ(seq->tick(), NodeStatus::SUCCESS);
}

TEST(BehaviorTreeTest, SequenceFailsEarly) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::FAILURE; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::SUCCESS; });
    auto seq = std::make_shared<SequenceNode>("seq", std::vector<std::shared_ptr<BehaviorNode>>{a, b});
    EXPECT_EQ(seq->tick(), NodeStatus::FAILURE);
}

TEST(BehaviorTreeTest, SelectorFindsSuccess) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::FAILURE; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::SUCCESS; });
    auto sel = std::make_shared<SelectorNode>("sel", std::vector<std::shared_ptr<BehaviorNode>>{a, b});
    EXPECT_EQ(sel->tick(), NodeStatus::SUCCESS);
}

TEST(BehaviorTreeTest, SelectorAllFail) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::FAILURE; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::FAILURE; });
    auto sel = std::make_shared<SelectorNode>("sel", std::vector<std::shared_ptr<BehaviorNode>>{a, b});
    EXPECT_EQ(sel->tick(), NodeStatus::FAILURE);
}

TEST(BehaviorTreeTest, ParallelSuccessThreshold) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::SUCCESS; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::FAILURE; });
    auto par = std::make_shared<ParallelNode>("par", std::vector<std::shared_ptr<BehaviorNode>>{a, b}, 1);
    EXPECT_EQ(par->tick(), NodeStatus::SUCCESS);
}

TEST(BehaviorTreeTest, ParallelFailureImpossible) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::FAILURE; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::FAILURE; });
    auto par = std::make_shared<ParallelNode>("par", std::vector<std::shared_ptr<BehaviorNode>>{a, b}, 1);
    EXPECT_EQ(par->tick(), NodeStatus::FAILURE);
}

TEST(BehaviorTreeTest, ParallelRunning) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::SUCCESS; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::RUNNING; });
    auto par = std::make_shared<ParallelNode>("par", std::vector<std::shared_ptr<BehaviorNode>>{a, b}, 2);
    EXPECT_EQ(par->tick(), NodeStatus::RUNNING);
}

TEST(BehaviorTreeTest, RepeatFinite) {
    int count = 0;
    auto child = std::make_shared<ActionNode>("child", [&]() {
        count++;
        return NodeStatus::SUCCESS;
    });
    auto repeat = std::make_shared<RepeatNode>("repeat", child, 3);
    EXPECT_EQ(repeat->tick(), NodeStatus::RUNNING);
    EXPECT_EQ(repeat->tick(), NodeStatus::RUNNING);
    EXPECT_EQ(repeat->tick(), NodeStatus::SUCCESS);
    EXPECT_EQ(count, 3);
}

TEST(BehaviorTreeTest, RepeatInfinite) {
    auto child = std::make_shared<ActionNode>("child", []() { return NodeStatus::SUCCESS; });
    auto repeat = std::make_shared<RepeatNode>("repeat", child, -1);
    EXPECT_EQ(repeat->tick(), NodeStatus::RUNNING);
    EXPECT_EQ(repeat->tick(), NodeStatus::RUNNING);
}

TEST(BehaviorTreeTest, RepeatFailure) {
    auto child = std::make_shared<ActionNode>("child", []() { return NodeStatus::FAILURE; });
    auto repeat = std::make_shared<RepeatNode>("repeat", child, 5);
    EXPECT_EQ(repeat->tick(), NodeStatus::FAILURE);
}

TEST(BehaviorTreeTest, InverterSuccessToFailure) {
    auto child = std::make_shared<ActionNode>("child", []() { return NodeStatus::SUCCESS; });
    auto inv = std::make_shared<InverterNode>("inv", child);
    EXPECT_EQ(inv->tick(), NodeStatus::FAILURE);
}

TEST(BehaviorTreeTest, InverterFailureToSuccess) {
    auto child = std::make_shared<ActionNode>("child", []() { return NodeStatus::FAILURE; });
    auto inv = std::make_shared<InverterNode>("inv", child);
    EXPECT_EQ(inv->tick(), NodeStatus::SUCCESS);
}

TEST(BehaviorTreeTest, InverterRunningPassThrough) {
    auto child = std::make_shared<ActionNode>("child", []() { return NodeStatus::RUNNING; });
    auto inv = std::make_shared<InverterNode>("inv", child);
    EXPECT_EQ(inv->tick(), NodeStatus::RUNNING);
}

TEST(BehaviorTreeTest, BehaviorTreeRoot) {
    auto root = std::make_shared<ActionNode>("root", []() { return NodeStatus::SUCCESS; });
    BehaviorTree bt(root);
    EXPECT_EQ(bt.tick(), NodeStatus::SUCCESS);
}

TEST(BehaviorTreeTest, BehaviorTreeReset) {
    auto root = std::make_shared<SequenceNode>("seq", std::vector<std::shared_ptr<BehaviorNode>>{
        std::make_shared<ActionNode>("a", []() { return NodeStatus::SUCCESS; })
    });
    BehaviorTree bt(root);
    EXPECT_EQ(bt.tick(), NodeStatus::SUCCESS);
    EXPECT_NO_THROW(bt.reset());
}

TEST(BehaviorTreeTest, SequenceRunning) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::RUNNING; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::SUCCESS; });
    auto seq = std::make_shared<SequenceNode>("seq", std::vector<std::shared_ptr<BehaviorNode>>{a, b});
    EXPECT_EQ(seq->tick(), NodeStatus::RUNNING);
}

TEST(BehaviorTreeTest, SelectorRunning) {
    auto a = std::make_shared<ActionNode>("a", []() { return NodeStatus::RUNNING; });
    auto b = std::make_shared<ActionNode>("b", []() { return NodeStatus::FAILURE; });
    auto sel = std::make_shared<SelectorNode>("sel", std::vector<std::shared_ptr<BehaviorNode>>{a, b});
    EXPECT_EQ(sel->tick(), NodeStatus::RUNNING);
}

TEST(BehaviorTreeTest, CompositeReset) {
    int count = 0;
    auto child = std::make_shared<RepeatNode>("r", 
        std::make_shared<ActionNode>("act", [&]() {
            count++;
            return count >= 2 ? NodeStatus::SUCCESS : NodeStatus::FAILURE;
        }), 3);
    child->reset();
    EXPECT_EQ(child->getName(), "r");
}
