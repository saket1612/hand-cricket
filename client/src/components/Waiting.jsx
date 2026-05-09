import '../css/Waiting.css'

export default function Waiting({ roomCode, opponentName }) {
  const joined = Boolean(opponentName)

  return (
    <div className="screen">
      <h1 className="screen-title">🏏 Hand Cricket</h1>

      <div className="waiting-card">
        {!joined ? (
          <>
            <p className="sub">Share this code with your friend</p>
            <div className="code-box">{roomCode}</div>
            <div className="spinner" />
            <p className="hint">Waiting for opponent to join…</p>
          </>
        ) : (
          <>
            <p className="sub">Opponent joined!</p>
            <p className="opponent-name">{opponentName}</p>
            <div className="spinner" />
            <p className="hint">Starting game…</p>
          </>
        )}
      </div>
    </div>
  )
}
