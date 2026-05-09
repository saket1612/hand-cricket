import { useSocket } from '../hooks/useSocket.jsx'
import '../css/Toss.css'

export default function Toss({ gameState }) {
  const socket = useSocket()
  const { batsman, myName, opponentName } = gameState
  const isBatsman  = socket.id === batsman
  const batsmanName = isBatsman ? myName : opponentName
  const bowlerName  = isBatsman ? opponentName : myName

  return (
    <div className="screen">
      <h1 className="screen-title">🏏 Hand Cricket</h1>
      <div className="card">
        <p className="sub">Toss complete!</p>
        <div className="toss-result">
          {isBatsman ? '🏏 You bat first!' : '🎯 You bowl first!'}
        </div>
        <p className="detail">
          <strong>{batsmanName}</strong> bats &nbsp;·&nbsp; <strong>{bowlerName}</strong> bowls
        </p>
        <p className="hint">Get ready…</p>
      </div>
    </div>
  )
}
