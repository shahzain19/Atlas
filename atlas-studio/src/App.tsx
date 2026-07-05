import { useState } from 'react'
import { useAtlasConnection } from './hooks/useAtlasConnection'
import './App.css'

function worldCellClass(
  index: number,
  position: { x: number; y: number },
  objects: { x: number; y: number }[]
): string {
  const col = index % 10
  const row = Math.floor(index / 10)
  const agentCol = Math.min(9, Math.max(0, Math.floor((position.x % 10 + 10) % 10)))
  const agentRow = Math.min(9, Math.max(0, Math.floor((position.y % 10 + 10) % 10)))

  if (col === agentCol && row === agentRow) return 'grid-cell agent-cell'
  for (const obj of objects) {
    const objCol = Math.min(9, Math.max(0, Math.floor((obj.x % 10 + 10) % 10)))
    const objRow = Math.min(9, Math.max(0, Math.floor((obj.y % 10 + 10) % 10)))
    if (col === objCol && row === objRow) return 'grid-cell object-cell'
  }
  return 'grid-cell'
}

function App() {
  const [activeTab, setActiveTab] = useState('world')
  const { connectionState, snapshot, startRuntime, stopRuntime } = useAtlasConnection()

  const agentStatus = snapshot.status
  const isConnected = connectionState === 'connected'

  const toggleAgent = () => {
    if (agentStatus === 'running') {
      stopRuntime()
      return
    }
    startRuntime()
  }

  const connectionLabel =
    connectionState === 'connected'
      ? 'Connected'
      : connectionState === 'connecting'
        ? 'Connecting'
        : 'Disconnected'

  return (
    <div className="app-container">
      <header className="studio-header">
        <div className="header-left">
          <h1>Atlas Studio</h1>
          <span className={`connection-badge connection-${connectionState}`}>
            {connectionLabel}
          </span>
        </div>
        <div className="header-right">
          <span className={`status-badge status-${agentStatus}`}>
            {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
          </span>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <nav className="nav-tabs">
            {(['world', 'agents', 'planning', 'memory'] as const).map((tab) => (
              <button
                key={tab}
                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-panel">
          {activeTab === 'world' && (
            <div className="tab-content">
              <h2>World Model</h2>
              <p className="world-meta">
                Position ({snapshot.world.position.x.toFixed(2)}, {snapshot.world.position.y.toFixed(2)}) ·
                Confidence {snapshot.world.confidence.toFixed(2)} ·
                {snapshot.world.objects.length} objects
              </p>
              <div className="world-visualizer">
                <div className="world-grid">
                  {Array.from({ length: 100 }, (_, i) => (
                    <div
                      key={i}
                      className={worldCellClass(i, snapshot.world.position, snapshot.world.objects)}
                      title={
                        worldCellClass(i, snapshot.world.position, snapshot.world.objects).includes('object')
                          ? snapshot.world.objects.find((o) => {
                              const col = i % 10
                              const row = Math.floor(i / 10)
                              const objCol = Math.min(9, Math.max(0, Math.floor((o.x % 10 + 10) % 10)))
                              const objRow = Math.min(9, Math.max(0, Math.floor((o.y % 10 + 10) % 10)))
                              return col === objCol && row === objRow
                            })?.label
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="tab-content">
              <h2>Agents</h2>
              <div className="agents-list">
                {snapshot.agents.length === 0 && (
                  <p className="empty-state">No agents registered on runtime.</p>
                )}
                {snapshot.agents.map((agent) => (
                  <div key={agent.name} className="agent-card">
                    <div className="agent-header">
                      <h3>{agent.name}</h3>
                      <span className={`status-dot status-${agent.status}`} />
                    </div>
                    <p>Type: Registered Agent</p>
                    <p>Status: {agent.status}</p>
                  </div>
                ))}
                <button
                  className="start-btn"
                  onClick={toggleAgent}
                  disabled={!isConnected}
                >
                  {!isConnected
                    ? 'Waiting for runtime...'
                    : agentStatus === 'running'
                      ? 'Stop Runtime'
                      : 'Start Runtime'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="tab-content">
              <h2>Planning & Tasks</h2>
              <div className="task-list">
                {snapshot.tasks.length === 0 && (
                  <p className="empty-state">No tasks yet. Start the runtime to begin.</p>
                )}
                {snapshot.tasks.map((task) => (
                  <div key={task.id} className={`task-item ${task.status}`}>
                    <span className="task-name">{task.name}</span>
                    <span className="task-status">{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="tab-content">
              <h2>Memory</h2>
              <div className="memory-stats">
                <div className="stat-card">
                  <h4>Short Term</h4>
                  <p>{snapshot.memory.shortTerm} items</p>
                </div>
                <div className="stat-card">
                  <h4>Long Term</h4>
                  <p>{snapshot.memory.longTerm} items</p>
                </div>
                <div className="stat-card">
                  <h4>Knowledge Graph</h4>
                  <p>{snapshot.memory.knowledgeGraph} nodes</p>
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="logs-panel">
          <h3>Logs</h3>
          <div className="logs-list">
            {snapshot.logs.map((log, i) => (
              <div key={i} className="log-item">{log}</div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
