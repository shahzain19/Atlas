export class Scheduler {
  private intervalId?: any;
  private tickHandlers: ((dt: number) => void)[] = [];

  start(tickRateMs = 16) {
    let last = Date.now();

    this.intervalId = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;

      for (const handler of this.tickHandlers) {
        handler(dt);
      }
    }, tickRateMs);
  }

  onTick(handler: (dt: number) => void) {
    this.tickHandlers.push(handler);
  }

  stop() {
    clearInterval(this.intervalId);
  }
}