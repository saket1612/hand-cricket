import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'

const R    = 45
const CIRC = 2 * Math.PI * R  // ≈ 282.7

export default function BallScreen({ gameState }) {
  const socket = useSocket()
  const { ball, score, target, lastResult, batsman, batsmanName, bowlerName } = gameState
  const isBatsman = socket.id === batsman

  const [myPick,   setMyPick]   = useState(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const intervalRef = useRef(null)

  // Parent passes key={ballKey} so this component remounts on every new ball.
  // Therefore an empty-deps useEffect is the correct countdown start.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(intervalRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Stop visual countdown when server sends the result
  useEffect(() => {
    if (lastResult) clearInterval(intervalRef.current)
  }, [lastResult])

  function handlePick(n) {
    if (myPick !== null || lastResult) return
    setMyPick(n)
    socket.emit('submit_pick', { number: n })
  }

  // ─── Result display ──────────────────────────────────────────────────────────
  let resultDisplay = null
  if (lastResult) {
    const myActualPick = isBatsman ? lastResult.batsmanPick : lastResult.bowlerPick
    const oppPick      = isBatsman ? lastResult.bowlerPick  : lastResult.batsmanPick
    const label        = p => p === 0 ? 'timeout' : String(p)

    if (lastResult.isOut) {
      resultDisplay = {
        headline: '⬛ OUT!',
        sub:      `Both picked ${lastResult.batsmanPick}`,
        color:    '#ef4444',
      }
    } else if (lastResult.runs === 0) {
      resultDisplay = {
        headline: '🚫 No runs',
        sub:      `You: ${label(myActualPick)}  ·  Opp: ${label(oppPick)}`,
        color:    '#94a3b8',
      }
    } else {
      resultDisplay = {
        headline: `+${lastResult.runs} run${lastResult.runs !== 1 ? 's' : ''}! 🏏`,
        sub:      `You: ${label(myActualPick)}  ·  Opp: ${label(oppPick)}`,
        color:    '#22c55e',
      }
    }
  }

  const dashOffset = CIRC * (1 - timeLeft / 5)
  const timerColor = timeLeft <= 1 ? '#ef4444' : timeLeft <= 2 ? '#f97316' : '#3b82f6'

  // ── Full-screen OUT takeover ─────────────────────────────────────────────
  if (lastResult?.isOut) {
    return (
      <div style={styles.outScreen}>
        <div style={styles.outWord}>OUT!</div>
        <p style={styles.outSub}>Both picked <strong>{lastResult.batsmanPick}</strong></p>
        <p style={styles.outHint}>Next up…</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🏏 Hand Cricket</h2>

      {/* ── Ball dots ─────────────────────────────────────────────────────── */}
      <div style={styles.dots}>
        {Array.from({ length: 6 }, (_, i) => {
          const played  = i < ball - 1
          const current = i === ball - 1
          return (
            <span
              key={i}
              style={{
                fontSize:   current ? '1.5rem' : '1.2rem',
                color:      played ? '#22c55e' : current ? '#f1f5f9' : '#334155',
                transition: 'color 0.3s',
              }}
            >
              {played ? '●' : current ? '◉' : '○'}
            </span>
          )
        })}
      </div>

      {/* ── Score / Target ────────────────────────────────────────────────── */}
      <div style={styles.scoreRow}>
        <div style={styles.scoreBox}>
          <span style={styles.scoreLabel}>Score</span>
          <span style={styles.scoreValue}>{score}</span>
        </div>
        {target != null && (
          <div style={styles.scoreBox}>
            <span style={styles.scoreLabel}>Target</span>
            <span style={{ ...styles.scoreValue, color: '#f59e0b' }}>{target + 1}</span>
          </div>
        )}
      </div>

      {/* ── Role label ────────────────────────────────────────────────────── */}
      <p style={styles.role}>
        {isBatsman ? '🏏 Batting' : '🎯 Bowling'}
        <span style={{ color: '#334155' }}> · </span>
        <span style={{ color: '#475569', fontSize: '0.8rem' }}>
          {batsmanName} vs {bowlerName}
        </span>
      </p>

      {/* ── SVG countdown ring ────────────────────────────────────────────── */}
      {!lastResult && (
        <svg
          width="110"
          height="110"
          viewBox="0 0 100 100"
          style={{ display: 'block', margin: '0 auto' }}
        >
          <circle cx="50" cy="50" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke={timerColor}
            strokeWidth="8"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
          <text
            x="50" y="57"
            textAnchor="middle"
            fontSize="30"
            fontWeight="bold"
            fill="#f1f5f9"
          >
            {timeLeft}
          </text>
        </svg>
      )}

      {/* ── Bottom section: buttons / waiting / result ────────────────────── */}
      {lastResult ? (
        <div style={{ ...styles.resultBox, borderColor: resultDisplay.color }}>
          <p style={{ ...styles.resultHeadline, color: resultDisplay.color }}>
            {resultDisplay.headline}
          </p>
          <p style={styles.resultSub}>{resultDisplay.sub}</p>
        </div>
      ) : myPick === null ? (
        <div style={styles.btnGrid}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} style={styles.numBtn} onClick={() => handlePick(n)}>
              {n}
            </button>
          ))}
        </div>
      ) : (
        <div style={styles.waitingBox}>
          <p style={styles.pickedText}>
            You picked <strong style={{ color: '#60a5fa' }}>{myPick}</strong>
          </p>
          <p style={styles.waitingText}>Waiting for opponent…</p>
        </div>
      )}
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
    gap: '1.25rem',
    background: '#0f172a',
    color: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
    padding: '1.5rem',
  },
  heading: { fontSize: '1.6rem', margin: 0, letterSpacing: '0.04em' },
  dots: { display: 'flex', gap: '0.6rem' },
  scoreRow: { display: 'flex', gap: '2rem' },
  scoreBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#1e293b',
    borderRadius: '0.75rem',
    padding: '0.5rem 1.4rem',
  },
  scoreLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  scoreValue: { fontSize: '2.2rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.1 },
  role: { fontSize: '0.88rem', color: '#94a3b8', margin: 0 },
  btnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '280px',
  },
  numBtn: {
    padding: '1rem',
    fontSize: '1.4rem',
    fontWeight: 700,
    background: '#1e293b',
    color: '#f1f5f9',
    border: '2px solid #334155',
    borderRadius: '0.75rem',
    cursor: 'pointer',
  },
  waitingBox: {
    textAlign: 'center',
    background: '#1e293b',
    borderRadius: '0.75rem',
    padding: '1.5rem 2.5rem',
  },
  pickedText:  { margin: '0 0 0.5rem', fontSize: '1rem' },
  waitingText: { margin: 0, color: '#64748b', fontSize: '0.85rem' },
  resultBox: {
    textAlign: 'center',
    background: '#1e293b',
    borderRadius: '0.75rem',
    padding: '1.5rem 2.5rem',
    border: '2px solid',
    minWidth: '250px',
  },
  resultHeadline: { fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem' },
  resultSub: { color: '#94a3b8', fontSize: '0.9rem', margin: 0, fontFamily: 'monospace' },
  // ── OUT screen ────────────────────────────────────────────────────────────
  outScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a0000',
    gap: '1rem',
    fontFamily: 'system-ui, sans-serif',
  },
  outWord: {
    fontSize: 'clamp(5rem, 20vw, 10rem)',
    fontWeight: 900,
    color: '#ef4444',
    letterSpacing: '0.05em',
    animation: 'outPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
    textShadow: '0 0 60px rgba(239,68,68,0.6)',
  },
  outSub:  { fontSize: '1.2rem', color: '#fca5a5', margin: 0 },
  outHint: { fontSize: '0.85rem', color: '#7f1d1d', margin: 0 },
}

// Inject OUT animation keyframe once
if (typeof document !== 'undefined') {
  const id = 'out-pop-keyframes'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = '@keyframes outPop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }'
    document.head.appendChild(style)
  }
}
