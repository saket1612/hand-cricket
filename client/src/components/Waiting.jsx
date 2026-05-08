export default function Waiting({ roomCode, opponentName }) {
  const joined = Boolean(opponentName)

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏏 Hand Cricket</h1>

      <div style={styles.card}>
        {!joined ? (
          <>
            <p style={styles.label}>Share this code with your friend</p>
            <div style={styles.codeBox}>{roomCode}</div>
            <div style={styles.spinner} />
            <p style={styles.hint}>Waiting for opponent to join…</p>
          </>
        ) : (
          <>
            <p style={styles.label}>Opponent joined!</p>
            <p style={styles.opponentName}>{opponentName}</p>
            <div style={styles.spinner} />
            <p style={styles.hint}>Starting game…</p>
          </>
        )}
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
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: 0,
  },
  codeBox: {
    fontSize: '2.4rem',
    fontFamily: 'monospace',
    letterSpacing: '0.35em',
    background: '#0f172a',
    border: '2px solid #3b82f6',
    borderRadius: '0.75rem',
    padding: '0.6rem 1.4rem',
    color: '#60a5fa',
    fontWeight: 700,
    userSelect: 'all',
  },
  opponentName: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#22c55e',
    margin: 0,
  },
  hint: {
    color: '#475569',
    fontSize: '0.85rem',
    margin: 0,
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '4px solid #1e293b',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

// Inject keyframes once
if (typeof document !== 'undefined') {
  const id = 'waiting-spin-keyframes'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
    document.head.appendChild(style)
  }
}
