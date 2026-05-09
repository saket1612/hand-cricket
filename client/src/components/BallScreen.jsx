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
  let myActualPick  = null
  let oppPick       = null

  if (lastResult) {
    myActualPick = isBatsman ? lastResult.batsmanPick : lastResult.bowlerPick
    oppPick      = isBatsman ? lastResult.bowlerPick  : lastResult.batsmanPick

    if (lastResult.isOut) {
      resultDisplay = { headline: '💥 OUT!', color: '#ef4444' }
    } else if (lastResult.runs === 0) {
      resultDisplay = { headline: '🚫 No runs', color: '#64748b' }
    } else {
      resultDisplay = {
        headline: `+${lastResult.runs} run${lastResult.runs !== 1 ? 's' : ''}! 🏏`,
        color: '#22c55e',
      }
    }
  }

  const dashOffset = CIRC * (1 - timeLeft / BALL_TIMER_SECONDS)
  const timerColor = timeLeft <= 1 ? '#ef4444' : timeLeft <= 2 ? '#f97316' : '#3b82f6'

  // ── Full-screen OUT takeover ─────────────────────────────────────────────
  if (lastResult?.isOut) {
    return (
      <div className="out-screen">
        <div className="out-clash">
          <div className="out-clash-num out-clash-num--left">{lastResult.batsmanPick}</div>
          <div className="out-clash-eq">💥</div>
          <div className="out-clash-num out-clash-num--right">{lastResult.batsmanPick}</div>
        </div>
        <div className="out-word">OUT!</div>
        <p className="out-sub">Both picked <strong>{lastResult.batsmanPick}</strong></p>
        <p className="out-hint">Next up…</p>
      </div>
    )
  }

  return (
    <div className="ballscreen">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="bs-topbar">
        <h2 className="bs-title">🏏 Hand Cricket</h2>
      </div>

      {/* ── Score bar: team cards + ball dots ─────────────────────────────── */}
      <div className="bs-scorebar">
        <div className="bs-team bs-team--bat">
          <span className="bs-team-icon">🏏</span>
          <span className="bs-team-name">{batsmanName}</span>
          <span className="bs-team-score">{score}</span>
          <span className="bs-team-sub">runs</span>
        </div>

        <div className="bs-scorebar-mid">
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
          <span className="bs-vs-badge">VS</span>
        </div>

        <div className="bs-team bs-team--bowl">
          <span className="bs-team-icon">🎯</span>
          <span className="bs-team-name">{bowlerName}</span>
          <span className={`bs-team-score${target != null ? ' bs-team-score--target' : ''}`}>
            {target != null ? target + 1 : '—'}
          </span>
          <span className="bs-team-sub">{target != null ? 'target' : 'bowling'}</span>
        </div>
      </div>

      {/* ── Role pill ─────────────────────────────────────────────────────── */}
      <p className="bs-role-pill">
        {isBatsman ? '🏏 You are batting' : '🎯 You are bowling'}
      </p>

      {/* ── Pitch stage ───────────────────────────────────────────────────── */}
      <div className="bs-pitch">

        {/* State 1: no pick yet — tip + countdown ring */}
        {myPick === null && !lastResult && (
          <>
            <p className="game-tip">⚡ Same number = OUT!</p>
            <svg width="110" height="110" viewBox="0 0 100 100" style={{ display: 'block' }}>
              <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
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
              <text x="50" y="57" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#f1f5f9">
                {timeLeft}
              </text>
            </svg>
          </>
        )}

        {/* States 2 & 3: pick made — animated reveal cards */}
        {(myPick !== null || lastResult) && (
          <div
            key={lastResult ? 'result' : 'waiting'}
            className={`reveal-area ${
              !lastResult        ? '' :
              lastResult.runs === 0 ? 'reveal--zero' :
              isBatsman          ? 'reveal--runs-you' : 'reveal--runs-opp'
            }`}
          >
            <div className={`pick-card pick-card--you${!lastResult ? ' pick-card--locked' : ''}`}>
              <span className="pick-card-label">You</span>
              <span className="pick-card-num">
                {lastResult ? (myActualPick === 0 ? '⏱' : myActualPick) : myPick}
              </span>
            </div>

            <div className="reveal-vs">
              {lastResult && lastResult.runs > 0
                ? <span className="reveal-runs-badge">+{lastResult.runs}</span>
                : <span className="reveal-vs-text">VS</span>
              }
            </div>

            <div className={`pick-card pick-card--opp${!lastResult ? ' pick-card--mystery' : ''}`}>
              <span className="pick-card-label">Opp</span>
              <span className={`pick-card-num${!lastResult ? ' pick-card-num--mystery' : ''}`}>
                {lastResult ? (oppPick === 0 ? '⏱' : oppPick) : '?'}
              </span>
            </div>
          </div>
        )}

        {/* State 2: waiting hint */}
        {myPick !== null && !lastResult && (
          <p className="reveal-waiting-text">Waiting for opponent…</p>
        )}

        {/* State 3: result banner */}
        {lastResult && (
          <div className="result-banner" style={{ color: resultDisplay.color }}>
            {resultDisplay.headline}
          </div>
        )}
      </div>

      {/* ── Number grid (State 1 only) ────────────────────────────────────── */}
      {myPick === null && !lastResult && (
        <div className="btn-grid">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} className="num-btn" onClick={() => handlePick(n)}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
