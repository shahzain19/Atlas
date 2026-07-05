import { SemanticMemory } from "../../atlas-runtime/Memory/SemanticMemory";
import { Event } from "../../atlas-kernel/Event/Event";

export interface ReasoningNode {
  id: string;
  concept: string;
  connections: Map<string, number>;
  depth: number;
  evidence: number;
}

export interface ReasoningPath {
  nodes: ReasoningNode[];
  totalConfidence: number;
  length: number;
}

export interface ReasoningResult {
  conclusions: string[];
  paths: ReasoningPath[];
  confidence: number;
  reasoning: string[];
}

export interface AnalysisResult {
  patterns: string[];
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export interface PredictionResult {
  predictions: string[];
  probabilities: Map<string, number>;
  timeframe: string;
  confidence: number;
}

export interface LearningResult {
  learnedConcepts: string[];
  updatedConnections: number;
  confidence: number;
}

/**
 * DeepReasoningEngine - Advanced reasoning component for complex problem solving
 * Integrates with SemanticMemory for context-aware reasoning
 */
export class DeepReasoningEngine {
  private knowledgeGraph: Map<string, ReasoningNode>;
  private reasoningPaths: ReasoningPath[];
  private confidence: number;
  private semanticMemory: SemanticMemory | null;
  private maxDepth: number;
  private minConfidence: number;

  constructor(semanticMemory?: SemanticMemory) {
    this.knowledgeGraph = new Map();
    this.reasoningPaths = [];
    this.confidence = 0.5;
    this.semanticMemory = semanticMemory || null;
    this.maxDepth = 5;
    this.minConfidence = 0.3;
    this.initializeCoreConcepts();
  }

  /**
   * Main reasoning method - performs deep analysis to reach conclusions
   */
  async reason(query: string, context?: Event[]): Promise<ReasoningResult> {
    const reasoning: string[] = [];
    reasoning.push(`Starting reasoning process for: "${query}"`);

    // Retrieve relevant context from semantic memory
    let relevantEvents: Event[] = [];
    if (this.semanticMemory && context && context.length > 0) {
      for (const event of context) {
        await this.semanticMemory.add(event);
      }
      relevantEvents = await this.semanticMemory.search(query, 5);
      reasoning.push(`Retrieved ${relevantEvents.length} relevant memories`);
    }

    // Analyze the query
    const concepts = this.extractConcepts(query);
    reasoning.push(`Extracted concepts: ${concepts.join(", ")}`);

    // Build reasoning paths
    const paths = this.buildReasoningPaths(concepts);
    reasoning.push(`Built ${paths.length} reasoning paths`);

    // Evaluate and score paths
    const scoredPaths = this.evaluatePaths(paths, concepts);
    reasoning.push(`Evaluated paths with confidence scores`);

    // Derive conclusions
    const conclusions = this.deriveConclusions(scoredPaths, concepts);
    reasoning.push(`Derived ${conclusions.length} conclusions`);

    // Update confidence based on path quality
    this.confidence = this.calculateOverallConfidence(scoredPaths);

    return {
      conclusions,
      paths: scoredPaths,
      confidence: this.confidence,
      reasoning,
    };
  }

  /**
   * Analyzes input data to identify patterns and insights
   */
  async analyze(data: any): Promise<AnalysisResult> {
    const patterns: string[] = [];
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Convert data to string for analysis
    const dataStr = typeof data === "string" ? data : JSON.stringify(data);
    const concepts = this.extractConcepts(dataStr);

    // Identify patterns in the knowledge graph
    for (const concept of concepts) {
      const node = this.knowledgeGraph.get(concept);
      if (node) {
        patterns.push(`Found pattern: ${concept} with ${node.connections.size} connections`);
      }
    }

    // Generate insights based on connections
    for (const concept of concepts) {
      const node = this.knowledgeGraph.get(concept);
      if (node && node.connections.size > 2) {
        insights.push(`${concept} has strong connections to ${node.connections.size} other concepts`);
      }
    }

    // Generate recommendations
    if (insights.length > 0) {
      recommendations.push("Consider exploring the connected concepts more deeply");
      recommendations.push("The patterns suggest a need for additional data in weak areas");
    } else {
      recommendations.push("Build foundational knowledge before deep analysis");
    }

    // Update confidence based on analysis depth
    const analysisConfidence = Math.min(1, patterns.length * 0.1 + 0.3);

    return {
      patterns,
      insights,
      recommendations,
      confidence: analysisConfidence,
    };
  }

