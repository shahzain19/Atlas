import { StudioTaskInfo } from '../types/protocol'

interface Props {
  task: StudioTaskInfo
  onCancel: (id: string) => void
  onRetry: (id: string) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#f85149',
  medium: '#d29922',
  low: '#58a6ff',
}

const PRIORITIES = ['low', 'medium', 'high']

function getPriority(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return PRIORITIES[Math.abs(h) % PRIORITIES.length]
}

function getProgress(status: string): number {
  switch (status) {
    case 'completed':
      return 100
    case 'in-progress':
    case 'running':
      return 55
    case 'failed':
      return 35
    default:
      return 10
  }
}

export default function TaskItem({ task, onCancel, onRetry }: Props) {
  const priority = getPriority(task.id)
  const progress = getProgress(task.status)

  return (
    <div className={`task-item ${task.status}`}>
      <div className="task-main">
        <div className="task-info">
          <span
            className="task-priority-badge"
            style={{ backgroundColor: PRIORITY_COLORS[priority] }}
          >
            {priority}
          </span>
          <span className="task-name">{task.name}</span>
          <span className="task-status">{task.status}</span>
        </div>
        <div className="task-progress-bar">
          <div
            className="task-progress-fill"
            style={{
              width: `${progress}%`,
              backgroundColor:
                task.status === 'completed'
                  ? '#3fb950'
                  : task.status === 'failed'
                    ? '#f85149'
                    : '#58a6ff',
            }}
          />
        </div>
      </div>
      <div className="task-actions">
        <button
          className="task-action-btn cancel-btn"
          onClick={(e) => {
            e.stopPropagation()
            onCancel(task.id)
          }}
          disabled={task.status === 'completed' || task.status === 'failed'}
        >
          Cancel
        </button>
        <button
          className="task-action-btn retry-btn"
          onClick={(e) => {
            e.stopPropagation()
            onRetry(task.id)
          }}
          disabled={task.status !== 'failed'}
        >
          Retry
        </button>
      </div>
    </div>
  )
}
