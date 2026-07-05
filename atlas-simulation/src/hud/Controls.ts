import { RobotController } from '../entities/RobotController';

const CONTROL_KEYS: Record<string, string> = {
  forward: 'KeyW',
  backward: 'KeyS',
  strafeLeft: 'KeyA',
  strafeRight: 'KeyD',
  yawLeft: 'KeyQ',
  yawRight: 'KeyE',
  ascend: 'Space',
  descend: 'ShiftLeft',
};

export class Controls {
  public container: HTMLDivElement;

  constructor(controller: RobotController) {
    this.container = document.createElement('div');
    this.container.id = 'onscreen-controls';
    const s = document.createElement('style');
    s.textContent = `
      #onscreen-controls {
        position: absolute; bottom: 100px; left: 0; width: 100%;
        display: flex; justify-content: space-between; padding: 0 24px;
        pointer-events: none; box-sizing: border-box;
        z-index: 10;
      }
      #onscreen-controls > div { display: flex; gap: 8px; pointer-events: auto; }
      .ctrl-btn {
        width: 56px; height: 56px; border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(0,0,0,0.5); color: #fff;
        font-size: 20px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; user-select: none; -webkit-user-select: none;
        touch-action: manipulation; backdrop-filter: blur(4px);
      }
      .ctrl-btn:active { background: rgba(255,255,255,0.2); }
      .ctrl-btn.label { font-size: 10px; width: auto; padding: 0 14px; }
    `;
    document.head.appendChild(s);

    const leftPad = document.createElement('div');

    const addBtn = (label: string, key: string, container: HTMLElement) => {
      const btn = document.createElement('div');
      btn.className = 'ctrl-btn';
      btn.textContent = label;
      const start = (e: Event) => { e.preventDefault(); controller.pressKey(key); };
      const end = (e: Event) => { e.preventDefault(); controller.releaseKey(key); };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      container.appendChild(btn);
    };

    const dPad = document.createElement('div');
    dPad.style.display = 'grid';
    dPad.style.gridTemplateColumns = 'repeat(3, 56px)';
    dPad.style.gridTemplateRows = 'repeat(3, 56px)';
    dPad.style.gap = '4px';

    dPad.appendChild(document.createElement('div'));
    addBtn('▲', CONTROL_KEYS.forward, dPad);
    dPad.appendChild(document.createElement('div'));
    addBtn('◄', CONTROL_KEYS.strafeLeft, dPad);
    const dPadCenter = document.createElement('div');
    dPadCenter.className = 'ctrl-btn';
    dPadCenter.textContent = '■';
    dPadCenter.style.background = 'rgba(255,50,50,0.3)';
    dPadCenter.style.borderColor = 'rgba(255,50,50,0.4)';
    const pauseStart = () => { const sim = (window as any).__sim; if (sim) sim.togglePause(); };
    dPadCenter.addEventListener('pointerdown', pauseStart);
    dPad.appendChild(dPadCenter);
    addBtn('►', CONTROL_KEYS.strafeRight, dPad);
    dPad.appendChild(document.createElement('div'));
    addBtn('▼', CONTROL_KEYS.backward, dPad);
    dPad.appendChild(document.createElement('div'));
    leftPad.appendChild(dPad);

    const rightPad = document.createElement('div');
    rightPad.style.flexDirection = 'column';
    rightPad.style.alignItems = 'flex-end';
    addBtn('▲ Alt', CONTROL_KEYS.ascend, rightPad);
    addBtn('▼ Alt', CONTROL_KEYS.descend, rightPad);

    const yawRow = document.createElement('div');
    addBtn('⟲', CONTROL_KEYS.yawLeft, yawRow);
    addBtn('⟳', CONTROL_KEYS.yawRight, yawRow);
    rightPad.appendChild(yawRow);

    this.container.appendChild(leftPad);
    this.container.appendChild(rightPad);
    document.body.appendChild(this.container);
  }

  dispose(): void {
    this.container.remove();
  }
}
