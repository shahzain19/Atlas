import { EventStore } from '../../src/events/event_store';
import { createTestEvent } from '../helpers';
import { resetTables } from '../mock_supabase';

describe('EventStore', () => {
  let store: EventStore;

  beforeEach(() => {
    resetTables();
    store = new EventStore();
  });

  describe('append', () => {
    it('should append an event and return it', async () => {
      const input = createTestEvent({ type: 'custom_event', payload: { key: 'value' } });
      const result = await store.append(input);
      expect(result.id).toBeDefined();
      expect(result.type).toBe('custom_event');
      expect(result.payload).toEqual({ key: 'value' });
    });
  });

  describe('getStream', () => {
    it('should return all events when no filters', async () => {
      await store.append(createTestEvent({ type: 'a' }));
      await store.append(createTestEvent({ type: 'b' }));
      const events = await store.getStream();
      expect(events.length).toBe(2);
    });

    it('should filter by type', async () => {
      await store.append(createTestEvent({ type: 'error' }));
      await store.append(createTestEvent({ type: 'info' }));
      const errors = await store.getStream('error');
      expect(errors.length).toBe(1);
    });

    it('should filter by since date', async () => {
      await store.append(createTestEvent({ type: 'old' }));
      await new Promise((r) => setTimeout(r, 10));
      const since = new Date().toISOString();
      await store.append(createTestEvent({ type: 'new' }));
      const results = await store.getStream(undefined, since);
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('new');
    });

    it('should limit results', async () => {
      await store.append(createTestEvent({ type: 'x' }));
      await store.append(createTestEvent({ type: 'y' }));
      await store.append(createTestEvent({ type: 'z' }));
      const results = await store.getStream(undefined, undefined, 2);
      expect(results.length).toBe(2);
    });
  });

  describe('replay', () => {
    it('should return events in a time range in ascending order', async () => {
      const t0 = new Date().toISOString();
      await store.append(createTestEvent({ type: 'first' }));
      await new Promise((r) => setTimeout(r, 5));
      await store.append(createTestEvent({ type: 'second' }));
      await new Promise((r) => setTimeout(r, 5));
      const t1 = new Date().toISOString();
      const events = await store.replay(t0, t1);
      expect(events.length).toBeGreaterThanOrEqual(2);
      if (events.length >= 2) {
        expect(events[0].type).toBe('first');
        expect(events[events.length - 1].type).toBe('second');
      }
    });
  });

  describe('getLatest', () => {
    it('should return the most recent event', async () => {
      await store.append(createTestEvent({ type: 'first' }));
      await new Promise((r) => setTimeout(r, 10));
      await store.append(createTestEvent({ type: 'latest' }));
      const latest = await store.getLatest();
      expect(latest).not.toBeNull();
      expect(latest!.type).toBe('latest');
    });

    it('should return null when no events exist', async () => {
      const latest = await store.getLatest();
      expect(latest).toBeNull();
    });
  });
});
