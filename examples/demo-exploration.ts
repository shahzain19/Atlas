import { Atlas } from "../atlas-api";
import { WorldModel } from "../atlas-memory/WorldModel/WorldModel";
import { GridMap } from "../atlas-memory/Map/GridMap";
import { KnowledgeGraph } from "../atlas-memory/KnowledgeGraph/KnowledgeGraph";
import { ObstacleTracker } from "../atlas-memory/Obstacles/ObstacleTracker";
import { SemanticMap } from "../atlas-memory/SemanticMap/SemanticMap";

async function main() {
  const atlas = new Atlas({ autoStart: false });

  // Atlas-level event logging
  atlas.on("GPS_UPDATE", (e) => {
    const p = e.payload as any;
    console.log(`  Pos: ${p.x?.toFixed(4)}, ${p.y?.toFixed(4)}, ${p.z?.toFixed(2)}`);
  });
  atlas.on("OBJECT_DETECTED", (e) => {
    const d = e.payload as any;
    console.log(`  Found: ${d.object} (${(d.confidence * 100).toFixed(0)}% confidence)`);
  });
  atlas.on("WAYPOINT_REACHED", (e) => {
    const wp = e.payload as any;
    console.log(`  Reached waypoint: ${wp.label || wp.waypointId}`);
  });
  atlas.on("BATTERY_LOW", () => {
    console.log("  WARNING: Battery low!");
  });

  // Internal world representation
  const worldModel = new WorldModel();
  const gridMap = new GridMap(10, 100, 100, { x: -500, y: -500 });
  const obstacleTracker = new ObstacleTracker();
  const knowledgeGraph = new KnowledgeGraph();
  const semanticMap = new SemanticMap();

  atlas.start();

  const robot = atlas.robot("explorer-1", { name: "Atlas-Explorer" });

  // Define semantic regions of the exploration site
  semanticMap.addRegion({
    label: "Crater Rim",
    category: "terrain",
    polygon: [
      { x: 37.78, y: -122.44 }, { x: 37.78, y: -122.41 },
      { x: 37.76, y: -122.41 }, { x: 37.76, y: -122.44 },
    ],
    properties: { elevation: 120, risk: "moderate" },
    confidence: 0.9,
  });
  semanticMap.addRegion({
    label: "Ancient Streambed",
    category: "geological",
    polygon: [
      { x: 37.77, y: -122.43 }, { x: 37.77, y: -122.42 },
      { x: 37.76, y: -122.42 }, { x: 37.76, y: -122.43 },
    ],
    properties: { composition: "sedimentary", age: "3.5bya" },
    confidence: 0.85,
  });
  semanticMap.addRegion({
    label: "Mineral Deposit Zone",
    category: "resource",
    polygon: [
      { x: 37.775, y: -122.425 }, { x: 37.775, y: -122.415 },
      { x: 37.765, y: -122.415 }, { x: 37.765, y: -122.425 },
    ],
    properties: { minerals: ["hematite", "clay"], priority: "high" },
    confidence: 0.75,
  });

  console.log("=== ATLAS Robot Exploration Demo ===");
  console.log("Location: Unknown Terrain");
  console.log("Objective: Survey, map, and build world model\n");

  // Phase 1: Initial landing zone survey
  console.log("Phase 1 — Landing zone survey");
  await robot.navigateTo({ x: 37.770, y: -122.425, z: 0 });
  const scan0 = await robot.scan();
  console.log(`  Initial scan: ${scan0.objects.length} objects detected`);

  for (const obj of scan0.objects) {
    const node = knowledgeGraph.addNode({
      type: obj.label.toLowerCase().replace(/\s+/g, "_"),
      label: obj.label,
      properties: {
        confidence: obj.confidence,
        discoveredAt: Date.now(),
        position: obj.position,
      },
    });
    worldModel.addObject({
      id: node.id,
      type: obj.label.toLowerCase().replace(/\s+/g, "_"),
      label: obj.label,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z, timestamp: Date.now() },
      confidence: obj.confidence,
      lastSeen: Date.now(),
    });
    const cell = gridMap.worldToGrid(obj.position.x, obj.position.y);
    gridMap.markObstacle(cell.gridX, cell.gridY);
    obstacleTracker.addObstacle({
      type: "detected_object",
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      shape: "sphere",
      dangerLevel: obj.confidence > 0.7 ? 3 : 1,
      size: { width: 1, height: 1, depth: 1 },
    });
  }

  // Phase 2: Systematic spiral exploration pattern
  console.log("\nPhase 2 — Systematic terrain survey");
  const waypoints = [
    { x: 37.772, y: -122.422, z: 0 },
    { x: 37.774, y: -122.419, z: 0 },
    { x: 37.776, y: -122.422, z: 0 },
    { x: 37.776, y: -122.426, z: 0 },
    { x: 37.774, y: -122.429, z: 0 },
    { x: 37.771, y: -122.429, z: 0 },
    { x: 37.769, y: -122.426, z: 0 },
    { x: 37.769, y: -122.421, z: 0 },
  ];

  let totalObjectsFound = scan0.objects.length;
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    console.log(`\n  Waypoint ${i + 1}/${waypoints.length} — (${wp.x.toFixed(4)}, ${wp.y.toFixed(4)})`);
    await robot.navigateTo(wp);

    // Check which semantic regions we're in
    const regionsHere = semanticMap.containsPoint(wp.x, wp.y);
    if (regionsHere.length > 0) {
      console.log(`    Entering: ${regionsHere.map(r => r.label).join(", ")}`);
    }

    const scan = await robot.scan();
    totalObjectsFound += scan.objects.length;
    console.log(`    Found ${scan.objects.length} new objects (total: ${totalObjectsFound})`);

    for (const obj of scan.objects) {
      const existingNode = knowledgeGraph.findNodesByType(
        obj.label.toLowerCase().replace(/\s+/g, "_")
      );

      if (existingNode.length === 0) {
        const nodeId = knowledgeGraph.addNode({
          type: obj.label.toLowerCase().replace(/\s+/g, "_"),
          label: obj.label,
          properties: {
            confidence: obj.confidence,
            discoveredAt: Date.now(),
            position: obj.position,
            foundInRegion: regionsHere.map(r => r.label),
          },
        }).id;

        worldModel.addObject({
          id: nodeId,
          type: obj.label.toLowerCase().replace(/\s+/g, "_"),
          label: obj.label,
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z, timestamp: Date.now() },
          confidence: obj.confidence,
          lastSeen: Date.now(),
        });
      } else {
        // Link to existing knowledge
        const existing = existingNode[0];
        knowledgeGraph.addEdge(existing.id, knowledgeGraph.addNode({
          type: "sighting",
          label: `Sighting ${i}`,
          properties: { waypoint: i, position: wp, confidence: obj.confidence },
        }).id, {
          type: "observed_at",
          label: "observed at",
          properties: { timestamp: Date.now() },
          weight: obj.confidence,
        });
      }

      const cell = gridMap.worldToGrid(obj.position.x, obj.position.y);
      gridMap.markObstacle(cell.gridX, cell.gridY);
    }

    // Mark our path as free space
    const pathCell = gridMap.worldToGrid(wp.x, wp.y);
    gridMap.markFree(pathCell.gridX, pathCell.gridY);
  }

  // Phase 3: Mineral resource assessment
  console.log("\nPhase 3 — Resource assessment at mineral zone");
  const mineralZone = semanticMap.findRegionsByCategory("resource")[0];
  if (mineralZone) {
    const centroid = mineralZone.polygon.reduce(
      (acc, p) => ({ x: acc.x + p.x / mineralZone.polygon.length, y: acc.y + p.y / mineralZone.polygon.length }),
      { x: 0, y: 0 }
    );
    await robot.navigateTo({ x: centroid.x, y: centroid.y, z: 0 });
    const resourceScan = await robot.scan();
    console.log(`  Resource scan: ${resourceScan.objects.length} specimens found`);

    // Add the mineral zone as a knowledge graph node so we can link discoveries to it
    const zoneNodeId = knowledgeGraph.addNode({
      type: "resource_zone",
      label: mineralZone.label,
      properties: { centroid, minerals: mineralZone.properties.minerals },
    }).id;

    for (const obj of resourceScan.objects) {
      const nodeId = knowledgeGraph.addNode({
        type: obj.label.toLowerCase().replace(/\s+/g, "_"),
        label: obj.label,
        properties: {
          confidence: obj.confidence,
          discoveredAt: Date.now(),
          position: obj.position,
          category: "resource",
        },
      }).id;

      knowledgeGraph.addEdge(zoneNodeId, nodeId, {
        type: "contains",
        label: "contains",
        properties: { zone: mineralZone.label },
        weight: obj.confidence,
      });
    }
  }

  // Phase 4: Return to base
  console.log("\nPhase 4 — Return to base camp");
  await robot.navigateTo({ x: 37.770, y: -122.425, z: 0 });
  const finalScan = await robot.scan();
  console.log(`  Final verification scan: ${finalScan.objects.length} objects at base`);

  // Summary report
  const status = robot.getStatus();
  const allNodes = knowledgeGraph.getAllNodes();
  const allEdges = knowledgeGraph.getAllEdges();
  const allObjects = worldModel.getAllObjects();
  const allObstacles = obstacleTracker.getAllObstacles();
  const traversableCount = gridMap.getTraversableCells(0.5).length;
  const costMap = gridMap.generateCostMap();

  console.log("\n===========================================");
  console.log("  EXPLORATION MISSION COMPLETE");
  console.log("===========================================");
  console.log(`  Final position:     (${status.position.x.toFixed(4)}, ${status.position.y.toFixed(4)})`);
  console.log(`  Battery:            ${status.battery}%`);
  console.log(`  Mode:               ${status.mode}`);
  console.log(`  Objects catalogued: ${allObjects.length}`);
  console.log(`  Unique types:       ${allNodes.length}`);
  console.log(`  Knowledge edges:    ${allEdges.length}`);
  console.log(`  Obstacles tracked:  ${allObstacles.length}`);
  console.log(`  Traversable cells:  ${traversableCount}`);
  console.log(`  Grid map area:      ${gridMap.getMeta().width * gridMap.getMeta().resolution}m x ${gridMap.getMeta().height * gridMap.getMeta().resolution}m`);
  console.log(`  Semantic regions:   ${semanticMap.getAllRegions().length}`);
  console.log(`  ${semanticMap.getAllRegions().map(r => r.label).join(", ")}`);

  console.log("\n  Knowledge Graph — Discovered Entities:");
  const typeGroups = new Map<string, number>();
  for (const node of allNodes) {
    typeGroups.set(node.type, (typeGroups.get(node.type) || 0) + 1);
  }
  for (const [type, count] of typeGroups) {
    console.log(`    ${type}: ${count}`);
  }

  console.log("\n  World Model — Spatial Distribution:");
  console.log(`    Origin: (${gridMap.getMeta().origin.x}, ${gridMap.getMeta().origin.y})`);
  console.log(`    Resolution: ${gridMap.getMeta().resolution}m/cell`);

  console.log("\n  Obstacle Tracker — Danger Assessment:");
  const dangerous = allObstacles.filter(o => o.dangerLevel >= 3);
  console.log(`    High danger: ${dangerous.length}`);
  console.log(`    Low danger:  ${allObstacles.length - dangerous.length}`);

  console.log("\n===========================================");

  atlas.stop();
}

main().catch(console.error);
