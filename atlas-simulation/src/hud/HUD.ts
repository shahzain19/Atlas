export class HUD {
  public container: HTMLDivElement;
  private fpsElement: HTMLDivElement;
  private statusElement: HTMLDivElement;
  private frames: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  constructor() {
    this.container = document.getElementById('hud') as HTMLDivElement;

    const style = document.createElement('style');
    style.textContent = `
      .hud-panel {
        position: absolute;
        background: rgba(0,0,0,0.6);
        color: #0f0;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.1);
        pointer-events: none;
        user-select: none;
      }
      .hud-panel span { color: #fff; }
      .hud-fps { top: 8px; right: 8px; }
      .hud-status { top: 8px; left: 8px; min-width: 180px; }
    `;
    document.head.appendChild(style);

    this.fpsElement = document.createElement('div');
    this.fpsElement.className = 'hud-panel hud-fps';
    this.fpsElement.textContent = 'FPS: --';
    this.container.appendChild(this.fpsElement);

    this.statusElement = document.createElement('div');
    this.statusElement.className = 'hud-panel hud-status';
    this.statusElement.innerHTML = this.statusHTML(0, 0, 0, 100, 0);
    this.container.appendChild(this.statusElement);
  }

  private statusHTML(x: number, z: number, speed: number, battery: number, altitude: number): string {
    return `
      <div>POS: <span>${x.toFixed(1)}</span>, <span>${z.toFixed(1)}</span></div>
      <div>SPD: <span>${speed.toFixed(1)}</span> m/s</div>
      <div>ALT: <span>${altitude.toFixed(1)}</span> m</div>
      <div>BAT: <span>${battery.toFixed(0)}</span>%</div>
    `;
  }

  updateFps(time: number): void {
    this.frames++;
    if (time - this.lastFpsUpdate >= 1.0) {
      this.currentFps = this.frames;
      this.frames = 0;
      this.lastFpsUpdate = time;
      this.fpsElement.textContent = `FPS: ${this.currentFps}`;
    }
  }

  updateStatus(x: number, z: number, speed: number, battery: number, altitude: number): void {
    this.statusElement.innerHTML = this.statusHTML(x, z, speed, battery, altitude);
  }

  dispose(): void {
    this.fpsElement.remove();
    this.statusElement.remove();
  }
}
