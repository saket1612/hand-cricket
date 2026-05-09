import { useState } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'
import '../css/Lobby.css'

export default function Lobby({ onRoomCreated, onRoomJoined }) {
  const socket = useSocket()
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [mode, setMode]       = useState(null)   // null | 'join'
  const [error, setError]     = useState('')
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

  // Allow pressing Enter to proceed
  function onNameKey(e) {
    if (e.key !== 'Enter') return
    if (mode === null) handleCreate()
    else if (mode === 'join') handleJoin()
  }

  return (
    <div className="screen">
      <h1 className="screen-title">🏏 Hand Cricket</h1>
      <p className="lobby-tagline">Pick numbers secretly · Match = OUT!</p>

      <div className="lobby-card">
        <label className="lobby-label">Your Name</label>
        <input
          className="lobby-input"
          type="text"
          placeholder="e.g. Virat"
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={onNameKey}
          autoComplete="off"
          autoCapitalize="words"
          disabled={loading}
        />

        {mode === null && (
          <>
            <div className="lobby-row">
              <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                🏠 Create Room
              </button>
            </div>
            <div className="lobby-divider">or</div>
            <button className="btn-secondary" style={{ width: '100%', minHeight: 48 }}
              onClick={() => { setError(''); setMode('join') }} disabled={loading}>
              🔗 Join a Room
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <label className="lobby-label" style={{ marginTop: '0.25rem' }}>Room Code</label>
            <input
              className="lobby-input lobby-input--code"
              type="text"
              placeholder="Enter 6-letter code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoComplete="off"
              autoCapitalize="characters"
              disabled={loading}
            />
            <div className="lobby-row">
              <button className="btn-primary" onClick={handleJoin} disabled={loading}>
                {loading ? 'Joining…' : '▶ Join Game'}
              </button>
              <button className="btn-ghost" onClick={() => { setMode(null); setError('') }} disabled={loading}>
                ← Back
              </button>
            </div>
          </>
        )}

        {error && <p className="lobby-error">⚠ {error}</p>}
      </div>
    </div>
  )
}
