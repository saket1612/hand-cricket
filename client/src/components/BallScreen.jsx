import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket.jsx'
import { BALL_TIMER_SECONDS, BALLS_PER_OVER } from '../config.js'
import '../css/BallScreen.css'

const R    = 45
const CIRC = 2 * Math.PI * R  // ≈ 282.7

export default function BallScreen({ gameState }) {
  const socket = useSocket()
  const { ball, score, target, lastResult, batsman, batsmanName, bowlerName } = gameState
  const isBatsman = socket.id === batsman

  const [myPick,   setMyPick]   = useState(null)
  const [timeLeft, setTimeLeft] = useState(BALL_TIMER_SECONDS)
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

  const dashOffset = CIRC * (1 - timeLeft / BALL_TIMER_SECONDS)
  const timerColor = timeLeft <= 1 ? '#ef4444' : timeLeft <= 2 ? '#f97316' : '#3b82f6'

  // ── Full-screen OUT takeover ─────────────────────────────────────────────
  if (lastResult?.isOut) {
    return (
      <div className="out-screen">
        <div className="out-word">OUT!</div>
        <p className="out-sub">Both picked <strong>{lastResult.batsmanPick}</strong></p>
        <p className="out-hint">Next up…</p>
      </div>
    )
  }

  return (
    <div className="ballscreen">
      <h2 className="ballscreen-heading">🏏 Hand Cricket</h2>

      {/* ── Ball dots ─────────────────────────────────────────────────────── */}
      <div className="ball-dots">
        {Array.from({ length: BALLS_PER_OVER }, (_, i) => {
          const played  = i < ball - 1
          const current = i === ball - 1
          return (
            <span
              key={i}
              className={`ball-dot ${
                played  ? 'ball-dot--played'
                : current ? 'ball-dot--current'
                : 'ball-dot--future'
              }`}
            >
              {played ? '●' : current ? '◉' : '○'}
            </span>
          )
        })}
      </div>

      {/* ── Score / Target ────────────────────────────────────────────────── */}
      <div className="score-row">
        <div className="score-box">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        {target != null && (
          <div className="score-box">
            <span className="score-label">Target</span>
            <span className="score-value score-value--target">{target + 1}</span>
          </div>
        )}
      </div>

      {/* ── Role label ────────────────────────────────────────────────────── */}
      <p className="role-label">
        {isBatsman ? '🏏 Batting' : '🎯 Bowling'}
        <span className="role-separator"> · </span>
        <span className="role-names">{batsmanName} vs {bowlerName}</span>
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
        <div className="result-box" style={{ borderColor: resultDisplay.color }}>
          <p className="result-headline" style={{ color: resultDisplay.color }}>
            {resultDisplay.headline}
          </p>
          <p className="result-sub">{resultDisplay.sub}</p>
        </div>
      ) : myPick === null ? (
        <div className="btn-grid">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} className="num-btn" onClick={() => handlePick(n)}>
              {n}
            </button>
          ))}
        </div>
      ) : (
        <div className="waiting-pick-box">
          <p className="picked-text">
            You picked <strong className="pick-highlight">{myPick}</strong>
          </p>
          <p className="waiting-text">Waiting for opponent…</p>
        </div>
      )}
    </div>
  )
}
