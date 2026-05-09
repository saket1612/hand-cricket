import { useState } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'
import './Lobby.css'

export default function Lobby({ onRoomCreated, onRoomJoined }) {
  const socket = useSocket()
  const [name, setName]     = useState('')
  const [code, setCode]     = useState('')
  const [mode, setMode]     = useState(null) // 'create' | 'join'
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) { setError('Enter your name first.'); return }
    setError('')
    setLoading(true)
    onRoomCreated(trimmed)
    socket.emit('create_room', { name: trimmed })
  }

  function handleJoin() {
    const trimmedName = name.trim()
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedName) { setError('Enter your name first.'); return }
    if (trimmedCode.length !== 6) { setError('Room code must be 6 characters.'); return }
    setError('')
    setLoading(true)
    onRoomJoined(trimmedName)
    socket.emit('join_room', { name: trimmedName, code: trimmedCode })
  }

  return (
    <div className="screen">
      <h1 className="screen-title">🏏 Hand Cricket</h1>

      <div className="lobby-card">
        <label className="lobby-label">Your Name</label>
        <input
          className="lobby-input"
          type="text"
          placeholder="Enter your name"
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />

        {mode === null && (
          <div className="lobby-row">
            <button className="btn-primary" onClick={() => {
              const trimmed = name.trim()
              if (!trimmed) { setError('Enter your name first.'); return }
              setError('')
              setLoading(true)
              onRoomCreated(trimmed)
              socket.emit('create_room', { name: trimmed })
            }} disabled={loading}>
              Create Room
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')} disabled={loading}>
              Join Room
            </button>
          </div>
        )}

        {mode === 'join' && (
          <>
            <label className="lobby-label">Room Code</label>
            <input
              className="lobby-input lobby-input--code"
              type="text"
              placeholder="XXXXXX"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <div className="lobby-row">
              <button className="btn-primary" onClick={handleJoin} disabled={loading}>
                {loading ? 'Joining…' : 'Join Game'}
              </button>
              <button className="btn-ghost" onClick={() => { setMode(null); setError('') }} disabled={loading}>
                Back
              </button>
            </div>
          </>
        )}

        {error && <p className="lobby-error">{error}</p>}
      </div>
    </div>
  )
}
