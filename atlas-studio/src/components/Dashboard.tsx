import { StudioSnapshot } from '../types/protocol'

interface Props {
  snapshot: StudioSnapshot
}

const activityHeights = [35, 72, 51, 88, 42, 65, 28, 79]

export default function Dashboard({ snapshot }: Props) {
  const activeTasks = snapshot.tasks.filter(
    t => t.status === 'in-progress' || t.status === 'running'
  ).length
  const totalMemory =
    snapshot.memory.shortTerm + snapshot.memory.longTerm + snapshot.memory.knowledgeGraph
  const completedTasks = snapshot.tasks.filter(t => t.status === 'completed').length
  const totalTasks = snapshot.tasks.length

  const statusColor =
    snapshot.status === 'running'
      ? '#3fb950'
      : snapshot.status === 'error'
        ? '#f85149'
        : '#8b949e'

  const shortPct = totalMemory > 0 ? (snapshot.memory.shortTerm / totalMemory) * 100 : 0
  const longPct = totalMemory > 0 ? (snapshot.memory.longTerm / totalMemory) * 100 : 0
  const kgPct = totalMemory > 0 ? (snapshot.memory.knowledgeGraph / totalMemory) * 100 : 0

  const completionPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="tab-content">
      <h2>Dashboard</h2>

      <div className="dashboard-overview">
        <div className="stat-card dashboard-stat">
          <h4>Runtime Status</h4>
          <p style={{ color: statusColor }}>
            {snapshot.status.charAt(0).toUpperCase() + snapshot.status.slice(1)}
          </p>
        </div>
        <div className="stat-card dashboard-stat">
          <h4>Connected Agents</h4>
          <p>{snapshot.agents.length}</p>
        </div>
        <div className="stat-card dashboard-stat">
          <h4>Active Tasks</h4>
          <p>{activeTasks}</p>
        </div>
        <div className="stat-card dashboard-stat">
          <h4>Memory Usage</h4>
          <p>{totalMemory} items</p>
        </div>
      </div>

      <div className="dashboard-telemetry">
        <h3>Real-time Telemetry</h3>
        <div className="telemetry-grid">
          <div className="telemetry-card">
            <h4>Memory Distribution</h4>
            <div className="telemetry-bar">
              {shortPct > 0 && (
                <div
                  className="telemetry-bar-segment short-term"
                  style={{ width: `${shortPct}%` }}
                />
              )}
              {longPct > 0 && (
                <div
                  className="telemetry-bar-segment long-term"
                  style={{ width: `${longPct}%` }}
                />
              )}
              {kgPct > 0 && (
                <div
                  className="telemetry-bar-segment knowledge-graph"
                  style={{ width: `${kgPct}%` }}
                />
              )}
            </div>
            <div className="telemetry-legend">
              <span>
                <span className="legend-dot short-term" /> Short ({snapshot.memory.shortTerm})
              </span>
              <span>
                <span className="legend-dot long-term" /> Long ({snapshot.memory.longTerm})
              </span>
              <span>
                <span className="legend-dot knowledge-graph" /> Knowl. (
                {snapshot.memory.knowledgeGraph})
              </span>
            </div>
          </div>

          <div className="telemetry-card">
            <h4>Task Completion</h4>
            <div className="donut-container">
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(#3fb950 0deg ${completionPct * 3.6}deg, #21262d ${completionPct * 3.6}deg 360deg)`,
                }}
              >
                <div className="donut-center">{Math.round(completionPct)}%</div>
              </div>
            </div>
          </div>

          <div className="telemetry-card telemetry-card-wide">
            <h4>Agent Activity</h4>
            <div className="activity-chart">
              {activityHeights.map((h, i) => (
                <div
                  key={i}
                  className="activity-bar"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
