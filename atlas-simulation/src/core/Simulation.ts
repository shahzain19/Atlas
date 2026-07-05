import { SimulationConfig, DEFAULT_CONFIG } from './SimulationConfig';
import { SimulationEvents } from './SimulationEvents';
import { SceneManager } from '../scene/SceneManager';
import { Environment } from '../scene/Environment';
import { CameraController } from '../scene/CameraController';
import { Robot } from '../entities/Robot';
import { RobotController } from '../entities/RobotController';
import { LidarVisualizer } from '../sensors/LidarVisualizer';
import { CameraVisualizer } from '../sensors/CameraVisualizer';
import { RadarVisualizer } from '../sensors/RadarVisualizer';
import { GPSTrail } from '../sensors/GPSTrail';
import { Terrain } from '../environment/Terrain';
import { Obstacles } from '../environment/Obstacles';
import { Waypoints } from '../environment/Waypoints';
import { HUD } from '../hud/HUD';
import { MiniMap } from '../hud/MiniMap';
import { TelemetryPanel } from '../hud/TelemetryPanel';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { CollisionDetector } from '../physics/CollisionDetector';

export class Simulation {
  public config: SimulationConfig;
  public events: SimulationEvents;
  public sceneManager: SceneManager;
  public environment: Environment;
  public cameraController: CameraController;
  public robot: Robot;
  public robotController: RobotController;
  public physics: PhysicsEngine;
  public collision: CollisionDetector;
  public lidar: LidarVisualizer;
  public cameraViz: CameraVisualizer;
  public radar: RadarVisualizer;
  public trail: GPSTrail;
  public terrain: Terrain;
  public obstacles: Obstacles;
  public waypoints: Waypoints;
  public hud: HUD;
  public miniMap: MiniMap;
  public telemetry: TelemetryPanel;

  private lastTime: number = 0;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = new SimulationEvents();

    this.sceneManager = new SceneManager();
    this.environment = new Environment(this.sceneManager.scene);
    this.cameraController = new CameraController(this.sceneManager.camera, this.sceneManager.renderer);

    this.robot = new Robot();
    this.robot.position.set(0, 1.5, 0);
    this.sceneManager.scene.add(this.robot.mesh);

    this.robotController = new RobotController();

    this.physics = new PhysicsEngine(this.config);
    this.collision = new CollisionDetector();

    this.lidar = new LidarVisualizer(this.config);
    this.sceneManager.scene.add(this.lidar.group);

    this.cameraViz = new CameraVisualizer();
    this.sceneManager.scene.add(this.cameraViz.group);

    this.radar = new RadarVisualizer(this.config);
    this.sceneManager.scene.add(this.radar.group);

    this.trail = new GPSTrail(this.config.trailLength);
    this.sceneManager.scene.add(this.trail.group);

    this.terrain = new Terrain(60, 80);
    this.sceneManager.scene.add(this.terrain.group);

    this.obstacles = new Obstacles(this.config);
    this.sceneManager.scene.add(this.obstacles.group);

    this.waypoints = new Waypoints(this.config);
    this.sceneManager.scene.add(this.waypoints.group);

    this.hud = new HUD();
    this.miniMap = new MiniMap();
    this.telemetry = new TelemetryPanel();

    this.events.on('waypoint-reached', (idx: number) => {
      console.log(`Waypoint ${idx + 1} reached!`);
    });
    this.events.on('all-waypoints-reached', () => {
      console.log('All waypoints completed!');
    });

    this.lastTime = performance.now();
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(now: number): void {
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    dt = Math.min(dt, 0.05);

    if (!this.config.paused) {
      dt *= this.config.speed;
      this.update(dt);
    }

    this.sceneManager.render();
    this.hud.updateFps(now / 1000);

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number): void {
    this.robotController.update(this.robot, dt);
    this.physics.update(this.robot, dt);

    const roboPos = this.robot.position;
    const obstacleColliders = this.obstacles.obstacles.map(o => ({
      position: o.mesh.position,
      radius: o.radius,
      halfExtents: o.halfExtents,
    }));
    const robotCollider = {
      position: roboPos,
      radius: 0.5,
    };

    for (const obs of obstacleColliders) {
      this.collision.resolveSphereSphere(robotCollider, obs);
    }

    this.robot.position.copy(robotCollider.position);

    this.robot.update(dt);

    this.lidar.update(roboPos, this.robot.yaw, this.robot.pitch);
    this.cameraViz.update(roboPos, this.robot.yaw, this.robot.pitch);
    this.radar.update(roboPos, this.robot.yaw, this.robot.pitch);
    this.trail.update(roboPos, this.robot.yaw, this.robot.pitch);

    this.waypoints.checkProgress(roboPos);

    this.cameraController.followRobot(this.robot);

    this.hud.updateStatus(
      roboPos.x, roboPos.z,
      this.robot.speed,
      this.robot.battery,
      this.robot.altitude
    );
    this.miniMap.update(
      roboPos,
      this.robot.yaw,
      this.obstacles.obstacles,
      this.waypoints.waypoints
    );
    this.telemetry.update(
      this.robot.speed,
      this.robot.altitude,
      this.robot.battery
    );
  }

  setSpeed(speed: number): void {
    this.config.speed = speed;
  }

  togglePause(): void {
    this.config.paused = !this.config.paused;
  }

  dispose(): void {
    this.robotController.dispose();
    this.robot.dispose();
    this.lidar.dispose();
    this.cameraViz.dispose();
    this.radar.dispose();
    this.trail.dispose();
    this.terrain.dispose();
    this.obstacles.dispose();
    this.waypoints.dispose();
    this.hud.dispose();
    this.miniMap.dispose();
    this.telemetry.dispose();
    this.sceneManager.dispose();
  }
}
