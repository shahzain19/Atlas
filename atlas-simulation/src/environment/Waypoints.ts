import * as THREE from 'three';
import { SimulationEvents } from '../core/SimulationEvents';
import { SimulationConfig } from '../core/SimulationConfig';

export class Waypoints {
  public group: THREE.Group = new THREE.Group();
  public events: SimulationEvents = new SimulationEvents();
  public waypoints: { mesh: THREE.Mesh; position: THREE.Vector3; completed: boolean; index: number }[] = [];
  public currentTarget: number = 0;
  public completionRadius: number = 1.5;

  private labels: THREE.Sprite[] = [];
  private canvas = document.createElement('canvas');

  constructor(config: SimulationConfig) {
    this.canvas.width = 64;
    this.canvas.height = 64;

    const count = config.waypointCount;
    const areaSize = 15;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.3, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff8800,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * areaSize * 2,
        0.5,
        (Math.random() - 0.5) * areaSize * 2
      );
      mesh.castShadow = true;

      this.group.add(mesh);
      this.waypoints.push({
        mesh,
        position: mesh.position.clone(),
        completed: false,
        index: i,
      });

      this.labels.push(this.createLabel(i + 1, mesh.position));
    }
  }

  private createLabel(num: number, pos: THREE.Vector3): THREE.Sprite {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 64, 64);

    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), 32, 33);

    const tex = new THREE.CanvasTexture(this.canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.position.y += 1.0;
    sprite.scale.set(0.8, 0.8, 1);
    this.group.add(sprite);

    return sprite;
  }

  checkProgress(position: THREE.Vector3): void {
    if (this.currentTarget >= this.waypoints.length) return;

    const wp = this.waypoints[this.currentTarget];
    const dist = position.distanceTo(wp.position);

    if (dist < this.completionRadius) {
      wp.completed = true;
      (wp.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x44cc44);
      (wp.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x44cc44);
      this.events.emit('waypoint-reached', this.currentTarget);
      this.currentTarget++;

      if (this.currentTarget >= this.waypoints.length) {
        this.events.emit('all-waypoints-reached');
      }
    }
  }

  dispose(): void {
    this.waypoints.forEach(wp => {
      wp.mesh.geometry.dispose();
      if (Array.isArray(wp.mesh.material)) {
        wp.mesh.material.forEach(m => m.dispose());
      } else {
        wp.mesh.material.dispose();
      }
    });
    this.labels.forEach(l => {
      (l.material as THREE.SpriteMaterial).map?.dispose();
      l.material.dispose();
    });
  }
}
