/**
 * DeepOptimizer - Advanced optimization component
 * Supports various optimization strategies and convergence detection
 */

export interface OptimizationResult {
  optimalSolution: number[];
  optimalValue: number;
  iterations: number;
  converged: boolean;
  history: number[];
  message: string;
}

export interface OptimizationConfig {
  objective: (solution: number[]) => number;
  constraints?: Array<(solution: number[]) => boolean>;
  bounds?: Array<[number, number]>;
  maxIterations: number;
  tolerance: number;
  learningRate?: number;
}

export interface OptimizationState {
  currentSolution: number[];
  currentValue: number;
  iteration: number;
  gradient: number[];
  bestSolution: number[];
  bestValue: number;
}

/**
 * DeepOptimizer - Advanced optimization with gradient descent and constraint handling
 */
export class DeepOptimizer {
  private objective: (solution: number[]) => number;
  private constraints: Array<(solution: number[]) => boolean>;
  private bounds: Array<[number, number]>;
  private maxIterations: number;
  private tolerance: number;
  private learningRate: number;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.objective = config.objective || ((s) => s.reduce((a, b) => a + b * b, 0));
    this.constraints = config.constraints || [];
    this.bounds = config.bounds || [];
    this.maxIterations = config.maxIterations || 1000;
    this.tolerance = config.tolerance || 1e-6;
    this.learningRate = config.learningRate || 0.01;
  }

  /**
   * Main optimization method - finds optimal solution
   */
  optimize(initialSolution: number[]): OptimizationResult {
    const history: number[] = [];
    let state = this.initializeState(initialSolution);
    let converged = false;
    let message = "";

    for (let iter = 0; iter < this.maxIterations; iter++) {
      state.iteration = iter;

      // Calculate gradient
      state.gradient = this.computeGradient(state.currentSolution);

      // Update solution using gradient descent
      state.currentSolution = this.updateSolution(state.currentSolution, state.gradient);

      // Apply constraints and bounds
      state.currentSolution = this.applyConstraints(state.currentSolution);

      // Evaluate new solution
      state.currentValue = this.objective(state.currentSolution);
      history.push(state.currentValue);

      // Track best solution
      if (state.currentValue < state.bestValue) {
        state.bestSolution = [...state.currentSolution];
        state.bestValue = state.currentValue;
      }

      // Check convergence
      if (this.checkConvergence(state, iter)) {
        converged = true;
        message = `Converged after ${iter + 1} iterations`;
        break;
      }
    }

    if (!converged) {
      message = `Max iterations (${this.maxIterations}) reached`;
    }

    return {
      optimalSolution: state.bestSolution,
      optimalValue: state.bestValue,
      iterations: state.iteration + 1,
      converged,
      history,
      message,
    };
  }

  /**
   * Evaluates the objective function for a given solution
   */
  evaluate(solution: number[]): number {
    // Apply bounds if defined
    let evaluated = solution;
    if (this.bounds.length > 0) {
      evaluated = solution.map((val, i) => {
        if (this.bounds[i]) {
          return Math.max(this.bounds[i][0], Math.min(this.bounds[i][1], val));
        }
        return val;
      });
    }

    return this.objective(evaluated);
  }

  /**
   * Checks if the optimization has converged
   */
  converge(currentValue: number, previousValue: number): boolean {
    if (Math.abs(previousValue - currentValue) < this.tolerance) {
      return true;
    }
    return false;
  }

  /**
   * Sets a new objective function
   */
  setObjective(objective: (solution: number[]) => number): void {
    this.objective = objective;
  }

  /**
   * Adds a constraint
   */
  addConstraint(constraint: (solution: number[]) => boolean): void {
    this.constraints.push(constraint);
  }

  /**
   * Sets bounds for variables
   */
  setBounds(bounds: Array<[number, number]>): void {
    this.bounds = bounds;
  }

  /**
   * Sets the learning rate
   */
  setLearningRate(rate: number): void {
    this.learningRate = Math.max(0.0001, Math.min(1.0, rate));
  }

  /**
   * Gets current configuration
   */
  getConfig(): OptimizationConfig {
    return {
      objective: this.objective,
      constraints: [...this.constraints],
      bounds: [...this.bounds],
      maxIterations: this.maxIterations,
      tolerance: this.tolerance,
      learningRate: this.learningRate,
    };
  }

  /**
   * Resets the optimizer to initial state
   */
  reset(): void {
    this.constraints = [];
    this.bounds = [];
    this.maxIterations = 1000;
    this.tolerance = 1e-6;
    this.learningRate = 0.01;
  }

  /**
   * Performs multiple optimization runs with random restarts
   */
  optimizeWithRestarts(
    initialSolution: number[],
    numRestarts: number = 5
  ): OptimizationResult {
    let bestResult: OptimizationResult | null = null;

    for (let i = 0; i < numRestarts; i++) {
      // Add small random perturbation to initial solution
      const perturbedSolution = initialSolution.map(
        (val) => val + (Math.random() - 0.5) * 0.1
      );

      const result = this.optimize(perturbedSolution);

      if (!bestResult || result.optimalValue < bestResult.optimalValue) {
        bestResult = result;
      }

      // Early termination if near-optimal solution found
      if (bestResult && bestResult.optimalValue < this.tolerance) {
        break;
      }
    }

    return bestResult || this.optimize(initialSolution);
  }

  /**
   * Performs coordinate descent optimization
   */
  optimizeCoordinateDescent(initialSolution: number[]): OptimizationResult {
    const history: number[] = [];
    let solution = [...initialSolution];
    let bestValue = this.objective(solution);
    let bestSolution = [...solution];
    let converged = false;
    let message = "";

    for (let iter = 0; iter < this.maxIterations; iter++) {
      let improved = false;

      // Optimize each coordinate sequentially
      for (let i = 0; i < solution.length; i++) {
        const originalValue = solution[i];

        // Try positive and negative directions
        const stepSize = this.learningRate * (1 + iter * 0.01);

        for (const delta of [stepSize, -stepSize]) {
          solution[i] = originalValue + delta;
          solution = this.applyConstraints(solution);

          const newValue = this.objective(solution);

          if (newValue < bestValue) {
            bestValue = newValue;
            bestSolution = [...solution];
            improved = true;
          } else {
            solution[i] = originalValue; // Revert
          }
        }
      }

      history.push(bestValue);

      // Check convergence
      if (!improved || bestValue < this.tolerance) {
        converged = true;
        message = `Converged after ${iter + 1} iterations`;
        break;
      }
    }

    if (!converged) {
      message = `Max iterations (${this.maxIterations}) reached`;
    }

    return {
      optimalSolution: bestSolution,
      optimalValue: bestValue,
      iterations: this.maxIterations,
      converged,
      history,
      message,
    };
  }

  /**
   * Initializes the optimization state
   */
  private initializeState(initialSolution: number[]): OptimizationState {
    const currentValue = this.objective(initialSolution);

    return {
      currentSolution: [...initialSolution],
      currentValue,
      iteration: 0,
      gradient: new Array(initialSolution.length).fill(0),
      bestSolution: [...initialSolution],
      bestValue: currentValue,
    };
  }

  /**
   * Computes numerical gradient
   */
  private computeGradient(solution: number[]): number[] {
    const gradient: number[] = [];
    const epsilon = 1e-6;

    for (let i = 0; i < solution.length; i++) {
      const original = solution[i];

      const plus = this.objective(
        solution.map((v, j) => (j === i ? original + epsilon : v))
      );
      const minus = this.objective(
        solution.map((v, j) => (j === i ? original - epsilon : v))
      );

      gradient.push((plus - minus) / (2 * epsilon));
    }

    return gradient;
  }

  /**
   * Updates solution using gradient descent
   */
  private updateSolution(solution: number[], gradient: number[]): number[] {
    return solution.map((val, i) => {
      const delta = this.learningRate * gradient[i];
      return val - delta;
    });
  }

  /**
   * Applies constraints to a solution
   */
  private applyConstraints(solution: number[]): number[] {
    let constrained = [...solution];

    // Apply bounds
    for (let i = 0; i < constrained.length; i++) {
      if (this.bounds[i]) {
        constrained[i] = Math.max(
          this.bounds[i][0],
          Math.min(this.bounds[i][1], constrained[i])
        );
      }
    }

    // Apply constraint functions (try to satisfy)
    for (const constraint of this.constraints) {
      if (!constraint(constrained)) {
        // Try to adjust solution to satisfy constraint
        constrained = this.adjustForConstraint(constrained, constraint);
      }
    }

    return constrained;
  }

  /**
   * Adjusts solution to satisfy a constraint
   */
  private adjustForConstraint(
    solution: number[],
    constraint: (s: number[]) => boolean
  ): number[] {
    let adjusted = [...solution];
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts && !constraint(adjusted); attempt++) {
      // Add small random perturbations
      adjusted = adjusted.map((val, i) => {
        if (this.bounds[i]) {
          return val + (Math.random() - 0.5) * (this.bounds[i][1] - this.bounds[i][0]) * 0.1;
        }
        return val + (Math.random() - 0.5) * 0.1;
      });

      // Reapply bounds
      for (let i = 0; i < adjusted.length; i++) {
        if (this.bounds[i]) {
          adjusted[i] = Math.max(
            this.bounds[i][0],
            Math.min(this.bounds[i][1], adjusted[i])
          );
        }
      }
    }

    return adjusted;
  }

  /**
   * Checks convergence criteria
   */
  private checkConvergence(state: OptimizationState, iteration: number): boolean {
    // Check if gradient magnitude is small
    const gradientMagnitude = Math.sqrt(
      state.gradient.reduce((sum, g) => sum + g * g, 0)
    );
    if (gradientMagnitude < this.tolerance) {
      return true;
    }

    // Check if value change is small
    if (state.iteration > 0 && iteration > 0) {
      // This would need access to previous value, simplified here
    }

    // Check if solution is near optimal (value is small for minimization)
    if (state.bestValue < this.tolerance) {
      return true;
    }

    return false;
  }
}