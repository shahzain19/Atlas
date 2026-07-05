import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotController } from '../src/entities/RobotController';
import { Robot } from '../src/entities/Robot';

describe('RobotController', () => {
  let ctrl: RobotController;
  let robot: Robot;

  beforeEach(() => {
    ctrl = new RobotController();
    robot = new Robot();
    robot.position.set(0, 1.5, 0);
  });

  afterEach(() => {
    ctrl.dispose();
  });

  it('reports zero state when no keys pressed', () => {
    const s = ctrl.state;
    expect(s.forward).toBe(0);
    expect(s.strafe).toBe(0);
    expect(s.yaw).toBe(0);
    expect(s.ascend).toBe(0);
  });

  it('reports forward on W key', () => {
    ctrl.pressKey('KeyW');
    expect(ctrl.state.forward).toBe(1);
    ctrl.releaseKey('KeyW');
    expect(ctrl.state.forward).toBe(0);
  });

  it('reports backward on S key', () => {
    ctrl.pressKey('KeyS');
    expect(ctrl.state.forward).toBe(-1);
  });

  it('reports strafe left on A key', () => {
    ctrl.pressKey('KeyA');
    expect(ctrl.state.strafe).toBe(-1);
  });

  it('reports strafe right on D key', () => {
    ctrl.pressKey('KeyD');
    expect(ctrl.state.strafe).toBe(1);
  });

  it('reports yaw left on Q key', () => {
    ctrl.pressKey('KeyQ');
    expect(ctrl.state.yaw).toBe(-1);
  });

  it('reports yaw right on E key', () => {
    ctrl.pressKey('KeyE');
    expect(ctrl.state.yaw).toBe(1);
  });

  it('reports ascend on Space', () => {
    ctrl.pressKey('Space');
    expect(ctrl.state.ascend).toBe(1);
  });

  it('reports descend on Shift', () => {
    ctrl.pressKey('ShiftLeft');
    expect(ctrl.state.ascend).toBe(-1);
  });

  it('changes robot yaw on update', () => {
    const initial = robot.yaw;
    ctrl.pressKey('KeyE');
    ctrl.update(robot, 0.5);
    expect(robot.yaw).not.toBe(initial);
    ctrl.releaseKey('KeyE');
  });

  it('changes robot targetAltitude on update', () => {
    const initial = robot.targetAltitude;
    ctrl.pressKey('Space');
    ctrl.update(robot, 1.0);
    expect(robot.targetAltitude).toBeGreaterThan(initial);
    ctrl.releaseKey('Space');
  });

  it('returns zero state when disabled', () => {
    ctrl.enabled = false;
    ctrl.pressKey('KeyW');
    const s = ctrl.state;
    expect(s.forward).toBe(0);
  });

  it('reduces battery on movement', () => {
    const initial = robot.battery;
    ctrl.pressKey('KeyW');
    ctrl.update(robot, 1.0);
    ctrl.releaseKey('KeyW');
    expect(robot.battery).toBeLessThan(initial);
  });
});
