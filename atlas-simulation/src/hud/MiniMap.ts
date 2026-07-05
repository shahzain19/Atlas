import * as THREE from 'three';
import { ObstacleData } from '../environment/Obstacles';

export class MiniMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private size: number = 150;
  private scale: number = 4;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.cssText = `
      position: absolute; bottom: 8px; right: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 4px;
      background: rgba(0,0,0,0.5);
    `;
    this.ctx = this.canvas.getContext('2d')!;

    this.container = document.getElementById('hud') as HTMLDivElement;
    this.container.appendChild(this.canvas);
  }

  update(
    robotPos: THREE.Vector3,
    robotYaw: number,
    obstacles: ObstacleData[],
    waypointPositions: { position: THREE.Vector3; completed: boolean }[]
  ): void {
    const ctx = this.ctx;
    const s = this.size;
    const scale = this.scale;

    ctx.clearRect(0, 0, s, s);

    const cx = s / 2;
    const cy = s / 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, s - 2, s - 2);

    const toScreen = (wx: number, wz: number): [number, number] => {
      const dx = (wx - robotPos.x) * scale;
      const dz = (wz - robotPos.z) * scale;
      return [cx + dx, cy + dz];
    };

    for (const wp of waypointPositions) {
      const [sx, sy] = toScreen(wp.position.x, wp.position.z);
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = wp.completed ? '#44cc44' : '#ffaa00';
      ctx.fill();
    }

    for (const obs of obstacles) {
      const [sx, sy] = toScreen(obs.mesh.position.x, obs.mesh.position.z);
      ctx.fillStyle = '#aa5555';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-robotYaw);
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3, 3);
    ctx.lineTo(3, 3);
    ctx.closePath();
    ctx.fillStyle = '#44aaff';
    ctx.fill();
    ctx.restore();
  }

  dispose(): void {
    this.canvas.remove();
  }
}
