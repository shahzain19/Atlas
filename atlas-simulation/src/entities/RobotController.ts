import * as THREE from 'three';
import { Robot } from './Robot';

export interface ControllerState {
  forward: number;
  strafe: number;
  yaw: number;
  ascend: number;
}

export class RobotController {
  public enabled: boolean = true;
  public moveSpeed: number = 4;
  public yawSpeed: number = 2;
  public climbSpeed: number = 2;

  private keys: Set<string> = new Set();
  private _state: ControllerState = { forward: 0, strafe: 0, yaw: 0, ascend: 0 };

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }
  }

  pressKey(code: string): void {
    this.keys.add(code);
  }

  releaseKey(code: string): void {
    this.keys.delete(code);
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.pressKey(e.code);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.releaseKey(e.code);
  }

  get state(): ControllerState {
    if (!this.enabled) return { forward: 0, strafe: 0, yaw: 0, ascend: 0 };

    let forward = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;

    let strafe = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;

    let yaw = 0;
    if (this.keys.has('KeyQ')) yaw -= 1;
    if (this.keys.has('KeyE')) yaw += 1;

    let ascend = 0;
    if (this.keys.has('Space')) ascend += 1;
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) ascend -= 1;

    this._state = { forward, strafe, yaw, ascend };
    return this._state;
  }

  update(robot: Robot, dt: number): void {
    if (!this.enabled) return;

    const s = this.state;
    const yawDelta = s.yaw * this.yawSpeed * dt;
    robot.yaw += yawDelta;

    const forwardVec = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      robot.yaw
    );
    const strafeVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      robot.yaw
    );

    const moveVec = new THREE.Vector3()
      .addScaledVector(forwardVec, s.forward)
      .addScaledVector(strafeVec, s.strafe)
      .normalize()
      .multiplyScalar(this.moveSpeed);

    robot.velocity.x = moveVec.x;
    robot.velocity.z = moveVec.z;

    robot.targetAltitude += s.ascend * this.climbSpeed * dt;
    robot.targetAltitude = Math.max(0.5, Math.min(20, robot.targetAltitude));

    robot.battery = Math.max(0, robot.battery - 0.01 * (Math.abs(s.forward) + Math.abs(s.strafe) + Math.abs(s.ascend)) * dt);
  }

  dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  }
}
