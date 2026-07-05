# Contributing to Atlas

Thank you for your interest in contributing to Atlas! We welcome
contributions from everyone.

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold this code.

## How to Contribute

### Reporting Bugs

Before submitting a bug report, please check the existing issues to see if the
problem has already been reported. If it has, add a comment to the existing
issue instead of opening a new one.

When filing a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots or logs if applicable
- Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When submitting an
enhancement suggestion, please include:

- A clear, descriptive title
- A detailed description of the proposed functionality
- Any possible implementation details or references

### Pull Requests

1. Fork the repository and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write a clear commit message

## Development Setup

### Prerequisites

- Node.js >= 20
- TypeScript >= 5.0
- Python >= 3.10 (for Python SDK / AI layer)
- C++20 compatible compiler (for hardware drivers)
- CMake >= 3.20 (for C++ components)

### Installing Dependencies

```bash
# TypeScript
npm install

# Python SDK
cd atlas-sdk/python && pip install -e .

# C++ hardware drivers
cd atlas-hardware-cpp && cmake -S . -B build && cmake --build build
```

### Running Tests

```bash
# TypeScript tests
npm test

# Python tests
cd atlas-perception-py && python -m pytest

# C++ tests
cd atlas-hardware-cpp && ./build/atlas_hardware_tests
```

## Project Structure

```
atlas/
├── atlas-kernel/         Core data types (Entity, Event, Task, Mission)
├── atlas-runtime/        System lifecycle, scheduling, memory
├── atlas-hardware/       TypeScript HAL and driver interfaces
├── atlas-hardware-cpp/   C++ real hardware drivers (serial, CAN, V4L2)
├── atlas-agents/         Agent implementations
├── atlas-ai/             AI/ML layer (reasoning, planning, learning)
├── atlas-perception-py/  Python perception sensors (camera, lidar, GPS)
├── atlas-sdk/            Multi-language SDK (Python, TypeScript)
├── atlas-cli/            Command-line interface
├── atlas-studio/         Visual IDE (React + Vite)
├── atlas-fleet/          Swarm coordination and telemetry
├── atlas-network/        Transport layer (WebSocket, NATS)
├── atlas-simulation/     3D simulation (Three.js)
├── atlas-memory/         World model, knowledge graph
├── atlas-supabase/       Supabase-backed persistence
├── atlas-tests/          Integration test suite
└── docs/                 Architecture and design documents
```

## Coding Conventions

- **TypeScript**: Follow the existing style (2-space indent, no semicolons
  where possible, explicit types)
- **Python**: PEP 8 compliant, type hints required
- **C++**: C++20, header-only where possible, snake_case for functions,
  PascalCase for classes

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
