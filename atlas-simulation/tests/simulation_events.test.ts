import { describe, it, expect } from 'vitest';
import { SimulationEvents } from '../src/core/SimulationEvents';

describe('SimulationEvents', () => {
  it('emits event to registered listener', () => {
    const ev = new SimulationEvents();
    let called = false;
    ev.on('test', () => { called = true; });
    ev.emit('test');
    expect(called).toBe(true);
  });

  it('passes arguments to listener', () => {
    const ev = new SimulationEvents();
    let result = '';
    ev.on('data', (msg: string) => { result = msg; });
    ev.emit('data', 'hello');
    expect(result).toBe('hello');
  });

  it('unregisters listener with off', () => {
    const ev = new SimulationEvents();
    let count = 0;
    const fn = () => { count++; };
    ev.on('test', fn);
    ev.emit('test');
    ev.off('test', fn);
    ev.emit('test');
    expect(count).toBe(1);
  });

  it('does not affect other events when clearing one', () => {
    const ev = new SimulationEvents();
    let a = 0;
    let b = 0;
    ev.on('A', () => { a++; });
    ev.on('B', () => { b++; });
    ev.emit('A');
    ev.emit('A');
    expect(a).toBe(2);
    expect(b).toBe(0);
  });

  it('clears all listeners', () => {
    const ev = new SimulationEvents();
    let count = 0;
    ev.on('x', () => { count++; });
    ev.on('y', () => { count++; });
    ev.clear();
    ev.emit('x');
    ev.emit('y');
    expect(count).toBe(0);
  });

  it('handles multiple listeners for same event', () => {
    const ev = new SimulationEvents();
    let a = 0;
    let b = 0;
    ev.on('test', () => { a++; });
    ev.on('test', () => { b++; });
    ev.emit('test');
    expect(a).toBe(1);
    expect(b).toBe(1);
  });
});
