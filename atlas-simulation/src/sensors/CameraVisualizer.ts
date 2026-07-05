import * as THREE from 'three';
import { SensorVisualizer } from './SensorVisualizer';

export class CameraVisualizer extends SensorVisualizer {
  private frustumHelper: THREE.CameraHelper | null = null;
  private sensorCamera: THREE.PerspectiveCamera;

  constructor(fov: number = 70, aspect: number = 16 / 9, near: number = 0.5, far: number = 30) {
    super();
    this.sensorCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.frustumHelper = new THREE.CameraHelper(this.sensorCamera);
    this.group.add(this.frustumHelper);
  }

  update(position: THREE.Vector3, yaw: number, pitch: number): void {
    if (!this.frustumHelper) return;
    this.sensorCamera.position.copy(position);
    this.sensorCamera.position.y += 0.5;
    this.sensorCamera.rotation.order = 'YXZ';
    this.sensorCamera.rotation.y = yaw;
    this.sensorCamera.rotation.x = pitch;
    this.frustumHelper.update();
  }

  dispose(): void {
    if (this.frustumHelper) {
      this.frustumHelper.removeFromParent();
    }
  }
}
