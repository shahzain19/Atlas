import * as THREE from 'three';
import { EntityBase } from './EntityBase';

export class Robot extends EntityBase {
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;
  public pitch: number = 0;
  public roll: number = 0;
  public altitude: number = 2;
  public targetAltitude: number = 2;
  public battery: number = 100;

  private body: THREE.Mesh;
  private rotorGroup: THREE.Group;
  private armMeshes: THREE.Mesh[] = [];
  private rotorMeshes: THREE.Mesh[] = [];
  private rotorSpeed: number = 0;

  constructor() {
    const group = new THREE.Group();
    super(group);

    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, metalness: 0.6, roughness: 0.3 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.15;
    group.add(this.body);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.5 });
    const armLen = 0.5;
    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, armLen, 6);
    const offsets = [
      [-0.5, 0, -0.5], [0.5, 0, -0.5], [-0.5, 0, 0.5], [0.5, 0, 0.5]
    ];
    const jointMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.3, roughness: 0.4 });
    const jointGeo = new THREE.SphereGeometry(0.06, 8, 8);

    this.rotorGroup = new THREE.Group();

    for (const [dx, , dz] of offsets) {
      const arm = new THREE.Mesh(armGeo, armMat);
      const dir = new THREE.Vector3(dx, 0, dz).normalize();
      const mid = new THREE.Vector3(dx * 0.5, 0.15, dz * 0.5);
      arm.position.copy(mid);
      arm.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir
      );
      group.add(arm);
      this.armMeshes.push(arm);

      const joint = new THREE.Mesh(jointGeo, jointMat);
      joint.position.set(dx * 0.5, 0.15, dz * 0.5);
      group.add(joint);

      const rotorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16);
      const rotorMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.2,
        roughness: 0.6,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(dx, 0.3, dz);
      this.rotorGroup.add(rotor);
      this.rotorMeshes.push(rotor);
    }

    group.add(this.rotorGroup);

    const lightGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, -0.05, 0.4);
    group.add(light);
  }

  update(dt: number): void {
    this.rotorSpeed += dt * 20;
    this.rotorMeshes.forEach((r, i) => {
      r.rotation.y = this.rotorSpeed + i * Math.PI / 2;
    });

    this.rotorGroup.position.y = Math.sin(this.rotorSpeed * 0.5) * 0.02;
  }

  get speed(): number {
    return this.velocity.length();
  }
}
