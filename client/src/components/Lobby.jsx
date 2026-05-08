import { useState } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'

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
    <div style={styles.container}>
      <h1 style={styles.title}>🏏 Hand Cricket</h1>

      <div style={styles.card}>
        <label style={styles.label}>Your Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter your name"
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />

        {mode === null && (
          <div style={styles.row}>
            <button style={styles.btnPrimary} onClick={() => {
              const trimmed = name.trim()
              if (!trimmed) { setError('Enter your name first.'); return }
              setError('')
              setLoading(true)
              onRoomCreated(trimmed)
              socket.emit('create_room', { name: trimmed })
            }} disabled={loading}>
              Create Room
            </button>
            <button style={styles.btnSecondary} onClick={() => setMode('join')} disabled={loading}>
              Join Room
            </button>
          </div>
        )}

        {mode === 'join' && (
          <>
            <label style={styles.label}>Room Code</label>
            <input
              style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '0.2em' }}
              type="text"
              placeholder="XXXXXX"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <div style={styles.row}>
              <button style={styles.btnPrimary} onClick={handleJoin} disabled={loading}>
                {loading ? 'Joining…' : 'Join Game'}
              </button>
              <button style={styles.btnGhost} onClick={() => { setMode(null); setError('') }} disabled={loading}>
                Back
              </button>
            </div>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    color: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
    padding: '1rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '2rem',
    letterSpacing: '0.05em',
  },
  card: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  label: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '-0.25rem',
  },
  input: {
    padding: '0.65rem 0.9rem',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '1rem',
    outline: 'none',
  },
  row: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  btnPrimary: {
    flex: 1,
    padding: '0.65rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnSecondary: {
    flex: 1,
    padding: '0.65rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#22c55e',
    color: '#fff',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnGhost: {
    flex: 1,
    padding: '0.65rem',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: 0,
  },
  error: {
    color: '#f87171',
    fontSize: '0.85rem',
    margin: 0,
  },
}
