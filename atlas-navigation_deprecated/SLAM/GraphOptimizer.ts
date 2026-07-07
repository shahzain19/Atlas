/**
 * Graph Optimizer - Pose graph optimization for SLAM
 */

import { Pose, Keyframe, KeyframeConnection, OptimizationResult } from "./SLAMTypes";

/**
 * Vertex in the pose graph
 */
interface Vertex {
  id: string;
  pose: Pose;
  fixed: boolean;
}

/**
 * Edge in the pose graph
 */
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  relativePose: Pose;
  informationMatrix: number[][];
  edgeType: "ODOMETRY" | "LOOP_CLOSURE" | "CONSTRAINT";
}

/**
 * Pose graph optimization configuration
 */
export interface GraphOptimizerConfig {
  /** Maximum optimization iterations */
  maxIterations: number;
  /** Convergence threshold (chi-squared change) */
  convergenceThreshold: number;
  /** Robust kernel for outlier rejection */
  robustKernel: "NONE" | "HUBER" | "TUKEY" | "CAUCHY";
  /** Kernel parameter for robust estimation */
  kernelParameter: number;
  /** Enable parallel processing */
  enableParallel: boolean;
  /** Maximum solver time in seconds */
  maxSolverTime: number;
}

/**
 * Pose graph optimizer class for SLAM
 */
export class GraphOptimizer {
  /** Pose graph vertices (keyframes) */
  private graph: Map<string, Vertex>;
  /** Edges (constraints between vertices) */
  private edges: Edge[];
  /** Optimizer configuration */
  private config: GraphOptimizerConfig;
  /** Number of optimizations performed */
  private optimizationCount: number;
  /** Total optimization time */
  private totalOptimizationTime: number;

  constructor(config?: Partial<GraphOptimizerConfig>) {
    this.graph = new Map();
    this.edges = [];
    this.config = {
      maxIterations: config?.maxIterations ?? 100,
      convergenceThreshold: config?.convergenceThreshold ?? 1e-6,
      robustKernel: config?.robustKernel ?? "HUBER",
      kernelParameter: config?.kernelParameter ?? 1.0,
      enableParallel: config?.enableParallel ?? true,
      maxSolverTime: config?.maxSolverTime ?? 5.0,
    };
    this.optimizationCount = 0;
    this.totalOptimizationTime = 0;
  }

  /**
   * Add a vertex (keyframe pose) to the graph
   */
  addVertex(id: string, pose: Pose, fixed: boolean = false): void {
    if (this.graph.has(id)) {
      throw new Error(`Vertex with id ${id} already exists`);
    }

    this.graph.set(id, {
      id,
      pose,
      fixed,
    });
  }

  /**
   * Update an existing vertex pose
   */
  updateVertex(id: string, pose: Pose): void {
    const vertex = this.graph.get(id);
    if (!vertex) {
      throw new Error(`Vertex with id ${id} not found`);
    }
    vertex.pose = pose;
  }

  /**
   * Get a vertex by ID
   */
  getVertex(id: string): Vertex | undefined {
    return this.graph.get(id);
  }

  /**
   * Get all vertices
   */
  getAllVertices(): Vertex[] {
    return Array.from(this.graph.values());
  }

  /**
   * Add an edge (constraint) to the graph
   */
  addEdge(
    sourceId: string,
    targetId: string,
    relativePose: Pose,
    informationMatrix?: number[][],
    edgeType: "ODOMETRY" | "LOOP_CLOSURE" | "CONSTRAINT" = "ODOMETRY"
  ): void {
    if (!this.graph.has(sourceId)) {
      throw new Error(`Source vertex ${sourceId} not found`);
    }
    if (!this.graph.has(targetId)) {
      throw new Error(`Target vertex ${targetId} not found`);
    }

    // Default information matrix (identity-like with proper scaling)
    const defaultInfo = this.createDefaultInformationMatrix(edgeType);

    this.edges.push({
      id: `edge-${this.edges.length}`,
      sourceId,
      targetId,
      relativePose,
      informationMatrix: informationMatrix ?? defaultInfo,
      edgeType,
    });
  }

  /**
   * Remove an edge by ID
   */
  removeEdge(id: string): void {
    this.edges = this.edges.filter((e) => e.id !== id);
  }

