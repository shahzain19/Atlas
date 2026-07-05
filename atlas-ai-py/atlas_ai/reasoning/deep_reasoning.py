import math
import time
import json
from typing import Any


class ReasoningNode:
    def __init__(self, node_id: str, concept: str):
        self.id = node_id
        self.concept = concept
        self.connections: dict[str, float] = {}
        self.depth: int = 0
        self.evidence: float = 0


class ReasoningPath:
    def __init__(self):
        self.nodes: list[ReasoningNode] = []
        self.total_confidence: float = 0
        self.length: int = 0


class ReasoningResult:
    def __init__(self):
        self.conclusions: list[str] = []
        self.paths: list[ReasoningPath] = []
        self.confidence: float = 0
        self.reasoning: list[str] = []


class AnalysisResult:
    def __init__(self):
        self.patterns: list[str] = []
        self.insights: list[str] = []
        self.recommendations: list[str] = []
        self.confidence: float = 0


class PredictionResult:
    def __init__(self):
        self.predictions: list[str] = []
        self.probabilities: dict[str, float] = {}
        self.timeframe: str = ""
        self.confidence: float = 0


class LearningResult:
    def __init__(self):
        self.learned_concepts: list[str] = []
        self.updated_connections: int = 0
        self.confidence: float = 0


