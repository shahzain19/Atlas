import * as THREE from 'three';
import { SensorVisualizer } from './SensorVisualizer';

export class GPSTrail extends SensorVisualizer {
  private dots: THREE.Points;
  private positions: Float32Array;
  private maxPoints: number;
  private index: number = 0;
  private filled: boolean = false;

  constructor(maxPoints: number = 100) {
    super();
    this.maxPoints = maxPoints;

    this.positions = new Float32Array(maxPoints * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x44aaff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.dots = new THREE.Points(geo, mat);
    this.group.add(this.dots);
  }

  update(position: THREE.Vector3, _yaw: number, _pitch: number): void {
    this.positions[this.index * 3] = position.x;
    this.positions[this.index * 3 + 1] = position.y + 0.1;
    this.positions[this.index * 3 + 2] = position.z;

    if (!this.filled) {
      for (let i = 0; i < this.maxPoints; i++) {
        this.positions[i * 3] = position.x;
        this.positions[i * 3 + 1] = position.y + 0.1;
        this.positions[i * 3 + 2] = position.z;
      }
      this.filled = true;
    }

    this.index = (this.index + 1) % this.maxPoints;

    const posAttr = this.dots.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
  }

  dispose(): void {
    this.dots.geometry.dispose();
    (this.dots.material as THREE.Material).dispose();
  }
}
