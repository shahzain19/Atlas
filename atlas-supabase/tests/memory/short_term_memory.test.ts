import { ShortTermMemory } from '../../src/memory/short_term_memory';
import { createTestEvent } from '../helpers';
import { cleanupTables } from '../setup';

describe('ShortTermMemory', () => {
  let stm: ShortTermMemory;

  beforeEach(async () => {
    await cleanupTables();
    stm = new ShortTermMemory();
  });

  describe('remember', () => {
    it('should insert an event and return it with an id', async () => {
      const input = createTestEvent({ type: 'user_message', source: 'user1' });
      const result = await stm.remember(input);
      expect(result.id).toBeDefined();
      expect(result.type).toBe('user_message');
      expect(result.source).toBe('user1');
    });
  });

  describe('getRecentEvents', () => {
    it('should return events ordered by created_at desc', async () => {
      await stm.remember(createTestEvent({ type: 'first' }));
      await new Promise((r) => setTimeout(r, 5));
      await stm.remember(createTestEvent({ type: 'second' }));
      const events = await stm.getRecentEvents();
      expect(events.length).toBeGreaterThanOrEqual(2);
      const idxFirst = events.findIndex((e) => e.type === 'first');
      const idxSecond = events.findIndex((e) => e.type === 'second');
      expect(idxSecond).toBeLessThan(idxFirst);
    });

    it('should respect the limit parameter', async () => {
      await stm.remember(createTestEvent({ type: 'a' }));
      await stm.remember(createTestEvent({ type: 'b' }));
      await stm.remember(createTestEvent({ type: 'c' }));
      const events = await stm.getRecentEvents(2);
      expect(events.length).toBeLessThanOrEqual(2);
    });
  });

  describe('findRecentByType', () => {
    it('should return only events of the given type', async () => {
      await stm.remember(createTestEvent({ type: 'foo' }));
      await stm.remember(createTestEvent({ type: 'bar' }));
      await stm.remember(createTestEvent({ type: 'foo' }));
      const foos = await stm.findRecentByType('foo');
      expect(foos.every((e) => e.type === 'foo')).toBe(true);
      expect(foos.length).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all events', async () => {
      await stm.remember(createTestEvent());
      await stm.clear();
      const events = await stm.getRecentEvents();
      expect(events.length).toBe(0);
    });
  });
});
