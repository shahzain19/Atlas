import * as THREE from 'three';
import { SensorVisualizer } from './SensorVisualizer';
import { SimulationConfig } from '../core/SimulationConfig';

export class LidarVisualizer extends SensorVisualizer {
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private rayCount: number;
  private range: number;

  constructor(config: SimulationConfig) {
    super();
    this.rayCount = config.lidarRayCount;
    this.range = config.lidarRange;

    const count = this.rayCount;
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  update(position: THREE.Vector3, yaw: number, _pitch: number): void {
    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.points.geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.rayCount; i++) {
      const angle = (i / this.rayCount) * Math.PI * 2 + yaw;
      const elevation = Math.sin(i * 1.7) * 0.3;

      const hitDist = this.range * (0.3 + Math.random() * 0.7);
      const x = position.x + Math.cos(angle) * Math.cos(elevation) * hitDist;
      const z = position.z + Math.sin(angle) * Math.cos(elevation) * hitDist;
      const y = position.y + 0.5 + Math.sin(elevation) * hitDist;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const t = hitDist / this.range;
      this.colors[i * 3] = t;
      this.colors[i * 3 + 1] = 1 - t * 0.5;
      this.colors[i * 3 + 2] = 1 - t;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
