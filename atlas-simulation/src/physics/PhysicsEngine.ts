import * as THREE from 'three';
import { Robot } from '../entities/Robot';
import { SimulationConfig } from '../core/SimulationConfig';

export class PhysicsEngine {
  public gravity: number;
  public groundLevel: number;

  constructor(config: SimulationConfig) {
    this.gravity = config.gravity;
    this.groundLevel = config.groundLevel;
  }

  update(robot: Robot, dt: number): void {
    const pos = robot.position;

    const altitudeDiff = robot.targetAltitude - robot.position.y;
    robot.velocity.y += altitudeDiff * 3 * dt;
    robot.velocity.y += this.gravity * dt;

    pos.x += robot.velocity.x * dt;
    pos.z += robot.velocity.z * dt;
    pos.y += robot.velocity.y * dt;

    robot.altitude = robot.position.y - this.groundLevel;

    robot.velocity.x *= 0.95;
    robot.velocity.z *= 0.95;

    if (pos.y < this.groundLevel) {
      pos.y = this.groundLevel;
      robot.velocity.y = 0;
      robot.altitude = 0;
    }

    robot.mesh.rotation.order = 'YXZ';
    robot.mesh.rotation.y = robot.yaw;
    robot.mesh.rotation.x = robot.pitch * 0.1;
    robot.mesh.rotation.z = robot.roll * 0.1;
  }
}
