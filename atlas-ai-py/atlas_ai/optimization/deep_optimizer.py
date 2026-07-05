import math
import random
from copy import deepcopy
from typing import Callable


class OptimizationResult:
    def __init__(self):
        self.optimal_solution: list[float] = []
        self.optimal_value: float = 0
        self.iterations: int = 0
        self.converged: bool = False
        self.history: list[float] = []
        self.message: str = ""


class OptimizationConfig:
    def __init__(self):
        self.objective: Callable = lambda s: sum(v * v for v in s)
        self.constraints: list[Callable] = []
        self.bounds: list[tuple[float, float]] = []
        self.max_iterations: int = 1000
        self.tolerance: float = 1e-6
        self.learning_rate: float = 0.01


class OptimizationState:
    def __init__(self):
        self.current_solution: list[float] = []
        self.current_value: float = 0
        self.iteration: int = 0
        self.gradient: list[float] = []
        self.best_solution: list[float] = []
        self.best_value: float = 0


class DeepOptimizer:
    def __init__(self, config: dict | None = None):
        if config is None:
            config = {}
        self.objective: Callable = config.get("objective", lambda s: sum(v * v for v in s))
        self.constraints: list[Callable] = list(config.get("constraints", []))
        self.bounds: list[tuple[float, float]] = list(config.get("bounds", []))
        self.max_iterations: int = config.get("maxIterations", 1000)
        self.tolerance: float = config.get("tolerance", 1e-6)
        self.learning_rate: float = config.get("learningRate", 0.01)

    def optimize(self, initial_solution: list[float]) -> OptimizationResult:
        history: list[float] = []
        state = self._initialize_state(initial_solution)
        converged = False
        message = ""

        for iteration in range(self.max_iterations):
            state.iteration = iteration

            state.gradient = self._compute_gradient(state.current_solution)

            state.current_solution = self._update_solution(state.current_solution, state.gradient)

            state.current_solution = self._apply_constraints(state.current_solution)

            state.current_value = self.objective(state.current_solution)
            history.append(state.current_value)

            if state.current_value < state.best_value:
                state.best_solution = list(state.current_solution)
                state.best_value = state.current_value

            if self._check_convergence(state, iteration):
                converged = True
                message = f"Converged after {iteration + 1} iterations"
                break

        if not converged:
            message = f"Max iterations ({self.max_iterations}) reached"

        result = OptimizationResult()
        result.optimal_solution = state.best_solution
        result.optimal_value = state.best_value
        result.iterations = state.iteration + 1
        result.converged = converged
        result.history = history
        result.message = message
        return result

    def evaluate(self, solution: list[float]) -> float:
        evaluated = list(solution)
        if len(self.bounds) > 0:
            evaluated = [
                max(self.bounds[i][0], min(self.bounds[i][1], val))
                if i < len(self.bounds) else val
                for i, val in enumerate(solution)
            ]
        return self.objective(evaluated)

    def converge(self, current_value: float, previous_value: float) -> bool:
        return abs(previous_value - current_value) < self.tolerance

    def set_objective(self, objective: Callable):
        self.objective = objective

    def add_constraint(self, constraint: Callable):
        self.constraints.append(constraint)

    def set_bounds(self, bounds: list[tuple[float, float]]):
        self.bounds = list(bounds)

    def set_learning_rate(self, rate: float):
        self.learning_rate = max(0.0001, min(1.0, rate))

    def get_config(self) -> dict:
        return {
            "objective": self.objective,
            "constraints": list(self.constraints),
            "bounds": list(self.bounds),
            "maxIterations": self.max_iterations,
            "tolerance": self.tolerance,
            "learningRate": self.learning_rate,
        }

    def reset(self):
        self.constraints = []
        self.bounds = []
        self.max_iterations = 1000
        self.tolerance = 1e-6
        self.learning_rate = 0.01

    def optimize_with_restarts(
        self, initial_solution: list[float], num_restarts: int = 5
    ) -> OptimizationResult:
        best_result: OptimizationResult | None = None

        for i in range(num_restarts):
            perturbed = [v + (random.random() - 0.5) * 0.1 for v in initial_solution]
            result = self.optimize(perturbed)

            if best_result is None or result.optimal_value < best_result.optimal_value:
                best_result = result

            if best_result is not None and best_result.optimal_value < self.tolerance:
                break

        if best_result is None:
            return self.optimize(initial_solution)
        return best_result

    def optimize_coordinate_descent(self, initial_solution: list[float]) -> OptimizationResult:
        history: list[float] = []
        solution = list(initial_solution)
        best_value = self.objective(solution)
        best_solution = list(solution)
        converged = False
        message = ""

        for iteration in range(self.max_iterations):
            improved = False

            for i in range(len(solution)):
                original_value = solution[i]

                step_size = self.learning_rate * (1 + iteration * 0.01)

                for delta in (step_size, -step_size):
                    solution[i] = original_value + delta
                    solution = self._apply_constraints(solution)

                    new_value = self.objective(solution)

                    if new_value < best_value:
                        best_value = new_value
                        best_solution = list(solution)
                        improved = True
                    else:
                        solution[i] = original_value

            history.append(best_value)

            if not improved or best_value < self.tolerance:
                converged = True
                message = f"Converged after {iteration + 1} iterations"
                break

        if not converged:
            message = f"Max iterations ({self.max_iterations}) reached"

        result = OptimizationResult()
        result.optimal_solution = best_solution
        result.optimal_value = best_value
        result.iterations = self.max_iterations
        result.converged = converged
        result.history = history
        result.message = message
        return result

    def _initialize_state(self, initial_solution: list[float]) -> OptimizationState:
        current_value = self.objective(initial_solution)
        state = OptimizationState()
        state.current_solution = list(initial_solution)
        state.current_value = current_value
        state.iteration = 0
        state.gradient = [0.0] * len(initial_solution)
        state.best_solution = list(initial_solution)
        state.best_value = current_value
        return state

    def _compute_gradient(self, solution: list[float]) -> list[float]:
        gradient: list[float] = []
        epsilon = 1e-6

        for i in range(len(solution)):
            original = solution[i]

            def make_plus():
                orig = original
                idx = i
                def f(vals):
                    vals2 = list(vals)
                    vals2[idx] = orig + epsilon
                    return vals2
                return f

            plus_vals = list(solution)
            plus_vals[i] = original + epsilon
            plus = self.objective(plus_vals)

            minus_vals = list(solution)
            minus_vals[i] = original - epsilon
            minus = self.objective(minus_vals)

            gradient.append((plus - minus) / (2 * epsilon))

        return gradient

    def _update_solution(self, solution: list[float], gradient: list[float]) -> list[float]:
        return [v - self.learning_rate * g for v, g in zip(solution, gradient)]

    def _apply_constraints(self, solution: list[float]) -> list[float]:
        constrained = list(solution)

        for i in range(len(constrained)):
            if i < len(self.bounds):
                constrained[i] = max(
                    self.bounds[i][0], min(self.bounds[i][1], constrained[i])
                )

        for constraint in self.constraints:
            if not constraint(constrained):
                constrained = self._adjust_for_constraint(constrained, constraint)

        return constrained

    def _adjust_for_constraint(
        self, solution: list[float], constraint: Callable
    ) -> list[float]:
        adjusted = list(solution)
        max_attempts = 100

        for attempt in range(max_attempts):
            if constraint(adjusted):
                break
            for i in range(len(adjusted)):
                if i < len(self.bounds):
                    bounds_range = self.bounds[i][1] - self.bounds[i][0]
                    adjusted[i] += (random.random() - 0.5) * bounds_range * 0.1
                else:
                    adjusted[i] += (random.random() - 0.5) * 0.1

            for i in range(len(adjusted)):
                if i < len(self.bounds):
                    adjusted[i] = max(
                        self.bounds[i][0], min(self.bounds[i][1], adjusted[i])
                    )

        return adjusted

    def _check_convergence(self, state: OptimizationState, iteration: int) -> bool:
        gradient_magnitude = math.sqrt(sum(g * g for g in state.gradient))
        if gradient_magnitude < self.tolerance:
            return True

        if state.best_value < self.tolerance:
            return True

        return False
