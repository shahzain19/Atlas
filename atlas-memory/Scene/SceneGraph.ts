export { SceneNode } from "./SceneNode";
import { SceneNode } from "./SceneNode";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class SceneGraph {
  private nodes: Map<string, SceneNode> = new Map();

  addNode(node: Omit<SceneNode, "id" | "children">): SceneNode {
    const newNode: SceneNode = {
      ...node,
      id: uuidv4(),
      children: [],
    };
    this.nodes.set(newNode.id, newNode);
    if (newNode.parentId) {
      const parent = this.nodes.get(newNode.parentId);
      if (parent) {
        parent.children.push(newNode.id);
      }
    }
    return newNode;
  }

  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    const children = [...node.children];
    for (const childId of children) {
      this.removeNode(childId);
    }

    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        const idx = parent.children.indexOf(id);
        if (idx !== -1) parent.children.splice(idx, 1);
      }
    }

    this.nodes.delete(id);
  }

  reparentNode(nodeId: string, newParentId: string | undefined): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    if (node.parentId) {
      const oldParent = this.nodes.get(node.parentId);
      if (oldParent) {
        const idx = oldParent.children.indexOf(nodeId);
        if (idx !== -1) oldParent.children.splice(idx, 1);
      }
    }

    node.parentId = newParentId;

    if (newParentId) {
      const newParent = this.nodes.get(newParentId);
      if (!newParent) return false;
      newParent.children.push(nodeId);
    }

    return true;
  }

  getNode(id: string): SceneNode | undefined {
    return this.nodes.get(id);
  }

  getSubtree(id: string): SceneNode[] {
    const result: SceneNode[] = [];
    const traverse = (nodeId: string) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;
      result.push(node);
      for (const childId of node.children) {
        traverse(childId);
      }
    };
    traverse(id);
    return result;
  }

  getPathToRoot(id: string): SceneNode[] {
    const path: SceneNode[] = [];
    let current = this.nodes.get(id);
    while (current) {
      path.push(current);
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return path;
  }

  findNodesByType(type: string): SceneNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  findNodesByLabel(label: string): SceneNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.label === label);
  }

  getRootNodes(): SceneNode[] {
    return Array.from(this.nodes.values()).filter((n) => !n.parentId);
  }

  getDepth(id: string): number {
    let depth = 0;
    let current = this.nodes.get(id);
    while (current && current.parentId) {
      depth++;
      current = this.nodes.get(current.parentId);
    }
    return current ? depth : -1;
  }

  getAllNodes(): SceneNode[] {
    return Array.from(this.nodes.values());
  }

  serialize(): string {
    return JSON.stringify(this.getAllNodes());
  }

  deserialize(data: string): void {
    this.nodes.clear();
    const nodes: SceneNode[] = JSON.parse(data);
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
  }
}