  /**
   * Predicts future outcomes based on current state
   */
  async predict(currentState: string, timeframe: string): Promise<PredictionResult> {
    const predictions: string[] = [];
    const probabilities = new Map<string, number>();

    // Extract concepts from current state
    const concepts = this.extractConcepts(currentState);

    // Find paths to future states
    for (const concept of concepts) {
      const node = this.knowledgeGraph.get(concept);
      if (node) {
        // Predict based on connected nodes
        for (const [connected, weight] of node.connections) {
          if (!predictions.includes(connected)) {
            predictions.push(connected);
            probabilities.set(connected, weight * this.confidence);
          }
        }
      }
    }

    // Sort by probability
    predictions.sort((a, b) => (probabilities.get(b) || 0) - (probabilities.get(a) || 0));

    // Generate confidence based on prediction certainty
    const avgProbability = Array.from(probabilities.values()).reduce((a, b) => a + b, 0) /
      Math.max(1, probabilities.size);

    return {
      predictions: predictions.slice(0, 5),
      probabilities,
      timeframe,
      confidence: avgProbability,
    };
  }

  /**
   * Learns from new information and updates the knowledge graph
   */
  async learn(newInformation: string): Promise<LearningResult> {
    const learnedConcepts: string[] = [];
    let updatedConnections = 0;

    // Extract new concepts
    const newConcepts = this.extractConcepts(newInformation);

    // Add new concepts to knowledge graph
    for (const concept of newConcepts) {
      if (!this.knowledgeGraph.has(concept)) {
        const node: ReasoningNode = {
          id: this.generateId(),
          concept,
          connections: new Map(),
          depth: 0,
          evidence: 1,
        };
        this.knowledgeGraph.set(concept, node);
        learnedConcepts.push(concept);
      }
    }

    // Create connections between concepts
    for (let i = 0; i < newConcepts.length; i++) {
      for (let j = i + 1; j < newConcepts.length; j++) {
        const nodeA = this.knowledgeGraph.get(newConcepts[i]);
        const nodeB = this.knowledgeGraph.get(newConcepts[j]);

        if (nodeA && nodeB) {
          const existingWeightA = nodeA.connections.get(nodeB.concept) || 0;
          const existingWeightB = nodeB.connections.get(nodeA.concept) || 0;

          nodeA.connections.set(nodeB.concept, existingWeightA + 0.1);
          nodeB.connections.set(nodeA.concept, existingWeightB + 0.1);
          updatedConnections++;
        }
      }
    }

    // Increase confidence with more learning
    this.confidence = Math.min(0.95, this.confidence + 0.05);

    return {
      learnedConcepts,
      updatedConnections,
      confidence: this.confidence,
    };
  }

  /**
   * Gets the current knowledge graph
   */
  getKnowledgeGraph(): Map<string, ReasoningNode> {
    return new Map(this.knowledgeGraph);
  }

  /**
   * Gets the current confidence level
   */
  getConfidence(): number {
    return this.confidence;
  }

  /**
   * Gets all reasoning paths
   */
  getReasoningPaths(): ReasoningPath[] {
    return [...this.reasoningPaths];
  }

  /**
   * Clears the knowledge graph
   */
  clear(): void {
    this.knowledgeGraph.clear();
    this.reasoningPaths = [];
    this.confidence = 0.5;
    this.initializeCoreConcepts();
  }