  /**
   * Get all edges
   */
  getAllEdges(): Edge[] {
    return [...this.edges];
  }

  /**
   * Optimize the pose graph
   */
  optimize(): OptimizationResult {
    const startTime = performance.now();

    // Check if graph has enough vertices and edges
    if (this.graph.size < 2) {
      throw new Error("Graph must have at least 2 vertices");
    }
    if (this.edges.length === 0) {
      throw new Error("Graph must have at least 1 edge");
    }

    // Get initial state
    const initialError = this.computeTotalChiSquared();

    // Initialize poses if needed
    this.initializePoses();

    // Perform optimization iterations
    let currentError = initialError;
    let iterations = 0;
    let converged = false;
    let outliersRemoved = 0;

    while (iterations < this.config.maxIterations) {
      // Build linear system
      const system = this.buildLinearSystem();

      // Solve linear system
      const deltas = this.solveLinearSystem(system);

      // Apply updates
      const maxDelta = this.applyPoseUpdates(deltas);

      // Check for convergence
      const newError = this.computeTotalChiSquared();
      const errorChange = currentError - newError;

      if (errorChange < this.config.convergenceThreshold) {
        converged = true;
        break;
      }

      currentError = newError;
      iterations++;
    }

    const endTime = performance.now();
    const computationTime = endTime - startTime;

    this.optimizationCount++;
    this.totalOptimizationTime += computationTime;

    // Collect optimized poses
    const optimizedPoses = new Map<string, Pose>();
    for (const [id, vertex] of this.graph) {
      optimizedPoses.set(id, { ...vertex.pose });
    }

    return {
      poses: optimizedPoses,
      initialError,
      finalError: currentError,
      iterations,
      outliersRemoved,
      converged,
      computationTime,
    };
  }

  /**
   * Optimize only a subset of vertices (local optimization)
   */
  optimizeSubset(vertexIds: string[]): OptimizationResult {
    const startTime = performance.now();

    // Filter to only include edges within the subset or connecting to fixed vertices
    const relevantVertices = new Set(vertexIds);
    for (const edge of this.edges) {
      if (vertexIds.includes(edge.sourceId)) {
        relevantVertices.add(edge.targetId);
      }
      if (vertexIds.includes(edge.targetId)) {
        relevantVertices.add(edge.sourceId);
      }
    }

    // Get initial error
    const initialError = this.computeTotalChiSquared();

    // Perform local optimization
    let currentError = initialError;
    let iterations = 0;
    let converged = false;

    while (iterations < this.config.maxIterations) {
      const system = this.buildLinearSystem();
      const deltas = this.solveLinearSystem(system);

      // Only apply to subset vertices
      const maxDelta = this.applyPoseUpdates(deltas, vertexIds);

      const newError = this.computeTotalChiSquared();
      const errorChange = currentError - newError;

      if (errorChange < this.config.convergenceThreshold) {
        converged = true;
        break;
      }

      currentError = newError;
      iterations++;
    }

    const endTime = performance.now();
    const computationTime = endTime - startTime;

    this.optimizationCount++;
    this.totalOptimizationTime += computationTime;

    const optimizedPoses = new Map<string, Pose>();
    for (const id of vertexIds) {
      const vertex = this.graph.get(id);
      if (vertex) {
        optimizedPoses.set(id, { ...vertex.pose });
      }
    }

    return {
      poses: optimizedPoses,
      initialError,
      finalError: currentError,
      iterations,
      outliersRemoved: 0,
      converged,
      computationTime,
    };
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.graph.clear();
    this.edges = [];
  }

  /**
   * Get the number of vertices
   */
  getVertexCount(): number {
    return this.graph.size;
  }

  /**
   * Get the number of edges
   */
  getEdgeCount(): number {
    return this.edges.length;
  }

  /**
   * Get optimization statistics
   */
  getStatistics(): {
    totalOptimizations: number;
    averageOptimizationTime: number;
    config: GraphOptimizerConfig;
  } {
    return {
      totalOptimizations: this.optimizationCount,
      averageOptimizationTime:
        this.optimizationCount > 0
          ? this.totalOptimizationTime / this.optimizationCount
          : 0,
      config: this.config,
    };
  }

