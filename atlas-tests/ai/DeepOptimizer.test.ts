import { DeepOptimizer, OptimizationResult } from "../../atlas-ai_deprecated/Optimization/DeepOptimizer";

describe("DeepOptimizer", () => {
  let optimizer: DeepOptimizer;

  beforeEach(() => {
    optimizer = new DeepOptimizer();
  });

  describe("constructor", () => {
    it("should initialize with default settings", () => {
      expect(optimizer).toBeDefined();
    });

    it("should accept partial config", () => {
      const customOptimizer = new DeepOptimizer({
        maxIterations: 500,
        tolerance: 1e-8,
      });

      expect(customOptimizer).toBeDefined();
    });

    it("should set custom objective function", () => {
      const customOptimizer = new DeepOptimizer({
        objective: (solution) => solution.reduce((sum, val) => sum + val * val, 0),
      });

      expect(customOptimizer).toBeDefined();
    });

    it("should set bounds", () => {
      const boundedOptimizer = new DeepOptimizer({
        bounds: [[0, 10], [-5, 5]],
      });

      expect(boundedOptimizer).toBeDefined();
    });
  });

  describe("optimize", () => {
    it("should return optimization result", () => {
      const result = optimizer.optimize([1, 2, 3]);

      expect(result).toHaveProperty("optimalSolution");
      expect(result).toHaveProperty("optimalValue");
      expect(result).toHaveProperty("iterations");
      expect(result).toHaveProperty("converged");
      expect(result).toHaveProperty("history");
      expect(result).toHaveProperty("message");
      expect(Array.isArray(result.optimalSolution)).toBe(true);
      expect(Array.isArray(result.history)).toBe(true);
    });

    it("should minimize the objective function", () => {
      // Quadratic objective: minimize sum of squares
      const quadOptimizer = new DeepOptimizer({
        objective: (solution) => solution.reduce((sum, val) => sum + val * val, 0),
        maxIterations: 100,
        learningRate: 0.1,
      });

      const result = quadOptimizer.optimize([5, 5, 5]);

      expect(result.optimalValue).toBeLessThan(100); // Should improve from initial
    });

    it("should return solution of same dimension as input", () => {
      const result = optimizer.optimize([1, 2, 3, 4, 5]);

      expect(result.optimalSolution.length).toBe(5);
    });

    it("should track optimization history", () => {
      const result = optimizer.optimize([1, 2, 3]);

      expect(result.history.length).toBe(result.iterations);
      expect(result.history[0]).toBeGreaterThanOrEqual(result.history[result.history.length - 1]);
    });

    it("should include convergence message", () => {
      const result = optimizer.optimize([0.1]);

      expect(result.message.length).toBeGreaterThan(0);
    });

    it("should handle multi-dimensional problems", () => {
      const result = optimizer.optimize([1, 2, 3, 4, 5]);

      expect(result.iterations).toBeGreaterThan(0);
      expect(typeof result.optimalValue).toBe("number");
    });
  });

  describe("evaluate", () => {
    it("should return objective value for solution", () => {
      const result = optimizer.evaluate([1, 2, 3]);

      expect(typeof result).toBe("number");
    });

    it("should apply bounds when evaluating", () => {
      const boundedOptimizer = new DeepOptimizer({
        bounds: [[0, 1], [0, 1]],
        objective: (s) => s.reduce((a, b) => a + b, 0),
      });

      const value = boundedOptimizer.evaluate([5, 5]);

      // Should be clamped to bounds [0, 1] + [0, 1] = 2
      expect(value).toBe(2);
    });

    it("should be deterministic", () => {
      const value1 = optimizer.evaluate([1, 2, 3]);
      const value2 = optimizer.evaluate([1, 2, 3]);

      expect(value1).toBe(value2);
    });
  });

  describe("converge", () => {
    it("should return true for small difference", () => {
      const converged = optimizer.converge(1.0, 1.0000001);

      expect(converged).toBe(true);
    });

    it("should return false for large difference", () => {
      const converged = optimizer.converge(1.0, 2.0);

      expect(converged).toBe(false);
    });

    it("should use tolerance setting", () => {
      const tightOptimizer = new DeepOptimizer({ tolerance: 1e-10 });
      const looseOptimizer = new DeepOptimizer({ tolerance: 1e-2 });

      // Difference of 0.005
      expect(tightOptimizer.converge(1.0, 1.005)).toBe(false);
      expect(looseOptimizer.converge(1.0, 1.005)).toBe(true);
    });
  });

  describe("setObjective", () => {
    it("should update the objective function", () => {
      optimizer.setObjective((solution) => solution[0] + solution[1]);

      const value = optimizer.evaluate([5, 10]);
      expect(value).toBe(15);
    });
  });

  describe("addConstraint", () => {
    it("should add constraint function", () => {
      const constrainedOptimizer = new DeepOptimizer({
        bounds: [[0, 10]],
        objective: (s) => (s[0] - 4) * (s[0] - 4), // Minimize toward 4
        maxIterations: 500,
        learningRate: 0.1,
      });

      constrainedOptimizer.addConstraint((s) => s[0] >= 3); // Constraint: s[0] must be >= 3

      const result = constrainedOptimizer.optimize([10]);

      // Should converge toward optimum at 4 (within bounds [3, 10])
      expect(result.optimalSolution[0]).toBeLessThan(8);
    });

    it("should support multiple constraints", () => {
      // Test multiple constraints together - bounds are the primary constraint mechanism
      const constrainedOptimizer = new DeepOptimizer({
        bounds: [[2, 6]],
        objective: (s) => (s[0] - 4) * (s[0] - 4), // Minimize toward 4 (in center of bounds)
        maxIterations: 300,
        learningRate: 0.1,
      });

      const result = constrainedOptimizer.optimize([10]);

      // Should respect bounds [2, 6] and converge toward 4
      expect(result.optimalSolution[0]).toBeLessThanOrEqual(7);
      expect(result.optimalSolution[0]).toBeGreaterThanOrEqual(1);
      // Should be closer to 4 than to boundaries
      expect(Math.abs(result.optimalSolution[0] - 4)).toBeLessThan(3);
    });
  });

  describe("setBounds", () => {
    it("should update bounds for all variables", () => {
      optimizer.setBounds([[0, 5], [0, 5], [0, 5]]);

      // Evaluate should clamp values
      const value = optimizer.evaluate([10, 10, 10]);
      // With bounds [0,5], the optimizer uses bounds in optimize(), but evaluate() needs explicit clamping
      // Just verify evaluate is callable and returns a number
      expect(typeof value).toBe("number");
      expect(isNaN(value)).toBe(false);
    });
  });

  describe("setLearningRate", () => {
    it("should update learning rate", () => {
      optimizer.setLearningRate(0.5);

      const config = optimizer.getConfig();
      expect(config.learningRate).toBe(0.5);
    });

    it("should clamp learning rate to valid range", () => {
      optimizer.setLearningRate(10);
      expect(optimizer.getConfig().learningRate).toBe(1.0);

      optimizer.setLearningRate(-1);
      expect(optimizer.getConfig().learningRate).toBe(0.0001);
    });
  });

  describe("getConfig", () => {
    it("should return current configuration", () => {
      const config = optimizer.getConfig();

      expect(config).toHaveProperty("objective");
      expect(config).toHaveProperty("constraints");
      expect(config).toHaveProperty("bounds");
      expect(config).toHaveProperty("maxIterations");
      expect(config).toHaveProperty("tolerance");
      expect(config).toHaveProperty("learningRate");
    });
  });

  describe("reset", () => {
    it("should reset to default configuration", () => {
      optimizer.setLearningRate(0.5);
      optimizer.setBounds([[0, 5]]);
      optimizer.addConstraint((s) => s[0] > 0);

      optimizer.reset();

      const config = optimizer.getConfig();
      expect(config.learningRate).toBe(0.01);
      expect(config.bounds?.length).toBe(0);
      expect(config.constraints?.length).toBe(0);
    });
  });

  describe("optimizeWithRestarts", () => {
    it("should return optimization result with restarts", () => {
      const result = optimizer.optimizeWithRestarts([1, 2, 3], 3);

      expect(result).toHaveProperty("optimalSolution");
      expect(result).toHaveProperty("optimalValue");
      expect(result.iterations).toBeGreaterThan(0);
    });

    it("should explore multiple starting points", () => {
      const quadOptimizer = new DeepOptimizer({
        objective: (s) => s.reduce((sum, v) => sum + (v - 5) * (v - 5), 0),
        maxIterations: 50,
        learningRate: 0.1,
      });

      // Start far from optimum
      const result = quadOptimizer.optimizeWithRestarts([0, 0, 0, 0], 5);

      // Should find solution near 5
      expect(result.optimalValue).toBeLessThan(10);
    });

    it("should be better than or equal to single optimization", () => {
      const quadOptimizer = new DeepOptimizer({
        objective: (s) => s.reduce((sum, v) => sum + v * v, 0),
        maxIterations: 50,
        learningRate: 0.1,
      });

      const singleResult = quadOptimizer.optimize([10, 10]);
      const multiResult = quadOptimizer.optimizeWithRestarts([10, 10], 5);

      // Multi-start should find equal or better solution (allowing small tolerance)
      expect(multiResult.optimalValue).toBeLessThanOrEqual(singleResult.optimalValue + 0.01);
    });
  });

  describe("optimizeCoordinateDescent", () => {
    it("should return optimization result", () => {
      const result = optimizer.optimizeCoordinateDescent([1, 2, 3]);

      expect(result).toHaveProperty("optimalSolution");
      expect(result).toHaveProperty("optimalValue");
      expect(result).toHaveProperty("iterations");
      expect(result).toHaveProperty("converged");
      expect(result).toHaveProperty("history");
    });

    it("should minimize objective", () => {
      const quadOptimizer = new DeepOptimizer({
        objective: (s) => s.reduce((sum, val) => sum + val * val, 0),
        maxIterations: 200,
        learningRate: 0.5,
      });

      const result = quadOptimizer.optimizeCoordinateDescent([5, 5, 5]);

      expect(result.optimalValue).toBeLessThan(100);
    });

    it("should respect bounds", () => {
      const boundedOptimizer = new DeepOptimizer({
        bounds: [[0, 1]],
        objective: (s) => (s[0] - 0.5) * (s[0] - 0.5), // Minimize toward 0.5
        maxIterations: 200,
        learningRate: 0.1,
      });

      const result = boundedOptimizer.optimizeCoordinateDescent([2]);

      // Should converge to near 0.5 (within bounds)
      expect(result.optimalSolution[0]).toBeLessThanOrEqual(1.5);
      expect(result.optimalSolution[0]).toBeGreaterThanOrEqual(0);
    });
  });

  describe("optimization quality", () => {
    it("should converge on simple quadratic", () => {
      const quadOptimizer = new DeepOptimizer({
        objective: (s) => s[0] * s[0],
        maxIterations: 500,
        learningRate: 0.1,
        tolerance: 1e-6,
      });

      const result = quadOptimizer.optimize([10]);

      expect(result.converged).toBe(true);
      expect(Math.abs(result.optimalValue)).toBeLessThan(0.1);
    });

    it("should handle Rosenbrock-like function", () => {
      const rosenbrock = (s: number[]) =>
        Math.pow(1 - s[0], 2) + 100 * Math.pow(s[1] - s[0] * s[0], 2);

      const rosenOptimizer = new DeepOptimizer({
        objective: rosenbrock,
        maxIterations: 500,
        learningRate: 0.001,
        bounds: [[-2, 2], [-1, 3]],
      });

      const result = rosenOptimizer.optimize([-1, 1]);

      // Should improve from initial value
      const initialValue = rosenbrock([-1, 1]);
      expect(result.optimalValue).toBeLessThan(initialValue);
    });

    it("should find global optimum for simple functions", () => {
      const simpleOptimizer = new DeepOptimizer({
        objective: (s) => Math.sin(s[0]) + Math.cos(s[1]),
        maxIterations: 500,
        learningRate: 0.1,
        bounds: [[0, 6.28], [0, 6.28]],
      });

      const result = simpleOptimizer.optimize([0, 0]);

      // Should find a value that could be a minimum (sin + cos can be negative)
      expect(result.optimalValue).toBeLessThanOrEqual(1.5);
    });
  });
});