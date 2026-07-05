import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Robot } from '../entities/Robot';

export type CamMode = 'orbit' | 'follow' | 'topdown' | 'firstperson';

export class CameraController {
  public mode: CamMode = 'orbit';
  public orbitControls: OrbitControls;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private target: THREE.Vector3 = new THREE.Vector3();
  private smoothTarget: THREE.Vector3 = new THREE.Vector3();
  private followOffset: THREE.Vector3 = new THREE.Vector3(0, 5, -8);

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.orbitControls = new OrbitControls(camera, renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.1;
    this.orbitControls.minDistance = 2;
    this.orbitControls.maxDistance = 50;
    this.orbitControls.maxPolarAngle = Math.PI / 2.1;
    this.orbitControls.target.set(0, 0, 0);
  }

  setMode(mode: CamMode): void {
    this.mode = mode;
    this.orbitControls.enabled = mode === 'orbit';
  }

  followRobot(robot: Robot): void {
    this.target.copy(robot.position);
    this.smoothTarget.lerp(this.target, 0.1);

    switch (this.mode) {
      case 'follow': {
        const offset = this.followOffset.clone().applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          robot.yaw
        );
        this.camera.position.lerp(
          this.smoothTarget.clone().add(offset),
          0.05
        );
        this.camera.lookAt(this.smoothTarget);
        break;
      }
      case 'topdown': {
        this.camera.position.lerp(
          new THREE.Vector3(this.smoothTarget.x, 20, this.smoothTarget.z + 0.01),
          0.05
        );
        this.camera.lookAt(this.smoothTarget);
        break;
      }
      case 'firstperson': {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          robot.yaw
        );
        const eyePos = this.smoothTarget.clone().add(
          forward.clone().multiplyScalar(-0.3)
        );
        eyePos.y += 1.5;
        this.camera.position.lerp(eyePos, 0.1);
        this.camera.lookAt(
          this.smoothTarget.clone().add(forward.multiplyScalar(10))
        );
        break;
      }
      case 'orbit':
      default:
        this.orbitControls.update();
        break;
    }
  }
}
