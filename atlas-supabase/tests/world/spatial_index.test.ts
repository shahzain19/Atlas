import { SpatialIndex } from '../../src/world/spatial_index';
import { WorldModel } from '../../src/world/world_model';
import { createTestWorldObject } from '../helpers';
import { resetTables } from '../mock_supabase';

describe('SpatialIndex', () => {
  let index: SpatialIndex;
  let world: WorldModel;

  const ORIGIN = { x: 0, y: 0, z: 0 };

  beforeEach(async () => {
    resetTables();
    index = new SpatialIndex();
    world = new WorldModel();
    await world.addObject(createTestWorldObject({ object_type: 'rock', position_x: 5, position_y: 0 }));
    await world.addObject(createTestWorldObject({ object_type: 'tree', position_x: 15, position_y: 0 }));
    await world.addObject(createTestWorldObject({ object_type: 'house', position_x: 100, position_y: 100 }));
  });

  describe('findNearby', () => {
    it('should find objects within radius', async () => {
      const nearby = await index.findNearby(ORIGIN.x, ORIGIN.y, ORIGIN.z, 10);
      expect(nearby.length).toBe(1);
      expect(nearby[0].object_type).toBe('rock');
    });
  });

  describe('findInBounds', () => {
    it('should find objects within bounding box', async () => {
      const bounds = { minX: 0, minY: 0, minZ: 0, maxX: 20, maxY: 20, maxZ: 20 };
      const results = await index.findInBounds(bounds);
      expect(results.length).toBe(2);
    });
  });

  describe('findNearest', () => {
    it('should return the nearest object', async () => {
      const nearest = await index.findNearest(ORIGIN.x, ORIGIN.y, ORIGIN.z);
      expect(nearest).not.toBeNull();
      expect(nearest!.object_type).toBe('rock');
    });

    it('should filter by type when specified', async () => {
      const nearest = await index.findNearest(ORIGIN.x, ORIGIN.y, ORIGIN.z, 'tree');
      expect(nearest).not.toBeNull();
      expect(nearest!.object_type).toBe('tree');
    });

    it('should return null when no objects exist with given type', async () => {
      const nearest = await index.findNearest(ORIGIN.x, ORIGIN.y, ORIGIN.z, 'nonexistent');
      expect(nearest).toBeNull();
    });
  });

  describe('findFarthest', () => {
    it('should return the farthest object', async () => {
      const farthest = await index.findFarthest(ORIGIN.x, ORIGIN.y, ORIGIN.z);
      expect(farthest).not.toBeNull();
      expect(farthest!.object_type).toBe('house');
    });
  });

  describe('getSpatialDensity', () => {
    it('should count objects within radius', async () => {
      const density = await index.getSpatialDensity(ORIGIN.x, ORIGIN.y, ORIGIN.z, 20);
      expect(density).toBe(2);
    });
  });
});
