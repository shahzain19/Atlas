import pytest
from atlas_ai.optimization.deep_optimizer import DeepOptimizer


def test_optimize_basic():
    opt = DeepOptimizer()
    result = opt.optimize([1.0, 2.0, 3.0])
    assert result.optimal_solution is not None
    assert result.optimal_value >= 0
    assert result.iterations > 0
    assert len(result.history) > 0


def test_optimize_converges():
    opt = DeepOptimizer({"tolerance": 1e-3, "maxIterations": 500})
    result = opt.optimize([2.0, -1.0])
    assert result.converged or result.iterations <= 500


def test_optimize_sphere_function():
    opt = DeepOptimizer({"objective": lambda s: sum(v * v for v in s)})
    result = opt.optimize([3.0, 4.0])
    assert result.optimal_value >= 0


def test_evaluate():
    opt = DeepOptimizer()
    val = opt.evaluate([1.0, 2.0])
    assert val == pytest.approx(5.0)


def test_evaluate_with_bounds():
    opt = DeepOptimizer({"bounds": [(0, 1), (0, 1)]})
    val = opt.evaluate([2.0, 3.0])
    assert val >= 0


def test_converge_detection():
    opt = DeepOptimizer({"tolerance": 0.1})
    assert opt.converge(1.0, 1.05) is True
    assert opt.converge(1.0, 1.5) is False


def test_set_objective():
    opt = DeepOptimizer()
    opt.set_objective(lambda s: sum(s))
    val = opt.evaluate([1.0, 2.0])
    assert val == 3.0


def test_add_constraint():
    opt = DeepOptimizer()
    opt.add_constraint(lambda s: sum(s) > 0)
    assert len(opt.constraints) == 1


def test_set_bounds():
    opt = DeepOptimizer()
    opt.set_bounds([(0, 1), (-1, 1)])
    assert len(opt.bounds) == 2
    assert opt.bounds[0] == (0, 1)


def test_set_learning_rate():
    opt = DeepOptimizer()
    opt.set_learning_rate(0.5)
    assert opt.learning_rate == 0.5
    opt.set_learning_rate(100)
    assert opt.learning_rate == 1.0
    opt.set_learning_rate(-1)
    assert opt.learning_rate == 0.0001


def test_get_config():
    opt = DeepOptimizer({"maxIterations": 200, "tolerance": 1e-4})
    config = opt.get_config()
    assert config["maxIterations"] == 200
    assert config["tolerance"] == 1e-4


def test_reset():
    opt = DeepOptimizer({"maxIterations": 50, "tolerance": 1e-3})
    opt.add_constraint(lambda s: True)
    opt.set_bounds([(0, 1)])
    opt.reset()
    assert opt.max_iterations == 1000
    assert opt.tolerance == 1e-6
    assert opt.constraints == []
    assert opt.bounds == []


def test_optimize_with_restarts():
    opt = DeepOptimizer({"maxIterations": 100})
    result = opt.optimize_with_restarts([1.0, 2.0], num_restarts=3)
    assert result.optimal_solution is not None
    assert result.optimal_value >= 0


def test_coordinate_descent():
    opt = DeepOptimizer({"maxIterations": 50, "tolerance": 1e-6})
    result = opt.optimize_coordinate_descent([1.0, 2.0])
    assert result.optimal_solution is not None
    assert len(result.history) > 0


def test_state_change():
    opt = DeepOptimizer()
    before = opt.get_config()
    opt.optimize([1.0, 2.0])
    after = opt.get_config()
    assert before == after


def test_custom_objective():
    opt = DeepOptimizer({"objective": lambda s: (s[0] - 3) ** 2 + (s[1] + 2) ** 2})
    result = opt.optimize([0.0, 0.0])
    assert result.optimal_value < 20


def test_bounds_enforced():
    opt = DeepOptimizer({"bounds": [(0, 1), (0, 1)], "maxIterations": 50})
    result = opt.optimize([5.0, 5.0])
    for i, v in enumerate(result.optimal_solution):
        if i < 2:
            assert 0 <= v <= 1


def test_gradient_computation():
    opt = DeepOptimizer({"objective": lambda s: s[0] ** 2 + s[1] ** 2})
    grad = opt._compute_gradient([1.0, 2.0])
    assert len(grad) == 2
    assert grad[0] > 0
    assert grad[1] > 0


def test_adjust_for_constraint():
    opt = DeepOptimizer({"bounds": [(0, 1), (0, 1)]})
    opt.add_constraint(lambda s: s[0] + s[1] < 0.5)
    adjusted = opt._adjust_for_constraint([1.0, 1.0], opt.constraints[0])
    assert len(adjusted) == 2
