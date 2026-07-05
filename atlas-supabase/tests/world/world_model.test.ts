import { WorldModel } from '../../src/world/world_model';
import { createTestWorldObject } from '../helpers';
import { cleanupTables } from '../setup';

describe('WorldModel', () => {
  let world: WorldModel;

  beforeEach(async () => {
    await cleanupTables();
    world = new WorldModel();
  });

  describe('addObject', () => {
    it('should add a world object', async () => {
      const obj = await world.addObject(createTestWorldObject({ object_type: 'tree', position_x: 10, position_y: 20 }));
      expect(obj.id).toBeDefined();
      expect(obj.object_type).toBe('tree');
      expect(obj.position_x).toBe(10);
      expect(obj.position_y).toBe(20);
    });
  });

  describe('getObject', () => {
    it('should return null for non-existent object', async () => {
      const obj = await world.getObject('00000000-0000-0000-0000-000000000999');
      expect(obj).toBeNull();
    });

    it('should return the object by id', async () => {
      const added = await world.addObject(createTestWorldObject({ label: 'test-obj' }));
      const fetched = await world.getObject(added.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.label).toBe('test-obj');
    });
  });

  describe('updateObject', () => {
    it('should update object fields', async () => {
      const obj = await world.addObject(createTestWorldObject({ position_x: 0 }));
      const updated = await world.updateObject(obj.id, { position_x: 100, label: 'moved' });
      expect(updated.position_x).toBe(100);
      expect(updated.label).toBe('moved');
    });
  });

  describe('removeObject', () => {
    it('should remove the object', async () => {
      const obj = await world.addObject(createTestWorldObject());
      await world.removeObject(obj.id);
      const fetched = await world.getObject(obj.id);
      expect(fetched).toBeNull();
    });
  });

  describe('getAllObjects', () => {
    it('should return all objects', async () => {
      await world.addObject(createTestWorldObject({ object_type: 'a' }));
      await world.addObject(createTestWorldObject({ object_type: 'b' }));
      const all = await world.getAllObjects();
      expect(all.length).toBe(2);
    });
  });

  describe('getObjectsByType', () => {
    it('should filter by type', async () => {
      await world.addObject(createTestWorldObject({ object_type: 'wall' }));
      await world.addObject(createTestWorldObject({ object_type: 'door' }));
      const walls = await world.getObjectsByType('wall');
      expect(walls.length).toBe(1);
      expect(walls[0].object_type).toBe('wall');
    });
  });

  describe('getObjectsWithinRadius', () => {
    it('should return objects within radius', async () => {
      await world.addObject(createTestWorldObject({ position_x: 5, position_y: 0 }));
      await world.addObject(createTestWorldObject({ position_x: 50, position_y: 50 }));
      const nearby = await world.getObjectsWithinRadius(0, 0, 0, 10);
      expect(nearby.length).toBe(1);
      expect(nearby[0].position_x).toBe(5);
    });
  });

  describe('own position', () => {
    it('should set and get own position', async () => {
      await world.setOwnPosition(1, 2, 3);
      const pos = await world.getOwnPosition();
      expect(pos).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should update own position', async () => {
      await world.setOwnPosition(0, 0, 0);
      await world.setOwnPosition(10, 20, 30);
      const pos = await world.getOwnPosition();
      expect(pos).toEqual({ x: 10, y: 20, z: 30 });
    });
  });
});
