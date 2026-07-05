import { Simulation } from './core/Simulation';

const sim = new Simulation();
sim.start();

window.addEventListener('resize', () => {});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    sim.dispose();
  });
}
