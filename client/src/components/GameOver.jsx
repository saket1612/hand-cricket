import { useState } from 'react'
import './GameOver.css'

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
    <div className="screen">
      <h1 className="screen-title">🏏 Hand Cricket</h1>
      <div className="gameover-card">
        <div className="gameover-headline" style={{ color: headlineColor }}>{headline}</div>

        {!isTie && (
          <p className="gameover-winner">{winnerName} wins this match!</p>
        )}

        <div className="score-row-go">
          <ScoreChip
            name={myName ?? 'You'}
            score={myScore}
            highlight={isWinner}
          />
          <span className="score-vs">vs</span>
          <ScoreChip
            name={opponentName ?? 'Opponent'}
            score={oppScore}
            highlight={!isTie && !isWinner}
          />
        </div>

        {!iWantRematch ? (
          <button className="btn-play-again" onClick={handlePlayAgain}>
            Play Again
          </button>
        ) : bothWant ? (
          <p className="rematch-waiting-text">Starting rematch…</p>
        ) : (
          <div className="rematch-waiting-box">
            <p className="rematch-waiting-text">Waiting for {opponentName ?? 'opponent'}…</p>
            {opponentWantsRematch && (
              <p className="rematch-ready-text">Opponent is ready! ✅</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreChip({ name, score, highlight }) {
  return (
    <div
      className={`score-chip${highlight ? ' score-chip--winner' : ''}`}
    >
      <span className="chip-name">{name}</span>
      <span className="chip-score">{score}</span>
    </div>
  )
}
