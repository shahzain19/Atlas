import { SemanticMemory } from '../../src/memory/semantic_memory';
import { cleanupTables } from '../setup';

describe('SemanticMemory', () => {
  let sm: SemanticMemory;

  beforeEach(async () => {
    await cleanupTables();
    sm = new SemanticMemory();
  });

  describe('add', () => {
    it('should add a memory entry', async () => {
      const entry = await sm.add({ content: 'Hello world', metadata: { source: 'test' } });
      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('Hello world');
      expect(entry.metadata).toEqual({ source: 'test' });
    });
  });

  describe('search', () => {
    it('should return entries sorted by similarity', async () => {
      await sm.add({ content: 'The cat sat on the mat' });
      await sm.add({ content: 'Dogs are great pets' });
      await sm.add({ content: 'Cats and dogs are both animals' });

      const results = await sm.search('cat', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity).toBeGreaterThan(0);
    });

    it('should respect the limit', async () => {
      await sm.add({ content: 'one' });
      await sm.add({ content: 'two' });
      await sm.add({ content: 'three' });

      const results = await sm.search('one', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array when no entries', async () => {
      const results = await sm.search('anything');
      expect(results).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all entries', async () => {
      await sm.add({ content: 'something' });
      await sm.clear();
      const results = await sm.search('something');
      expect(results).toEqual([]);
    });
  });
});
