import * as THREE from 'three';
import { SimulationConfig } from '../core/SimulationConfig';

export interface ObstacleData {
  mesh: THREE.Mesh;
  radius: number;
  halfExtents: THREE.Vector3;
}

export class Obstacles {
  public group: THREE.Group = new THREE.Group();
  public obstacles: ObstacleData[] = [];

  constructor(config: SimulationConfig) {
    const count = config.obstacleCount;
    const areaSize = 20;

    for (let i = 0; i < count; i++) {
      const isBox = i % 2 === 0;
      let geo: THREE.BufferGeometry;
      let radius: number;
      let halfExtents: THREE.Vector3;

      if (isBox) {
        const size = 0.5 + Math.random() * 1.0;
        geo = new THREE.BoxGeometry(size, size, size);
        radius = Math.sqrt(3) * size / 2;
        halfExtents = new THREE.Vector3(size / 2, size / 2, size / 2);
      } else {
        const r = 0.3 + Math.random() * 0.6;
        geo = new THREE.SphereGeometry(r, 12, 12);
        radius = r;
        halfExtents = new THREE.Vector3(r, r, r);
      }

      const hue = 0.08 + Math.random() * 0.12;
      const color = new THREE.Color().setHSL(hue, 0.7, 0.4 + Math.random() * 0.2);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const x = (Math.random() - 0.5) * areaSize * 2;
      const z = (Math.random() - 0.5) * areaSize * 2;
      mesh.position.set(x, 1.0, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.group.add(mesh);
      this.obstacles.push({ mesh, radius, halfExtents });
    }
  }

  dispose(): void {
    this.obstacles.forEach(o => {
      o.mesh.geometry.dispose();
      if (Array.isArray(o.mesh.material)) {
        o.mesh.material.forEach(m => m.dispose());
      } else {
        o.mesh.material.dispose();
      }
    });
  }
}
