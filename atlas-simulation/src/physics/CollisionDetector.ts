import * as THREE from 'three';

export interface Collider {
  position: THREE.Vector3;
  radius: number;
  halfExtents?: THREE.Vector3;
}

export class CollisionDetector {
  checkSphereSphere(a: Collider, b: Collider): boolean {
    const dist = a.position.distanceTo(b.position);
    return dist < a.radius + b.radius;
  }

  checkSphereAABB(sphere: Collider, box: Collider): boolean {
    if (!box.halfExtents) return false;

    const closest = new THREE.Vector3().copy(sphere.position);
    const min = new THREE.Vector3().copy(box.position).sub(box.halfExtents);
    const max = new THREE.Vector3().copy(box.position).add(box.halfExtents);

    closest.x = Math.max(min.x, Math.min(closest.x, max.x));
    closest.y = Math.max(min.y, Math.min(closest.y, max.y));
    closest.z = Math.max(min.z, Math.min(closest.z, max.z));

    const dist = sphere.position.distanceTo(closest);
    return dist < sphere.radius;
  }

  resolveSphereSphere(a: Collider, b: Collider): void {
    if (!this.checkSphereSphere(a, b)) return;

    const dir = new THREE.Vector3().copy(a.position).sub(b.position);
    const dist = dir.length();
    if (dist < 0.001) return;

    const overlap = a.radius + b.radius - dist;
    dir.normalize().multiplyScalar(overlap * 0.5);
    a.position.add(dir);
    b.position.sub(dir);
  }
}
