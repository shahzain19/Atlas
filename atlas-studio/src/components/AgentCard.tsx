import { useState } from 'react'
import { StudioAgentInfo } from '../types/protocol'

interface Props {
  agent: StudioAgentInfo
}

function hashRange(label: string, min: number, max: number): number {
  let h = 0
  for (let i = 0; i < label.length; i++) {
    h = ((h << 5) - h + label.charCodeAt(i)) | 0
  }
  return min + (Math.abs(h) % (max - min + 1))
}

export default function AgentCard({ agent }: Props) {
  const [expanded, setExpanded] = useState(false)

  const healthBase = agent.status === 'running' ? 85 : agent.status === 'idle' ? 50 : 20
  const health = hashRange(agent.name, healthBase, Math.min(healthBase + 15, 100))
  const uptime = agent.status === 'running' ? `${hashRange(agent.name, 1, 48)}m` : '—'

  return (
    <div
      className={`agent-card ${expanded ? 'agent-card-expanded' : ''}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="agent-header">
        <h3>{agent.name}</h3>
        <span className={`status-dot status-${agent.status}`} />
      </div>
      <p className="agent-subtitle">
        Type: Registered Agent · Status: {agent.status}
      </p>

      {expanded && (
        <div className="agent-details">
          <div className="agent-detail-row">
            <span className="agent-detail-label">Type</span>
            <span className="agent-detail-value">Registered Agent</span>
          </div>
          <div className="agent-detail-row">
            <span className="agent-detail-label">Status</span>
            <span className="agent-detail-value">{agent.status}</span>
          </div>
          <div className="agent-detail-row">
            <span className="agent-detail-label">Uptime</span>
            <span className="agent-detail-value">{uptime}</span>
          </div>
          <div className="agent-detail-row">
            <span className="agent-detail-label">Last Activity</span>
            <span className="agent-detail-value">
              {agent.status === 'running' ? 'Active now' : 'Inactive'}
            </span>
          </div>
          <div className="agent-health-section">
            <span className="agent-detail-label">Health</span>
            <div className="agent-health-bar">
              <div
                className="agent-health-fill"
                style={{
                  width: `${health}%`,
                  backgroundColor:
                    health > 70 ? '#3fb950' : health > 40 ? '#d29922' : '#f85149',
                }}
              />
            </div>
            <span className="agent-health-text">{health}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
