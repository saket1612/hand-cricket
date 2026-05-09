import { useState } from 'react'
import '../css/Waiting.css'

export default function Waiting({ roomCode, opponentName }) {
  const joined = Boolean(opponentName)
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard?.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="screen">
      <h1 className="screen-title">🏏 Hand Cricket</h1>

      <div className="waiting-card">
        {!joined ? (
          <>
            <p className="sub">Share this code with your friend</p>
            <div className="code-box-wrap">
              <div className="code-box" onClick={copyCode}>{roomCode}</div>
              <p className={`code-copy-hint${copied ? ' code-copy-hint--copied' : ''}`}>
                {copied ? '✓ Copied!' : 'Tap to copy'}
              </p>
            </div>
            <div className="spinner" />
            <p className="hint">Waiting for opponent to join…</p>
          </>
        ) : (
          <>
            <p className="sub">Opponent joined! 🎉</p>
            <p className="opponent-name">{opponentName}</p>
            <div className="spinner" />
            <p className="hint">Starting game…</p>
          </>
        )}
      </div>
    </div>
  )
}
