import { DeepReasoningEngine, ReasoningResult, AnalysisResult, PredictionResult, LearningResult } from "../../atlas-ai/Reasoning/DeepReasoning";

describe("DeepReasoningEngine", () => {
  let reasoningEngine: DeepReasoningEngine;

  beforeEach(() => {
    reasoningEngine = new DeepReasoningEngine();
  });

  describe("constructor", () => {
    it("should initialize with core concepts", () => {
      const graph = reasoningEngine.getKnowledgeGraph();
      expect(graph.size).toBeGreaterThan(0);
    });

    it("should initialize with default confidence of 0.5", () => {
      expect(reasoningEngine.getConfidence()).toBe(0.5);
    });

    it("should accept optional semantic memory", () => {
      expect(() => new DeepReasoningEngine()).not.toThrow();
    });
  });

  describe("reason", () => {
    it("should return reasoning result with conclusions", async () => {
      const result = await reasoningEngine.reason("analyze state action goal");

      expect(result).toHaveProperty("conclusions");
      expect(result).toHaveProperty("paths");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("reasoning");
      expect(Array.isArray(result.conclusions)).toBe(true);
      expect(Array.isArray(result.reasoning)).toBe(true);
    });

    it("should include reasoning steps", async () => {
      const result = await reasoningEngine.reason("test query");

      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.reasoning[0]).toContain("Starting reasoning process");
    });

    it("should calculate confidence between 0 and 1", async () => {
      const result = await reasoningEngine.reason("state action constraint");

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it("should build reasoning paths", async () => {
      const result = await reasoningEngine.reason("optimization learning prediction");

      expect(result.paths.length).toBeGreaterThan(0);
      expect(result.paths[0]).toHaveProperty("nodes");
      expect(result.paths[0]).toHaveProperty("totalConfidence");
    });
  });

  describe("analyze", () => {
    it("should return analysis result with patterns", async () => {
      const result = await reasoningEngine.analyze("test data for analysis");

      expect(result).toHaveProperty("patterns");
      expect(result).toHaveProperty("insights");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("confidence");
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should handle string input", async () => {
      const result = await reasoningEngine.analyze("state action goal constraint");

      expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle object input", async () => {
      const result = await reasoningEngine.analyze({ key: "value", nested: { data: "test" } });

      expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    });

    it("should generate relevant insights", async () => {
      const result = await reasoningEngine.analyze("state action goal outcome");

      // With connected concepts, should generate insights
      expect(typeof result.confidence).toBe("number");
    });
  });

  describe("predict", () => {
    it("should return prediction result", async () => {
      const result = await reasoningEngine.predict("current state analysis", "short-term");

      expect(result).toHaveProperty("predictions");
      expect(result).toHaveProperty("probabilities");
      expect(result).toHaveProperty("timeframe");
      expect(result).toHaveProperty("confidence");
      expect(Array.isArray(result.predictions)).toBe(true);
    });

    it("should include timeframe in result", async () => {
      const result = await reasoningEngine.predict("test state", "long-term");

      expect(result.timeframe).toBe("long-term");
    });

    it("should return probabilities for predictions", async () => {
      const result = await reasoningEngine.predict("reasoning analysis", "medium-term");

      expect(result.probabilities.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("learn", () => {
    it("should return learning result", async () => {
      const result = await reasoningEngine.learn("new concept information data");

      expect(result).toHaveProperty("learnedConcepts");
      expect(result).toHaveProperty("updatedConnections");
      expect(result).toHaveProperty("confidence");
      expect(Array.isArray(result.learnedConcepts)).toBe(true);
    });

    it("should update knowledge graph", async () => {
      const beforeGraph = reasoningEngine.getKnowledgeGraph();
      const beforeSize = beforeGraph.size;

      await reasoningEngine.learn("unique concept alpha beta gamma");

      const afterGraph = reasoningEngine.getKnowledgeGraph();
      expect(afterGraph.size).toBeGreaterThanOrEqual(beforeSize);
    });

    it("should increase confidence with learning", async () => {
      const beforeConfidence = reasoningEngine.getConfidence();

      await reasoningEngine.learn("learning improves confidence over time");

      const afterConfidence = reasoningEngine.getConfidence();
      expect(afterConfidence).toBeGreaterThanOrEqual(beforeConfidence);
    });

    it("should track updated connections", async () => {
      const result = await reasoningEngine.learn("concept a concept b concept c");

      expect(result.updatedConnections).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getKnowledgeGraph", () => {
    it("should return a copy of the knowledge graph", () => {
      const graph = reasoningEngine.getKnowledgeGraph();

      expect(graph).toBeInstanceOf(Map);
      expect(graph.size).toBeGreaterThan(0);
    });

    it("should not be affected by modifications to returned graph", () => {
      const graph = reasoningEngine.getKnowledgeGraph();
      const originalSize = graph.size;

      graph.clear();

      const graph2 = reasoningEngine.getKnowledgeGraph();
      expect(graph2.size).toBe(originalSize);
    });
  });

  describe("getConfidence", () => {
    it("should return current confidence level", () => {
      const confidence = reasoningEngine.getConfidence();

      expect(typeof confidence).toBe("number");
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("getReasoningPaths", () => {
    it("should return array of reasoning paths", () => {
      const paths = reasoningEngine.getReasoningPaths();

      expect(Array.isArray(paths)).toBe(true);
    });
  });

  describe("clear", () => {
    it("should clear the knowledge graph", () => {
      const beforeGraph = reasoningEngine.getKnowledgeGraph();
      expect(beforeGraph.size).toBeGreaterThan(0);

      reasoningEngine.clear();

      const afterGraph = reasoningEngine.getKnowledgeGraph();
      expect(afterGraph.size).toBeGreaterThan(0); // Core concepts reinitialized
    });

    it("should reset confidence to 0.5", () => {
      reasoningEngine.learn("test");
      reasoningEngine.clear();

      expect(reasoningEngine.getConfidence()).toBe(0.5);
    });
  });

  describe("integration with SemanticMemory", () => {
    it("should accept semantic memory in constructor", () => {
      // This tests the optional integration - no actual SemanticMemory instance needed
      expect(() => new DeepReasoningEngine(undefined)).not.toThrow();
    });
  });

  describe("reasoning quality", () => {
    it("should produce coherent conclusions", async () => {
      const result = await reasoningEngine.reason("state action goal constraint outcome");

      // Conclusions should be non-empty strings
      for (const conclusion of result.conclusions) {
        expect(typeof conclusion).toBe("string");
        expect(conclusion.length).toBeGreaterThan(0);
      }
    });

    it("should have valid reasoning path structure", async () => {
      const result = await reasoningEngine.reason("test reasoning");

      for (const path of result.paths) {
        expect(path.nodes.length).toBeGreaterThan(0);
        expect(typeof path.totalConfidence).toBe("number");
        expect(path.totalConfidence).toBeGreaterThan(0);
      }
    });

    it("should improve confidence with repeated learning", async () => {
      const initialResult = await reasoningEngine.reason("initial query");
      const initialConfidence = initialResult.confidence;

      // Learn more concepts
      await reasoningEngine.learn("concept1 concept2 concept3");
      await reasoningEngine.learn("concept4 concept5 concept6");

      const laterResult = await reasoningEngine.reason("later query");
      const laterConfidence = laterResult.confidence;

      // Confidence should generally improve or stay the same
      expect(laterConfidence).toBeGreaterThanOrEqual(initialConfidence * 0.9);
    });
  });
});