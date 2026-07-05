import { LongTermMemory } from '../../src/memory/long_term_memory';
import { createTestEvent } from '../helpers';
import { cleanupTables } from '../setup';

describe('LongTermMemory', () => {
  let ltm: LongTermMemory;

  beforeEach(async () => {
    await cleanupTables();
    ltm = new LongTermMemory();
  });

  describe('logEvent', () => {
    it('should log an event and return it', async () => {
      const input = createTestEvent({ type: 'observation', importance: 0.9 });
      const result = await ltm.logEvent(input);
      expect(result.id).toBeDefined();
      expect(result.importance).toBe(0.9);
    });
  });

  describe('getEvents', () => {
    it('should return all events when no filters', async () => {
      await ltm.logEvent(createTestEvent({ type: 'a' }));
      await ltm.logEvent(createTestEvent({ type: 'b' }));
      const events = await ltm.getEvents();
      expect(events.length).toBe(2);
    });

    it('should filter by type', async () => {
      await ltm.logEvent(createTestEvent({ type: 'a' }));
      await ltm.logEvent(createTestEvent({ type: 'b' }));
      const events = await ltm.getEvents({ type: 'a' });
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('a');
    });

    it('should filter by minPriority', async () => {
      await ltm.logEvent(createTestEvent({ type: 'x', priority: 1 }));
      await ltm.logEvent(createTestEvent({ type: 'y', priority: 5 }));
      const events = await ltm.getEvents({ minPriority: 3 });
      expect(events.length).toBe(1);
      expect(events[0].priority).toBe(5);
    });

    it('should filter by date range', async () => {
      const old = createTestEvent({ type: 'old' });
      const recent = createTestEvent({ type: 'recent' });
      await ltm.logEvent(old);
      await new Promise((r) => setTimeout(r, 10));
      const beforeRecent = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 10));
      await ltm.logEvent(recent);
      const events = await ltm.getEvents({ since: beforeRecent });
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('recent');
    });
  });

  describe('clear', () => {
    it('should remove all events', async () => {
      await ltm.logEvent(createTestEvent());
      await ltm.clear();
      const events = await ltm.getEvents();
      expect(events.length).toBe(0);
    });
  });
});
