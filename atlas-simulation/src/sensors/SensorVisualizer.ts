import * as THREE from 'three';

export abstract class SensorVisualizer {
  public group: THREE.Group = new THREE.Group();

  abstract update(position: THREE.Vector3, yaw: number, pitch: number): void;

  abstract dispose(): void;
}
