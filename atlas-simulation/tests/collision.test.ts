import { describe, it, expect } from 'vitest';
import { CollisionDetector, Collider } from '../src/physics/CollisionDetector';
import * as THREE from 'three';

describe('CollisionDetector', () => {
  const cd = new CollisionDetector();

  it('detects sphere-sphere collision', () => {
    const a: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const b: Collider = { position: new THREE.Vector3(1.5, 0, 0), radius: 1 };
    expect(cd.checkSphereSphere(a, b)).toBe(true);
  });

  it('detects no sphere-sphere collision when far apart', () => {
    const a: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const b: Collider = { position: new THREE.Vector3(5, 0, 0), radius: 1 };
    expect(cd.checkSphereSphere(a, b)).toBe(false);
  });

  it('detects sphere-AABB collision', () => {
    const sphere: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const box: Collider = {
      position: new THREE.Vector3(1.2, 0, 0),
      radius: Math.sqrt(3),
      halfExtents: new THREE.Vector3(1, 1, 1),
    };
    expect(cd.checkSphereAABB(sphere, box)).toBe(true);
  });

  it('detects no sphere-AABB collision when far', () => {
    const sphere: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const box: Collider = {
      position: new THREE.Vector3(10, 0, 0),
      radius: Math.sqrt(3),
      halfExtents: new THREE.Vector3(1, 1, 1),
    };
    expect(cd.checkSphereAABB(sphere, box)).toBe(false);
  });

  it('resolves sphere-sphere overlap by separating them', () => {
    const a: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const b: Collider = { position: new THREE.Vector3(1, 0, 0), radius: 1 };
    cd.resolveSphereSphere(a, b);

    const dist = a.position.distanceTo(b.position);
    expect(dist).toBeGreaterThanOrEqual(2 - 0.001);
  });

  it('does not separate non-overlapping spheres', () => {
    const a: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const b: Collider = { position: new THREE.Vector3(10, 0, 0), radius: 1 };
    cd.resolveSphereSphere(a, b);

    expect(a.position.x).toBe(0);
    expect(b.position.x).toBe(10);
  });

  it('handles zero-distance spheres', () => {
    const a: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    const b: Collider = { position: new THREE.Vector3(0, 0, 0), radius: 1 };
    expect(() => cd.resolveSphereSphere(a, b)).not.toThrow();
  });
});
