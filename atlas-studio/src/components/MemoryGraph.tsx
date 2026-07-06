import { useEffect, useRef, useState, useCallback } from 'react'
import { StudioMemoryStats } from '../types/protocol'

interface GraphNode {
  id: number
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  type: string
}

interface GraphEdge {
  source: number
  target: number
}

interface Props {
  memory: StudioMemoryStats
}

const TYPES = ['concept', 'entity', 'action']
const TYPE_COLORS: Record<string, string> = {
  concept: '#58a6ff',
  entity: '#3fb950',
  action: '#d29922',
}
const LABELS = [
  'Atlas',
  'Memory',
  'Agent',
  'Task',
  'Plan',
  'Learn',
  'World',
  'State',
  'Goal',
  'Action',
  'Reason',
  'Observe',
]

function generateGraph(nodeCount: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const count = Math.max(6, Math.min(nodeCount || 8, 12))
  const nodes: GraphNode[] = LABELS.slice(0, count).map((label, i) => ({
    id: i,
    label,
    x: Math.random() * 600 + 50,
    y: Math.random() * 350 + 50,
    vx: 0,
    vy: 0,
    radius: 18 + Math.random() * 14,
    type: TYPES[i % TYPES.length],
  }))
  const edges: GraphEdge[] = []
  const pairSet = new Set<string>()
  for (let i = 0; i < nodes.length; i++) {
    const edgeCount = 1 + Math.floor(Math.random() * 2)
    for (let j = 0; j < edgeCount; j++) {
      const target = Math.floor(Math.random() * nodes.length)
      if (target !== i) {
        const key = `${Math.min(i, target)}-${Math.max(i, target)}`
        if (!pairSet.has(key)) {
          pairSet.add(key)
          edges.push({ source: i, target })
        }
      }
    }
  }
  return { nodes, edges }
}

export default function MemoryGraph({ memory }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedRef = useRef<number | null>(null)
  const simRef = useRef<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    animId: number
  } | null>(null)

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    const { nodes, edges } = generateGraph(memory.knowledgeGraph)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height

    const sim = { nodes, edges, animId: 0 }
    simRef.current = sim

    function simulate() {
      // repulsive force (all pairs)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
          const force = 3000 / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          nodes[i].vx -= fx
          nodes[i].vy -= fy
          nodes[j].vx += fx
          nodes[j].vy += fy
        }
      }

      // attractive force along edges
      for (const edge of edges) {
        const a = nodes[edge.source]
        const b = nodes[edge.target]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const force = (dist - 120) * 0.008
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }

      // center gravity
      for (const node of nodes) {
        node.vx += (W / 2 - node.x) * 0.001
        node.vy += (H / 2 - node.y) * 0.001
      }

      // update positions
      for (const node of nodes) {
        node.vx *= 0.92
        node.vy *= 0.92
        node.x += node.vx
        node.y += node.vy
        node.x = Math.max(node.radius, Math.min(W - node.radius, node.x))
        node.y = Math.max(node.radius, Math.min(H - node.radius, node.y))
      }

      // draw
      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = '#161b22'
      ctx!.fillRect(0, 0, W, H)

      const sel = selectedRef.current

      // edges
      for (const edge of edges) {
        const a = nodes[edge.source]
        const b = nodes[edge.target]
        const highlighted = sel !== null && (edge.source === sel || edge.target === sel)
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.strokeStyle = highlighted ? '#58a6ff' : '#30363d'
        ctx!.lineWidth = highlighted ? 2 : 1
        ctx!.stroke()
      }

      // nodes
      for (const node of nodes) {
        const isSelected = node.id === sel
        const neighborSet = new Set<number>()
        for (const e of edges) {
          if (e.source === sel) neighborSet.add(e.target)
          if (e.target === sel) neighborSet.add(e.source)
        }
        const isNeighbor = sel !== null && neighborSet.has(node.id)
        const dimmed = sel !== null && !isSelected && !isNeighbor

        if (isSelected) {
          ctx!.beginPath()
          ctx!.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2)
          ctx!.fillStyle = 'rgba(88, 166, 255, 0.2)'
          ctx!.fill()
        }

        ctx!.beginPath()
        ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx!.fillStyle = dimmed ? '#1c2128' : TYPE_COLORS[node.type]
        ctx!.fill()
        ctx!.strokeStyle = TYPE_COLORS[node.type]
        ctx!.lineWidth = isSelected ? 3 : 1.5
        ctx!.stroke()

        ctx!.fillStyle = dimmed ? '#484f58' : '#e6edf3'
        ctx!.font = 'bold 11px sans-serif'
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'
        ctx!.fillText(node.label, node.x, node.y)
      }

      sim.animId = requestAnimationFrame(simulate)
    }

    simulate()
    return () => cancelAnimationFrame(sim.animId)
  }, [memory.knowledgeGraph])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      const sim = simRef.current
      if (!canvas || !sim) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const clicked = sim.nodes.find(
        (n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) <= n.radius,
      )
      setSelectedId(clicked ? clicked.id : null)
    },
    [],
  )

  const selectedNode =
    selectedId !== null && simRef.current
      ? simRef.current.nodes.find((n) => n.id === selectedId)
      : null

  return (
    <div className="tab-content">
      <h2>Memory</h2>
      <div className="memory-stats">
        <div className="stat-card">
          <h4>Short Term</h4>
          <p>{memory.shortTerm} items</p>
        </div>
        <div className="stat-card">
          <h4>Long Term</h4>
          <p>{memory.longTerm} items</p>
        </div>
        <div className="stat-card">
          <h4>Knowledge Graph</h4>
          <p>{memory.knowledgeGraph} nodes</p>
        </div>
      </div>
      <div className="memory-graph-container">
        <canvas
          ref={canvasRef}
          className="memory-canvas"
          onClick={handleCanvasClick}
        />
        {selectedNode && (
          <div className="graph-node-tooltip">
            <strong>{selectedNode.label}</strong>
            <span style={{ color: TYPE_COLORS[selectedNode.type], marginLeft: 8 }}>
              {selectedNode.type}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
