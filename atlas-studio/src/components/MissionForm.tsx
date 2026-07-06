import { useState } from 'react'

interface Props {
  onSubmit: (name: string) => void
}

export default function MissionForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
    setSubmitted(true)
    setName('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="mission-form">
      <h3>Submit New Mission</h3>
      <form onSubmit={handleSubmit}>
        <div className="mission-form-row">
          <input
            className="mission-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter mission name..."
          />
          <button className="mission-submit-btn" type="submit" disabled={!name.trim()}>
            Submit
          </button>
        </div>
      </form>
      {submitted && <p className="mission-feedback">Mission submitted!</p>}
    </div>
  )
}
