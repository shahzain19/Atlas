export class TelemetryPanel {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private width: number = 200;
  private height: number = 120;

  private speedHistory: number[] = [];
  private altitudeHistory: number[] = [];
  private batteryHistory: number[] = [];
  private maxSamples: number = 80;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      position: absolute; bottom: 8px; left: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 4px;
      background: rgba(0,0,0,0.5);
    `;
    this.ctx = this.canvas.getContext('2d')!;

    this.container = document.getElementById('hud') as HTMLDivElement;
    this.container.appendChild(this.canvas);
  }

  update(speed: number, altitude: number, battery: number): void {
    this.speedHistory.push(speed);
    this.altitudeHistory.push(altitude);
    this.batteryHistory.push(battery);

    if (this.speedHistory.length > this.maxSamples) this.speedHistory.shift();
    if (this.altitudeHistory.length > this.maxSamples) this.altitudeHistory.shift();
    if (this.batteryHistory.length > this.maxSamples) this.batteryHistory.shift();

    this.draw();
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const pad = 10;
    const plotW = w - pad * 2;
    const plotH = (h - pad * 3) / 3;

    ctx.clearRect(0, 0, w, h);

    const datasets = [
      { data: this.speedHistory, color: '#44aaff', max: 10, label: 'SPD' },
      { data: this.altitudeHistory, color: '#44ff44', max: 20, label: 'ALT' },
      { data: this.batteryHistory, color: '#ffaa44', max: 100, label: 'BAT' },
    ];

    datasets.forEach((ds, i) => {
      const y0 = pad + i * (plotH + pad);
      const color = ds.color;

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '8px monospace';
      ctx.fillText(ds.label, pad, y0 + 8);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      ds.data.forEach((val, j) => {
        const x = pad + (j / this.maxSamples) * plotW;
        const y = y0 + plotH - (val / ds.max) * plotH;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    });
  }

  dispose(): void {
    this.canvas.remove();
  }
}