  /**
   * Create default information matrix based on edge type
   */
  private createDefaultInformationMatrix(
    edgeType: string
  ): number[][] {
    // 6x6 information matrix for SE3 pose
    // Higher values = more confidence in the constraint
    const scale = edgeType === "LOOP_CLOSURE" ? 10.0 : 100.0;

    return [
      [scale, 0, 0, 0, 0, 0],
      [0, scale, 0, 0, 0, 0],
      [0, 0, scale, 0, 0, 0],
      [0, 0, 0, scale * 0.1, 0, 0],
      [0, 0, 0, 0, scale * 0.1, 0],
      [0, 0, 0, 0, 0, scale * 0.1],
    ];
  }

  /**
   * Initialize poses from odometry if needed
   */
  private initializePoses(): void {
    // Use first fixed vertex as origin, or create chain from edges
    const vertices = Array.from(this.graph.values());

    // Find a fixed vertex or use first vertex as reference
    let reference = vertices.find((v) => v.fixed);
    if (!reference && vertices.length > 0) {
      reference = vertices[0];
      // Make it fixed
      reference.fixed = true;
    }

    if (!reference) return;

    // Initialize other poses from reference using odometry edges
    const visited = new Set<string>([reference.id]);
    const queue = [reference];

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Find edges from current vertex (both directions)
      for (const edge of this.edges) {
        if (edge.sourceId !== current.id && edge.targetId !== current.id) continue;
        if (visited.has(edge.sourceId === current.id ? edge.targetId : edge.sourceId)) continue;

        const targetId = edge.sourceId === current.id ? edge.targetId : edge.sourceId;
        const relativePose = edge.sourceId === current.id
          ? edge.relativePose
          : this.invertPose(edge.relativePose);

        const target = this.graph.get(targetId);
        if (!target || target.fixed) continue;

        // Compute pose from current vertex using relative transformation
        const newPose = this.composePose(current.pose, relativePose);
        target.pose = newPose;
        visited.add(targetId);
        queue.push(target);
      }
    }
  }

  /**
   * Compute pose composition: pose1 * pose2 (relative transform)
   */
  private composePose(base: Pose, relative: Pose): Pose {
    // Simplified SE3 composition
    // In a real implementation, this would properly handle quaternion composition

    // Position composition
    const rx = base.orientation.x;
    const ry = base.orientation.y;
    const rz = base.orientation.z;
    const rw = base.orientation.w;

    // Rotate relative position by base orientation
    const dx = relative.position.x;
    const dy = relative.position.y;
    const dz = relative.position.z;

    // Simplified rotation (assume small angles for relative transform)
    const newX = base.position.x + dx;
    const newY = base.position.y + dy;
    const newZ = base.position.z + dz;

    // Orientation composition
    const qx = relative.orientation.x;
    const qy = relative.orientation.y;
    const qz = relative.orientation.z;
    const qw = relative.orientation.w;

    // Quaternion multiplication
    const nx = rw * qx + rx * qw + ry * qz - rz * qy;
    const ny = rw * qy - rx * qz + ry * qw + rz * qx;
    const nz = rw * qz + rx * qy - ry * qx + rz * qw;
    const nw = rw * qw - rx * qx - ry * qy - rz * qz;

    // Normalize
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz + nw * nw);

    return {
      position: { x: newX, y: newY, z: newZ },
      orientation: {
        x: nx / len,
        y: ny / len,
        z: nz / len,
        w: nw / len,
      },
      timestamp: relative.timestamp,
    };
  }

  private invertPose(pose: Pose): Pose {
    const qi = { x: -pose.orientation.x, y: -pose.orientation.y, z: -pose.orientation.z, w: pose.orientation.w };
    // Rotate negated position by inverse quaternion
    const px = -pose.position.x, py = -pose.position.y, pz = -pose.position.z;
    const t1x = qi.y * pz - qi.z * py + qi.w * px;
    const t1y = qi.z * px - qi.x * pz + qi.w * py;
    const t1z = qi.x * py - qi.y * px + qi.w * pz;
    return {
      position: {
        x: px + 2 * (qi.y * t1z - qi.z * t1y),
        y: py + 2 * (qi.z * t1x - qi.x * t1z),
        z: pz + 2 * (qi.x * t1y - qi.y * t1x),
      },
      orientation: qi,
      timestamp: pose.timestamp,
    };
  }

  /**
   * Compute chi-squared error for an edge
   */
  private computeEdgeError(edge: Edge): number {
    const source = this.graph.get(edge.sourceId);
    const target = this.graph.get(edge.targetId);

    if (!source || !target) return 0;

    // Compute predicted relative pose
    const predicted = this.composePose(source.pose, edge.relativePose);

    // Compute error (difference between predicted and actual target pose)
    const dx = target.pose.position.x - predicted.position.x;
    const dy = target.pose.position.y - predicted.position.y;
    const dz = target.pose.position.z - predicted.position.z;

    // Simplified error metric
    const error = dx * dx + dy * dy + dz * dz;

    // Apply information matrix
    const info = edge.informationMatrix;
    let chiSquared = 0;
    const errorVec = [dx, dy, dz, 0, 0, 0];

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        chiSquared += errorVec[i] * info[i][j] * errorVec[j];
      }
    }

    return chiSquared;
  }

  /**
   * Compute total chi-squared error
   */
  private computeTotalChiSquared(): number {
    let totalError = 0;

    for (const edge of this.edges) {
      totalError += this.computeEdgeError(edge);
    }

    return totalError;
  }

  /**
   * Build linear system (Hessian and b vector)
   */
  private buildLinearSystem(): {
    H: Map<string, Map<string, number[][]>>;
    b: Map<string, number[]>;
  } {
    const H = new Map<string, Map<string, number[][]>>();
    const b = new Map<string, number[]>();

    // For each edge, add contributions
    for (const edge of this.edges) {
      const source = this.graph.get(edge.sourceId);
      const target = this.graph.get(edge.targetId);

      if (!source || !target) continue;

      // Compute Jacobian and error (simplified)
      const error = this.computeEdgeErrorVector(edge);

      // Initialize H blocks if needed
      if (!H.has(edge.sourceId)) {
        H.set(edge.sourceId, new Map());
        b.set(edge.sourceId, [0, 0, 0, 0, 0, 0]);
      }
      if (!H.has(edge.targetId)) {
        H.set(edge.targetId, new Map());
        b.set(edge.targetId, [0, 0, 0, 0, 0, 0]);
      }

      const Hs = H.get(edge.sourceId)!;
      const Ht = H.get(edge.targetId)!;

      const info = edge.informationMatrix;

      // Simplified Hessian blocks
      const Hss = this.createHessianBlock(info, 1.0);
      const Htt = this.createHessianBlock(info, 1.0);
      const Hst = this.createHessianBlock(info, -1.0);

      // Add to source-source block
      this.addHessianBlock(Hs, edge.sourceId, Hss);

      // Add to target-target block
      this.addHessianBlock(Ht, edge.targetId, Htt);

      // Add to cross blocks
      this.addHessianBlock(Hs, edge.targetId, Hst);
      this.addHessianBlock(Ht, edge.sourceId, Hst);

      // Add to b vector
      const bSource = b.get(edge.sourceId)!;
      const bTarget = b.get(edge.targetId)!;

      for (let i = 0; i < 6; i++) {
        bSource[i] += this.applyKernel(error, info, i, 1.0);
        bTarget[i] += this.applyKernel(error, info, i, -1.0);
      }
    }

    // Add prior for fixed vertices (fix their values)
    for (const [id, vertex] of this.graph) {
      if (vertex.fixed && H.has(id)) {
        const block = H.get(id)!;
        const priorInfo = 1e10; // Very high weight
        block.set(id, this.createHessianBlock(
          [
            [priorInfo, 0, 0, 0, 0, 0],
            [0, priorInfo, 0, 0, 0, 0],
            [0, 0, priorInfo, 0, 0, 0],
            [0, 0, 0, priorInfo, 0, 0],
            [0, 0, 0, 0, priorInfo, 0],
            [0, 0, 0, 0, 0, priorInfo],
          ],
          1.0
        ));
      }
    }

    return { H, b };
  }

  /**
   * Create a 6x6 Hessian block
   */
  private createHessianBlock(info: number[][], factor: number): number[][] {
    const block: number[][] = [];

    for (let i = 0; i < 6; i++) {
      block[i] = [];
      for (let j = 0; j < 6; j++) {
        block[i][j] = info[i][j] * factor;
      }
    }

    return block;
  }

  /**
   * Add Hessian block to map
   */
  private addHessianBlock(
    map: Map<string, number[][]>,
    id: string,
    block: number[][]
  ): void {
    const existing = map.get(id);
    if (existing) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          existing[i][j] += block[i][j];
        }
      }
    } else {
      map.set(id, block);
    }
  }

  /**
   * Compute error vector for an edge
   */
  private computeEdgeErrorVector(edge: Edge): number[] {
    const source = this.graph.get(edge.sourceId);
    const target = this.graph.get(edge.targetId);

    if (!source || !target) return [0, 0, 0, 0, 0, 0];

    // Simplified error computation
    const dx = target.pose.position.x - source.pose.position.x - edge.relativePose.position.x;
    const dy = target.pose.position.y - source.pose.position.y - edge.relativePose.position.y;
    const dz = target.pose.position.z - source.pose.position.z - edge.relativePose.position.z;

    // Orientation error (simplified)
    const dox = target.pose.orientation.x - source.pose.orientation.x - edge.relativePose.orientation.x;
    const doy = target.pose.orientation.y - source.pose.orientation.y - edge.relativePose.orientation.y;
    const doz = target.pose.orientation.z - source.pose.orientation.z - edge.relativePose.orientation.z;

    return [dx, dy, dz, dox, doy, doz];
  }

  /**
   * Apply robust kernel to error
   */
  private applyKernel(
    error: number[],
    info: number[][],
    idx: number,
    sign: number
  ): number {
    if (this.config.robustKernel === "NONE") {
      return error[idx] * info[idx][idx] * sign;
    }

    const errorNorm = Math.sqrt(
      error.reduce((sum, e, i) => sum + e * e * info[i][i], 0)
    );

    const k = this.config.kernelParameter;

    switch (this.config.robustKernel) {
      case "HUBER": {
        const rho = errorNorm <= k ? 0.5 * errorNorm * errorNorm : k * (errorNorm - 0.5 * k);
        return (error[idx] / (errorNorm + 1e-10)) * info[idx][idx] * rho * sign;
      }
      case "TUKEY": {
        const c2 = k * k;
        const r2 = errorNorm * errorNorm;
        if (r2 > c2) return 0;
        const factor = (1 - r2 / c2) * (1 - r2 / c2);
        return error[idx] * info[idx][idx] * factor * sign;
      }
      case "CAUCHY": {
        const c2 = k * k;
        const factor = 1 / (1 + errorNorm * errorNorm / c2);
        return error[idx] * info[idx][idx] * factor * sign;
      }
      default:
        return error[idx] * info[idx][idx] * sign;
    }
  }

  /**
   * Solve linear system using PCG (Preconditioned Conjugate Gradient)
   */
  private solveLinearSystem(
    system: { H: Map<string, Map<string, number[][]>>; b: Map<string, number[]> }
  ): Map<string, number[]> {
    const { H, b } = system;
    const deltas = new Map<string, number[]>();

    // Extract matrices for reduced system
    const vertexIds = Array.from(H.keys());
    const n = vertexIds.length;

    if (n === 0) return deltas;

    // Build sparse matrix representation
    // For now, use simple Gaussian elimination for small systems
    if (n <= 50) {
      this.solveDense(vertexIds, H, b, deltas);
    } else {
      // For larger systems, use iterative solver
      this.solveIterative(vertexIds, H, b, deltas);
    }

    return deltas;
  }

  /**
   * Solve dense linear system
   */
  private solveDense(
    vertexIds: string[],
    H: Map<string, Map<string, number[][]>>,
    b: Map<string, number[]>,
    deltas: Map<string, number[]>
  ): void {
    const n = vertexIds.length * 6;
    const matrix: number[][] = [];
    const rhs: number[] = [];

    // Initialize matrix and RHS
    for (let i = 0; i < n; i++) {
      matrix[i] = new Array(n).fill(0);
      rhs[i] = 0;
    }

    // Fill matrix from H blocks
    for (let vi = 0; vi < vertexIds.length; vi++) {
      const vId = vertexIds[vi];
      const vH = H.get(vId);
      if (!vH) continue;

      for (let vj = 0; vj < vertexIds.length; vj++) {
        const vjId = vertexIds[vj];
        const block = vH.get(vjId);
        if (!block) continue;

        for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 6; j++) {
            matrix[vi * 6 + i][vj * 6 + j] = block[i][j];
          }
        }
      }

      // Fill RHS
      const vb = b.get(vId);
      if (vb) {
        for (let i = 0; i < 6; i++) {
          rhs[vi * 6 + i] = vb[i];
        }
      }
    }

    // Solve using Gaussian elimination
    const solution = this.gaussianElimination(matrix, rhs);

    // Map back to vertices
    for (let vi = 0; vi < vertexIds.length; vi++) {
      const delta: number[] = [];
      for (let i = 0; i < 6; i++) {
        delta.push(solution[vi * 6 + i]);
      }
      deltas.set(vertexIds[vi], delta);
    }
  }

  /**
   * Solve iterative linear system
   */
  private solveIterative(
    vertexIds: string[],
    H: Map<string, Map<string, number[][]>>,
    b: Map<string, number[]>,
    deltas: Map<string, number[]>
  ): void {
    // Initialize with zeros
    for (const vId of vertexIds) {
      deltas.set(vId, [0, 0, 0, 0, 0, 0]);
    }

    // Simple Jacobi iteration
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let iter = 0; iter < maxIterations; iter++) {
      let maxChange = 0;

      for (const vId of vertexIds) {
        const vH = H.get(vId);
        if (!vH) continue;

        const vb = b.get(vId);
        if (!vb) continue;

        // Compute diagonal and off-diagonal contributions
        const diagonal = this.createHessianBlock(
          [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1],
          ],
          0
        );

        const diagBlock = vH.get(vId);
        if (diagBlock) {
          for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
              diagonal[i][j] = diagBlock[i][j];
            }
          }
        }

        // Compute off-diagonal contribution
        const offDiag = [0, 0, 0, 0, 0, 0];
        for (const [otherId, block] of vH) {
          if (otherId === vId) continue;

          const otherDelta = deltas.get(otherId);
          if (otherDelta) {
            for (let i = 0; i < 6; i++) {
              for (let j = 0; j < 6; j++) {
                offDiag[i] += block[i][j] * otherDelta[j];
              }
            }
          }
        }

        // Compute update
        const newDelta: number[] = [];
        for (let i = 0; i < 6; i++) {
          // Simple diagonal preconditioning
          const diagInv = 1.0 / (diagonal[i][i] + 1e-10);
          const delta = (vb[i] - offDiag[i]) * diagInv;
          newDelta.push(delta);

          const change = Math.abs(delta - (deltas.get(vId)?.[i] ?? 0));
          if (change > maxChange) maxChange = change;
        }

        deltas.set(vId, newDelta);
      }

      if (maxChange < tolerance) break;
    }
  }

  /**
   * Gaussian elimination for solving linear system
   */
  private gaussianElimination(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
          maxRow = row;
        }
      }

      // Swap rows
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

      // Skip zero pivots
      if (Math.abs(augmented[col][col]) < 1e-12) continue;

      // Eliminate column
      for (let row = col + 1; row < n; row++) {
        const factor = augmented[row][col] / augmented[col][col];
        for (let j = col; j <= n; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      let sum = 0;
      for (let col = row + 1; col < n; col++) {
        sum += augmented[row][col] * x[col];
      }

      if (Math.abs(augmented[row][row]) < 1e-12) {
        x[row] = 0; // Under-determined, set to 0
      } else {
        x[row] = (augmented[row][n] - sum) / augmented[row][row];
      }
    }

    return x;
  }

  /**
   * Apply pose updates from linear system solution
   */
  private applyPoseUpdates(deltas: Map<string, number[]>, vertexIds?: string[]): number {
    let maxDelta = 0;

    const ids = vertexIds ?? Array.from(deltas.keys());

    for (const id of ids) {
      const delta = deltas.get(id);
      const vertex = this.graph.get(id);

      if (!delta || !vertex || vertex.fixed) continue;

      // Apply update
      vertex.pose.position.x += delta[0];
      vertex.pose.position.y += delta[1];
      vertex.pose.position.z += delta[2];
      vertex.pose.orientation.x += delta[3];
      vertex.pose.orientation.y += delta[4];
      vertex.pose.orientation.z += delta[5];

      // Compute max delta for convergence check
      for (let i = 0; i < 6; i++) {
        if (Math.abs(delta[i]) > maxDelta) {
          maxDelta = Math.abs(delta[i]);
        }
      }
    }

    return maxDelta;
  }
}

