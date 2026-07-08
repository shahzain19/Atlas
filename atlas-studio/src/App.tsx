import { useState, useCallback } from 'react'
import { useAtlasConnection } from './hooks/useAtlasConnection'
import WorldView3D from './components/WorldView3D'
import Dashboard from './components/Dashboard'
import AgentCard from './components/AgentCard'
import TaskItem from './components/TaskItem'
import MissionForm from './components/MissionForm'
import MemoryGraph from './components/MemoryGraph'
import CameraDashboard from './components/CameraDashboard'
import './App.css'

const TABS = ['dashboard', 'world', 'agents', 'planning', 'memory', 'camera'] as const
type Tab = (typeof TABS)[number]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const { connectionState, snapshot, startRuntime, stopRuntime, refresh } =
    useAtlasConnection()

  const agentStatus = snapshot.status
  const isConnected = connectionState === 'connected'

  const toggleAgent = useCallback(() => {
    if (agentStatus === 'running') {
      stopRuntime()
      return
    }
    startRuntime()
  }, [agentStatus, startRuntime, stopRuntime])

  const handleCancelTask = useCallback(
    (_id: string) => {
      refresh()
    },
    [refresh],
  )

  const handleRetryTask = useCallback(
    (_id: string) => {
      refresh()
    },
    [refresh],
  )

  const handleSubmitMission = useCallback((_name: string) => {
    // visual only — would dispatch submit_mission message
  }, [])

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
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'planning'
                  ? 'Planning'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-panel">
          {activeTab === 'dashboard' && (
            <Dashboard snapshot={snapshot} />
          )}

          {activeTab === 'world' && (
            <div className="tab-content">
              <h2>World Model</h2>
              <p className="world-meta">
                Position ({snapshot.world.position.x.toFixed(2)},{' '}
                {snapshot.world.position.y.toFixed(2)}) · Confidence{' '}
                {snapshot.world.confidence.toFixed(2)} ·{' '}
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
                  <AgentCard key={agent.name} agent={agent} />
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
              <MissionForm onSubmit={handleSubmitMission} />
              <div className="task-list">
                {snapshot.tasks.length === 0 && (
                  <p className="empty-state">
                    No tasks yet. Start the runtime to begin.
                  </p>
                )}
                {snapshot.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onCancel={handleCancelTask}
                    onRetry={handleRetryTask}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'memory' && <MemoryGraph memory={snapshot.memory} />}

          {activeTab === 'camera' && <CameraDashboard />}
        </main>

        <aside className="logs-panel">
          <h3>Logs</h3>
          <div className="logs-list">
            {snapshot.logs.map((log, i) => (
              <div key={i} className="log-item">
                {log}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
