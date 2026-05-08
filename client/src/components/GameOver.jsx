import { useState } from 'react'

export default function GameOver({ gameState, onPlayAgain }) {
  const { winner, winnerName, scores, myName, opponentName, opponentWantsRematch } = gameState
  const [iWantRematch, setIWantRematch] = useState(false)

  const isTie    = winner === null
  const isWinner = !isTie && winnerName === myName
  const myScore  = scores?.[myName]       ?? 0
  const oppScore = scores?.[opponentName] ?? 0

  let headline, headlineColor
  if (isTie) {
    headline      = "It's a Tie! 🤝"
    headlineColor = '#f59e0b'
  } else if (isWinner) {
    headline      = 'You Win! 🏆'
    headlineColor = '#22c55e'
  } else {
    headline      = 'You Lose 😔'
    headlineColor = '#ef4444'
  }

  function handlePlayAgain() {
    setIWantRematch(true)
    onPlayAgain()
  }

  const bothWant = iWantRematch && opponentWantsRematch

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏏 Hand Cricket</h1>
      <div style={styles.card}>
        <div style={{ ...styles.headline, color: headlineColor }}>{headline}</div>

        {!isTie && (
          <p style={styles.winnerLabel}>{winnerName} wins this match!</p>
        )}

        <div style={styles.scoreRow}>
          <ScoreChip
            name={myName ?? 'You'}
            score={myScore}
            highlight={isWinner}
          />
          <span style={styles.vs}>vs</span>
          <ScoreChip
            name={opponentName ?? 'Opponent'}
            score={oppScore}
            highlight={!isTie && !isWinner}
          />
        </div>

        {!iWantRematch ? (
          <button style={styles.btn} onClick={handlePlayAgain}>
            Play Again
          </button>
        ) : bothWant ? (
          <p style={styles.waitingText}>Starting rematch…</p>
        ) : (
          <div style={styles.waitingBox}>
            <p style={styles.waitingText}>Waiting for {opponentName ?? 'opponent'}…</p>
            {opponentWantsRematch && (
              <p style={styles.opponentReady}>Opponent is ready! ✅</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreChip({ name, score, highlight }) {
  return (
    <div style={{
      ...styles.chip,
      borderColor: highlight ? '#22c55e' : '#334155',
      background:  highlight ? '#14532d' : '#0f172a',
    }}>
      <span style={styles.chipName}>{name}</span>
      <span style={styles.chipScore}>{score}</span>
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
  title: { fontSize: '2.5rem', marginBottom: '2rem', letterSpacing: '0.05em' },
  card: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  headline:    { fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.1 },
  winnerLabel: { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' },
  vs: { color: '#475569', fontSize: '0.85rem' },
  chip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    border: '2px solid',
    minWidth: '100px',
  },
  chipName:  { fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' },
  chipScore: { fontSize: '2rem', fontWeight: 700, color: '#f1f5f9' },
  btn: {
    padding: '0.75rem 2.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  waitingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.5rem',
  },
  waitingText:   { color: '#64748b', fontSize: '0.9rem', margin: 0 },
  opponentReady: { color: '#22c55e', fontSize: '0.85rem', margin: 0 },
}