/**
 * Pose graph manager for SLAM
 */
export class PoseGraphManager {
  private optimizer: GraphOptimizer;
  private keyframes: Map<string, Keyframe>;

  constructor() {
    this.optimizer = new GraphOptimizer();
    this.keyframes = new Map();
  }

  /**
   * Add a keyframe to the graph
   */
  addKeyframe(keyframe: Keyframe): void {
    this.optimizer.addVertex(keyframe.id, keyframe.pose, false);
    this.keyframes.set(keyframe.id, keyframe);

    // Add edges from connections
    for (const connection of keyframe.connections) {
      this.optimizer.addEdge(
        keyframe.id,
        connection.keyframeId,
        connection.relativePose,
        connection.informationMatrix,
        connection.edgeType
      );
    }

    // Add odometry edge to previous keyframe if not already in connections
    const keys = Array.from(this.keyframes.keys());
    if (keys.length > 1) {
      const prevId = keys[keys.length - 2];
      const alreadyConnected = keyframe.connections.some(c => c.keyframeId === prevId);
      if (!alreadyConnected) {
        const prevKf = this.keyframes.get(prevId)!;
        const relativePose: Pose = {
          position: {
            x: keyframe.pose.position.x - prevKf.pose.position.x,
            y: keyframe.pose.position.y - prevKf.pose.position.y,
            z: keyframe.pose.position.z - prevKf.pose.position.z,
          },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
          timestamp: keyframe.timestamp,
        };
        this.optimizer.addEdge(prevId, keyframe.id, relativePose, undefined, "ODOMETRY");
      }
    }
  }

