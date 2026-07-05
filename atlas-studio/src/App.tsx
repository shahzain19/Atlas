import { useState } from 'react'
import { useAtlasConnection } from './hooks/useAtlasConnection'
import WorldView3D from './components/WorldView3D'
import './App.css'

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
                <WorldView3D world={snapshot.world} />
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
