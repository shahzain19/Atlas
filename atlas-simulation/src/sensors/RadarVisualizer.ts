import * as THREE from 'three';
import { SensorVisualizer } from './SensorVisualizer';
import { SimulationConfig } from '../core/SimulationConfig';

export class RadarVisualizer extends SensorVisualizer {
  private cone: THREE.Mesh;
  private detectedPoints: THREE.Points;
  private range: number;
  private angle: number;

  constructor(config: SimulationConfig) {
    super();
    this.range = config.radarRange;
    this.angle = config.radarAngle;

    const coneGeo = new THREE.ConeGeometry(this.range * Math.tan(this.angle), this.range, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    this.cone = new THREE.Mesh(coneGeo, coneMat);
    this.cone.position.y = 0.5;
    this.group.add(this.cone);

    const dotGeo = new THREE.BufferGeometry();
    const dotPos = new Float32Array(60 * 3);
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0xff4444,
      size: 0.15,
      sizeAttenuation: true,
    });
    this.detectedPoints = new THREE.Points(dotGeo, dotMat);
    this.group.add(this.detectedPoints);
  }

  update(position: THREE.Vector3, yaw: number, _pitch: number): void {
    this.group.position.copy(position);
    this.group.rotation.y = yaw;

    const posAttr = this.detectedPoints.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < 60; i++) {
      const t = Math.random();
      const a = (Math.random() - 0.5) * this.angle * 2;
      const e = (Math.random() - 0.5) * this.angle;
      const dist = t * this.range;
      arr[i * 3] = Math.cos(a) * Math.cos(e) * dist;
      arr[i * 3 + 1] = 0.5 + Math.sin(e) * dist;
      arr[i * 3 + 2] = Math.sin(a) * Math.cos(e) * dist;
    }
    posAttr.needsUpdate = true;
  }

  dispose(): void {
    this.cone.geometry.dispose();
    (this.cone.material as THREE.Material).dispose();
    this.detectedPoints.geometry.dispose();
    (this.detectedPoints.material as THREE.Material).dispose();
  }
}