  /**
   * Initializes core concepts in the knowledge graph
   */
  private initializeCoreConcepts(): void {
    const coreConcepts = [
      "state",
      "action",
      "goal",
      "constraint",
      "outcome",
      "reasoning",
      "learning",
      "prediction",
      "analysis",
      "optimization",
    ];

    for (const concept of coreConcepts) {
      const node: ReasoningNode = {
        id: this.generateId(),
        concept,
        connections: new Map(),
        depth: 0,
        evidence: 0.5,
      };
      this.knowledgeGraph.set(concept, node);
    }

    // Create some basic connections
    const concepts = Array.from(this.knowledgeGraph.keys());
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const nodeA = this.knowledgeGraph.get(concepts[i]);
        const nodeB = this.knowledgeGraph.get(concepts[j]);
        if (nodeA && nodeB) {
          const weight = 0.1 + Math.random() * 0.2;
          nodeA.connections.set(concepts[j], weight);
          nodeB.connections.set(concepts[i], weight);
        }
      }
    }
  }

  /**
   * Extracts concepts from text
   */
  private extractConcepts(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const concepts = new Set<string>();

    for (const word of words) {
      if (word.length > 2) {
        concepts.add(word);
      }
    }

    return Array.from(concepts);
  }

  /**
   * Builds reasoning paths through the knowledge graph
   */
  private buildReasoningPaths(concepts: string[]): ReasoningPath[] {
    const paths: ReasoningPath[] = [];

    for (const concept of concepts) {
      const node = this.knowledgeGraph.get(concept);
      if (node) {
        const path = this.exploreNode(node, 0);
        if (path.nodes.length > 0) {
          paths.push(path);
        }
      }
    }

    return paths;
  }

  /**
   * Explores a node and builds a reasoning path
   */
  private exploreNode(node: ReasoningNode, depth: number): ReasoningPath {
    if (depth >= this.maxDepth) {
      return {
        nodes: [node],
        totalConfidence: node.evidence,
        length: 1,
      };
    }

    const pathNodes: ReasoningNode[] = [node];
    let totalConfidence = node.evidence;

    // Find connected nodes with highest weight
    const connections = Array.from(node.connections.entries());
    connections.sort((a, b) => b[1] - a[1]);

    for (const [concept, weight] of connections.slice(0, 2)) {
      if (weight > this.minConfidence) {
        const connectedNode = this.knowledgeGraph.get(concept);
        if (connectedNode) {
          const subPath = this.exploreNode(connectedNode, depth + 1);
          pathNodes.push(...subPath.nodes);
          totalConfidence += weight * subPath.totalConfidence;
        }
      }
    }

    return {
      nodes: pathNodes,
      totalConfidence,
      length: pathNodes.length,
    };
  }

  /**
   * Evaluates and scores reasoning paths
   */
  private evaluatePaths(paths: ReasoningPath[], concepts: string[]): ReasoningPath[] {
    return paths
      .map((path) => ({
        ...path,
        totalConfidence: path.totalConfidence * (path.length / this.maxDepth),
      }))
      .sort((a, b) => b.totalConfidence - a.totalConfidence);
  }

  /**
   * Derives conclusions from reasoning paths
   */
  private deriveConclusions(paths: ReasoningPath[], concepts: string[]): string[] {
    const conclusions: string[] = [];

    for (const path of paths.slice(0, 3)) {
      if (path.nodes.length > 0) {
        const lastNode = path.nodes[path.nodes.length - 1];
        conclusions.push(
          `Based on analysis of "${path.nodes[0].concept}", ` +
          `the reasoning leads to "${lastNode.concept}" with confidence ${path.totalConfidence.toFixed(2)}`
        );
      }
    }

    return conclusions;
  }

  /**
   * Calculates overall confidence from paths
   */
  private calculateOverallConfidence(paths: ReasoningPath[]): number {
    if (paths.length === 0) return 0.5;

    const avgConfidence =
      paths.slice(0, 3).reduce((sum, p) => sum + p.totalConfidence, 0) /
      Math.min(3, paths.length);

    return Math.min(0.95, avgConfidence);
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}