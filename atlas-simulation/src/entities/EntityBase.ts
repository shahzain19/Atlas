import * as THREE from 'three';
import { SimulationEvents } from '../core/SimulationEvents';

export abstract class EntityBase {
  public mesh: THREE.Object3D;
  public events: SimulationEvents;

  protected constructor(mesh: THREE.Object3D) {
    this.mesh = mesh;
    this.events = new SimulationEvents();
  }

  abstract update(dt: number): void;

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  set position(v: THREE.Vector3) {
    this.mesh.position.copy(v);
  }

  get quaternion(): THREE.Quaternion {
    return this.mesh.quaternion;
  }

  dispose(): void {
    this.events.clear();
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