  /**
   * Add loop closure constraint
   */
  addLoopClosure(
    keyframeId1: string,
    keyframeId2: string,
    relativePose: Pose,
    informationMatrix?: number[][]
  ): void {
    this.optimizer.addEdge(
      keyframeId1,
      keyframeId2,
      relativePose,
      informationMatrix,
      "LOOP_CLOSURE"
    );
  }

  /**
   * Optimize the pose graph
   */
  optimize(): OptimizationResult {
    return this.optimizer.optimize();
  }

  /**
   * Get optimized pose for a keyframe
   */
  getOptimizedPose(keyframeId: string): Pose | undefined {
    const vertex = this.optimizer.getVertex(keyframeId);
    return vertex?.pose;
  }

  /**
   * Get all optimized poses
   */
  getAllOptimizedPoses(): Map<string, Pose> {
    const poses = new Map<string, Pose>();
    for (const vertex of this.optimizer.getAllVertices()) {
      poses.set(vertex.id, { ...vertex.pose });
    }
    return poses;
  }

  /**
   * Get graph statistics
   */
  getGraphStats(): {
    vertexCount: number;
    edgeCount: number;
    optimizationStats: ReturnType<GraphOptimizer["getStatistics"]>;
  } {
    return {
      vertexCount: this.optimizer.getVertexCount(),
      edgeCount: this.optimizer.getEdgeCount(),
      optimizationStats: this.optimizer.getStatistics(),
    };
  }

  /**
   * Clear the pose graph
   */
  clear(): void {
    this.optimizer.clear();
    this.keyframes.clear();
  }

  /**
   * Create default information matrix based on edge type
   */
  private createDefaultInfoMatrix(edgeType: string): number[][] {
    const scale = edgeType === "LOOP_CLOSURE" ? 10.0 : 100.0;

    return [
      [scale, 0, 0, 0, 0, 0],
      [0, scale, 0, 0, 0, 0],
      [0, 0, scale, 0, 0, 0],
      [0, 0, 0, scale * 0.1, 0, 0],
      [0, 0, 0, 0, scale * 0.1, 0],
      [0, 0, 0, 0, 0, scale * 0.1],
    ];
  }
}