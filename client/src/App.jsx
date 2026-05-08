import { useState, useEffect } from 'react'
import { SocketProvider, useSocket } from './hooks/useSocket.jsx'
import Lobby from './components/Lobby'
import Waiting from './components/Waiting'
import Toss from './components/Toss'
import BallScreen from './components/BallScreen'
import GameOver from './components/GameOver'

// ─── Inner app — has access to socket context ─────────────────────────────────
function Game() {
  const socket = useSocket()

  // phase: 'lobby' | 'waiting' | 'toss' | 'playing' | 'innings_break' | 'game_over'
  const [phase, setPhase] = useState('lobby')
  const [gameState, setGameState] = useState({
    roomCode:       null,
    myName:         null,
    opponentName:   null,
    batsman:        null,
    bowler:         null,
    batsmanName:    null,
    bowlerName:     null,
    ball:           1,
    ballKey:        0,     // increments on every ball_start → forces BallScreen remount
    innings:        1,
    score:          0,
    target:         null,
    firstScore:     null,
    newBatsman:     null,
    newBatsmanName: null,
    lastResult:     null,
    winner:         null,
    winnerName:     null,
    scores:         null,
  })

  useEffect(() => {
    // ── room_created ────────────────────────────────────────────────────────
    socket.on('room_created', ({ code }) => {
      setGameState(s => ({ ...s, roomCode: code }))
      setPhase('waiting')
    })

    // ── player_joined ───────────────────────────────────────────────────────
    socket.on('player_joined', ({ opponentName }) => {
      setGameState(s => ({ ...s, opponentName }))
      // If we're still waiting (player 1), stay on waiting screen briefly;
      // game_start will move us forward
    })

    // ── game_start ──────────────────────────────────────────────────────────
    // Fires for both first game and rematch — always reset game state
    socket.on('game_start', ({ batsman, bowler, batsmanName, bowlerName }) => {
      setGameState(s => ({
        ...s,
        batsman,
        bowler,
        batsmanName,
        bowlerName,
        ball:                 1,
        ballKey:              s.ballKey + 1,
        innings:              1,
        score:                0,
        target:               null,
        firstScore:           null,
        lastResult:           null,
        winner:               null,
        winnerName:           null,
        scores:               null,
        opponentWantsRematch: false,
      }))
      setPhase('toss')
    })

    // ── ball_start ──────────────────────────────────────────────────────────
    socket.on('ball_start', ({ ball, score, target }) => {
      setGameState(s => ({
        ...s,
        ball,
        score,
        target:     target ?? s.target,
        lastResult: null,
        ballKey:    s.ballKey + 1,   // remounts BallScreen for fresh timer + state
      }))
      setPhase('playing')
    })

    // ── ball_result ─────────────────────────────────────────────────────────
    socket.on('ball_result', ({ batsmanPick, bowlerPick, runs, isOut, score }) => {
      setGameState(s => ({
        ...s,
        score,
        lastResult: { batsmanPick, bowlerPick, runs, isOut },
      }))
      // Stay on 'playing' — BallScreen shows the result overlay
    })

    // ── innings_switch ──────────────────────────────────────────────────────
    socket.on('innings_switch', ({ firstScore, newBatsman, newBatsmanName }) => {
      setGameState(s => ({
        ...s,
        firstScore,
        newBatsman,
        newBatsmanName,
        target:      firstScore,
        score:       0,
        lastResult:  null,
        innings:     2,
        // Swap roles so BallScreen knows who is batting in innings 2
        batsman:     newBatsman,
        bowler:      s.batsman,
        batsmanName: newBatsmanName,
        bowlerName:  s.batsmanName,
      }))
      setPhase('innings_break')
    })

    // ── game_over ───────────────────────────────────────────────────────────
    socket.on('game_over', ({ winner, winnerName, scores }) => {
      setGameState(s => ({ ...s, winner, winnerName, scores }))
      setPhase('game_over')
    })

    // ── opponent_play_again ─────────────────────────────────────────────────
    socket.on('opponent_play_again', () => {
      // Notify GameOver that opponent already clicked — update its UI
      setGameState(s => ({ ...s, opponentWantsRematch: true }))
    })

    // ── game_error ──────────────────────────────────────────────────────────
    socket.on('game_error', ({ message }) => {
      alert(message)
      // Reset to lobby on fatal errors (e.g. opponent disconnected)
      setPhase('lobby')
      setGameState(s => ({ ...s, roomCode: null, opponentName: null }))
    })

    return () => {
      socket.off('room_created')
      socket.off('player_joined')
      socket.off('game_start')
      socket.off('ball_start')
      socket.off('ball_result')
      socket.off('innings_switch')
      socket.off('game_over')
      socket.off('opponent_play_again')
      socket.off('game_error')
    }
  }, [socket])

  function handlePlayAgain() {
    socket.emit('play_again')
  }

  // ── Phase router ────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <Lobby
        onRoomCreated={(name) => setGameState(s => ({ ...s, myName: name }))}
        onRoomJoined={(name)  => setGameState(s => ({ ...s, myName: name }))}
      />
    )
  }

  if (phase === 'waiting') {
    return <Waiting roomCode={gameState.roomCode} opponentName={gameState.opponentName} />
  }

  if (phase === 'toss') {
    return <Toss gameState={gameState} />
  }

  if (phase === 'playing') {
    return <BallScreen key={gameState.ballKey} gameState={gameState} />
  }

  if (phase === 'innings_break') {
    return (
      <div style={sharedStyles.container}>
        <h1 style={sharedStyles.title}>🏏 Hand Cricket</h1>
        <div style={sharedStyles.card}>
          <p style={sharedStyles.sub}>End of 1st Innings</p>
          <div style={sharedStyles.bigNumber}>{gameState.firstScore}</div>
          <p style={sharedStyles.detail}>1st innings score</p>
          <p style={sharedStyles.highlight}>
            {gameState.newBatsmanName} needs{' '}
            <strong>{(gameState.firstScore ?? 0) + 1}</strong> to win
          </p>
          <p style={sharedStyles.hint}>Starting 2nd innings…</p>
        </div>
      </div>
    )
  }

  if (phase === 'game_over') {
    return <GameOver gameState={gameState} onPlayAgain={handlePlayAgain} />
  }

  return null
}

const sharedStyles = {
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
  title:     { fontSize: '2.5rem', marginBottom: '2rem', letterSpacing: '0.05em' },
  card: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  sub:       { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  detail:    { color: '#64748b', fontSize: '0.85rem', margin: 0 },
  bigNumber: { fontSize: '4rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 },
  highlight: { color: '#60a5fa', fontSize: '1rem', margin: 0 },
  hint:      { color: '#475569', fontSize: '0.82rem', margin: 0 },
}

// ─── Root — provides socket context ──────────────────────────────────────────
export default function App() {
  return (
    <SocketProvider>
      <Game />
    </SocketProvider>
  )
}
