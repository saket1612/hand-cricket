import { useSocket } from '../hooks/useSocket.jsx'

export default function Toss({ gameState }) {
  const socket = useSocket()
  const { batsman, batsmanName, bowlerName } = gameState
  const isBatsman = socket.id === batsman

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏏 Hand Cricket</h1>
      <div style={styles.card}>
        <p style={styles.sub}>Toss complete!</p>
        <div style={styles.result}>
          {isBatsman ? '🏏 You bat first!' : '🎯 You bowl first!'}
        </div>
        <p style={styles.detail}>
          <strong>{batsmanName}</strong> bats &nbsp;·&nbsp; <strong>{bowlerName}</strong> bowls
        </p>
        <p style={styles.hint}>Get ready…</p>
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
  sub:    { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  result: { fontSize: '2rem', fontWeight: 700 },
  detail: { color: '#64748b', fontSize: '0.9rem', margin: 0 },
  hint:   { color: '#475569', fontSize: '0.82rem', margin: '0.5rem 0 0' },
}
