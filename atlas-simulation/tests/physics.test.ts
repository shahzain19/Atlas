import { describe, it, expect } from 'vitest';
import { PhysicsEngine } from '../src/physics/PhysicsEngine';
import { Robot } from '../src/entities/Robot';
import { SimulationConfig } from '../src/core/SimulationConfig';

function makeConfig(overrides?: Partial<SimulationConfig>): SimulationConfig {
  return {
    speed: 1,
    paused: false,
    gravity: -9.81,
    groundLevel: 0,
    fogNear: 30,
    fogFar: 100,
    obstacleCount: 15,
    waypointCount: 5,
    lidarRayCount: 64,
    lidarRange: 15,
    radarRange: 20,
    radarAngle: Math.PI / 6,
    trailLength: 100,
    ...overrides,
  };
}

describe('PhysicsEngine', () => {
  it('applies gravity to robot velocity', () => {
    const config = makeConfig();
    const physics = new PhysicsEngine(config);
    const robot = new Robot();
    robot.position.set(0, 10, 0);
    robot.velocity.y = 0;

    physics.update(robot, 1 / 60);

    expect(robot.velocity.y).toBeLessThan(0);
  });

  it('stops robot at ground level', () => {
    const config = makeConfig();
    const physics = new PhysicsEngine(config);
    const robot = new Robot();
    robot.position.set(0, -1, 0);
    robot.velocity.y = -5;

    physics.update(robot, 1 / 60);

    expect(robot.position.y).toBe(0);
    expect(robot.velocity.y).toBe(0);
  });

  it('moves robot horizontally', () => {
    const config = makeConfig();
    const physics = new PhysicsEngine(config);
    const robot = new Robot();
    robot.position.set(0, 1.5, 0);
    robot.velocity.set(2, 0, 0);

    physics.update(robot, 1.0);

    expect(robot.position.x).toBeGreaterThan(0);
  });

  it('damps horizontal velocity', () => {
    const config = makeConfig();
    const physics = new PhysicsEngine(config);
    const robot = new Robot();
    robot.velocity.set(10, 0, 0);

    physics.update(robot, 1 / 60);

    expect(Math.abs(robot.velocity.x)).toBeLessThan(10);
  });

  it('moves robot toward target altitude', () => {
    const config = makeConfig();
    const physics = new PhysicsEngine(config);
    const robot = new Robot();
    robot.targetAltitude = 5;
    robot.altitude = 0;

    physics.update(robot, 0.5);

    expect(robot.altitude).toBeGreaterThan(0);
  });

  it('keeps robot yaw consistent in rotation', () => {
    const config = makeConfig();
    const physics = new PhysicsEngine(config);
    const robot = new Robot();
    robot.yaw = 1.5;

    physics.update(robot, 0.016);

    expect(robot.mesh.rotation.y).toBeCloseTo(1.5, 4);
  });
});