class DeepReasoningEngine:
    def __init__(self, semantic_memory=None):
        self.knowledge_graph: dict[str, ReasoningNode] = {}
        self.reasoning_paths: list[ReasoningPath] = []
        self.confidence: float = 0.5
        self.semantic_memory = semantic_memory
        self.max_depth: int = 5
        self.min_confidence: float = 0.3
        self._initialize_core_concepts()

    async def reason(self, query: str, context: list | None = None) -> ReasoningResult:
        reasoning_lines: list[str] = []
        reasoning_lines.append(f'Starting reasoning process for: "{query}"')

        relevant_events: list = []
        if self.semantic_memory is not None and context is not None:
            await self.semantic_memory.add(context[0])
            relevant_events = await self.semantic_memory.search(query, 5)
            reasoning_lines.append(f"Retrieved {len(relevant_events)} relevant memories")

        concepts = self._extract_concepts(query)
        reasoning_lines.append(f"Extracted concepts: {', '.join(concepts)}")

        paths = self._build_reasoning_paths(concepts)
        reasoning_lines.append(f"Built {len(paths)} reasoning paths")

        scored_paths = self._evaluate_paths(paths, concepts)
        reasoning_lines.append("Evaluated paths with confidence scores")

        conclusions = self._derive_conclusions(scored_paths, concepts)
        reasoning_lines.append(f"Derived {len(conclusions)} conclusions")

        self.confidence = self._calculate_overall_confidence(scored_paths)

        result = ReasoningResult()
        result.conclusions = conclusions
        result.paths = scored_paths
        result.confidence = self.confidence
        result.reasoning = reasoning_lines
        return result

    async def analyze(self, data: Any) -> AnalysisResult:
        patterns: list[str] = []
        insights: list[str] = []
        recommendations: list[str] = []

        data_str = data if isinstance(data, str) else json.dumps(data)
        concepts = self._extract_concepts(data_str)

        for concept in concepts:
            node = self.knowledge_graph.get(concept)
            if node is not None:
                patterns.append(f"Found pattern: {concept} with {len(node.connections)} connections")

        for concept in concepts:
            node = self.knowledge_graph.get(concept)
            if node is not None and len(node.connections) > 2:
                insights.append(f"{concept} has strong connections to {len(node.connections)} other concepts")

        if len(insights) > 0:
            recommendations.append("Consider exploring the connected concepts more deeply")
            recommendations.append("The patterns suggest a need for additional data in weak areas")
        else:
            recommendations.append("Build foundational knowledge before deep analysis")

        analysis_confidence = min(1.0, len(patterns) * 0.1 + 0.3)

        result = AnalysisResult()
        result.patterns = patterns
        result.insights = insights
        result.recommendations = recommendations
        result.confidence = analysis_confidence
        return result

    async def predict(self, current_state: str, timeframe: str) -> PredictionResult:
        predictions: list[str] = []
        probabilities: dict[str, float] = {}

        concepts = self._extract_concepts(current_state)

        for concept in concepts:
            node = self.knowledge_graph.get(concept)
            if node is not None:
                for connected, weight in node.connections.items():
                    if connected not in predictions:
                        predictions.append(connected)
                        probabilities[connected] = weight * self.confidence

        predictions.sort(key=lambda c: probabilities.get(c, 0), reverse=True)

        avg_probability = sum(probabilities.values()) / max(1, len(probabilities))

        result = PredictionResult()
        result.predictions = predictions[:5]
        result.probabilities = probabilities
        result.timeframe = timeframe
        result.confidence = avg_probability
        return result

    async def learn(self, new_information: str) -> LearningResult:
        learned_concepts: list[str] = []
        updated_connections = 0

        new_concepts = self._extract_concepts(new_information)

        for concept in new_concepts:
            if concept not in self.knowledge_graph:
                node = ReasoningNode(
                    node_id=self._generate_id(),
                    concept=concept,
                )
                node.depth = 0
                node.evidence = 1
                self.knowledge_graph[concept] = node
                learned_concepts.append(concept)

        for i in range(len(new_concepts)):
            for j in range(i + 1, len(new_concepts)):
                node_a = self.knowledge_graph.get(new_concepts[i])
                node_b = self.knowledge_graph.get(new_concepts[j])

                if node_a is not None and node_b is not None:
                    existing_a = node_a.connections.get(node_b.concept, 0)
                    existing_b = node_b.connections.get(node_a.concept, 0)

                    node_a.connections[node_b.concept] = existing_a + 0.1
                    node_b.connections[node_a.concept] = existing_b + 0.1
                    updated_connections += 1

        self.confidence = min(0.95, self.confidence + 0.05)

        result = LearningResult()
        result.learned_concepts = learned_concepts
        result.updated_connections = updated_connections
        result.confidence = self.confidence
        return result

    def get_knowledge_graph(self) -> dict[str, ReasoningNode]:
        return dict(self.knowledge_graph)

    def get_confidence(self) -> float:
        return self.confidence

    def get_reasoning_paths(self) -> list[ReasoningPath]:
        return list(self.reasoning_paths)

    def clear(self):
        self.knowledge_graph.clear()
        self.reasoning_paths = []
        self.confidence = 0.5
        self._initialize_core_concepts()

    def _initialize_core_concepts(self):
        core_concepts = [
            "state", "action", "goal", "constraint", "outcome",
            "reasoning", "learning", "prediction", "analysis", "optimization",
        ]

        for concept in core_concepts:
            node = ReasoningNode(node_id=self._generate_id(), concept=concept)
            node.depth = 0
            node.evidence = 0.5
            self.knowledge_graph[concept] = node

        concepts_list = list(self.knowledge_graph.keys())
        for i in range(len(concepts_list)):
            for j in range(i + 1, len(concepts_list)):
                node_a = self.knowledge_graph[concepts_list[i]]
                node_b = self.knowledge_graph[concepts_list[j]]
                weight = 0.1 + (hash(concepts_list[i] + concepts_list[j]) % 1000) / 5000.0
                node_a.connections[concepts_list[j]] = weight
                node_b.connections[concepts_list[i]] = weight

    def _extract_concepts(self, text: str) -> list[str]:
        words = text.lower().split()
        seen: set[str] = set()
        concepts: list[str] = []
        for word in words:
            cleaned = "".join(c for c in word if c.isalnum())
            if len(cleaned) > 2 and cleaned not in seen:
                seen.add(cleaned)
                concepts.append(cleaned)
        return concepts

    def _build_reasoning_paths(self, concepts: list[str]) -> list[ReasoningPath]:
        paths: list[ReasoningPath] = []
        for concept in concepts:
            node = self.knowledge_graph.get(concept)
            if node is not None:
                path = self._explore_node(node, 0)
                if len(path.nodes) > 0:
                    paths.append(path)
        return paths

    def _explore_node(self, node: ReasoningNode, depth: int) -> ReasoningPath:
        if depth >= self.max_depth:
            path = ReasoningPath()
            path.nodes = [node]
            path.total_confidence = node.evidence
            path.length = 1
            return path

        path_nodes: list[ReasoningNode] = [node]
        total_confidence = node.evidence

        connections = sorted(node.connections.items(), key=lambda x: x[1], reverse=True)

        for concept, weight in connections[:2]:
            if weight > self.min_confidence:
                connected_node = self.knowledge_graph.get(concept)
                if connected_node is not None:
                    sub_path = self._explore_node(connected_node, depth + 1)
                    path_nodes.extend(sub_path.nodes)
                    total_confidence += weight * sub_path.total_confidence

        path = ReasoningPath()
        path.nodes = path_nodes
        path.total_confidence = total_confidence
        path.length = len(path_nodes)
        return path

    def _evaluate_paths(self, paths: list[ReasoningPath], concepts: list[str]) -> list[ReasoningPath]:
        scored = []
        for path in paths:
            p = ReasoningPath()
            p.nodes = list(path.nodes)
            p.total_confidence = path.total_confidence * (path.length / self.max_depth)
            p.length = path.length
            scored.append(p)
        scored.sort(key=lambda x: x.total_confidence, reverse=True)
        return scored

    def _derive_conclusions(self, paths: list[ReasoningPath], concepts: list[str]) -> list[str]:
        conclusions: list[str] = []
        for path in paths[:3]:
            if len(path.nodes) > 0:
                first_concept = path.nodes[0].concept
                last_concept = path.nodes[-1].concept
                conclusions.append(
                    f'Based on analysis of "{first_concept}", '
                    f'the reasoning leads to "{last_concept}" with confidence {path.total_confidence:.2f}'
                )
        return conclusions

    def _calculate_overall_confidence(self, paths: list[ReasoningPath]) -> float:
        if len(paths) == 0:
            return 0.5
        total = sum(p.total_confidence for p in paths[:3])
        avg = total / min(3, len(paths))
        return min(0.95, avg)

    def _generate_id(self) -> str:
        return f"node_{int(time.time() * 1000)}_{int(hash(str(time.time())) % 1000000)}"
