# Hand Cricket — Online 2-Player Game: Full Plan

## Overview
A real-time 2-player hand cricket game with room codes.  
- **Frontend**: React + Vite (`client/`)
- **Backend**: Node.js + Express + Socket.io (`server/`)
- **No DB**: Game state lives in server memory
- **Deployment**: Single service on Render (Node serves React build)

---

## Game Rules
- 6 balls per innings, each player picks a number 1–6
- Same number picked by batsman and bowler = **OUT** (innings ends)
- Different number = batsman's number added to score
- **Exception**: Both pick 0 (timeout) = 0 runs, no OUT
- Each ball has a **5-second server-driven timer**; no pick = treated as 0
- Random toss decides who bats first
- Second innings: batsman knows the target; innings ends early if target beaten
- Whoever scores highest wins

---

## How Players Connect
1. Player 1 enters name → clicks "Create Room" → gets a 6-char code (e.g. `ZX4K9A`)
2. Player 2 enters name + code → joins the room
3. Server does the toss and notifies both players

## Each Ball Flow
1. Both players see 6 buttons (1–6) + a 5-second countdown timer
2. First to pick sees "Waiting for opponent..."
3. Once **both** submit (or 5s elapses) → server resolves:
   - Same number → **OUT**
   - Both 0 (timeout) → 0 runs, no out
   - Different → batsman's number added to score
4. Result shown for ~2 seconds, then next ball begins automatically

---

## Phases

### ✅ Phase 1 — Project Structure (DONE)
**Files created:**
- `package.json` — root npm workspaces (client + server)
- `.gitignore`
- `render.yaml` — deployment config skeleton
- `client/package.json` — React, Vite, socket.io-client
- `client/vite.config.js` — proxies `/socket.io` → localhost:3001 in dev
- `client/index.html`
- `client/src/main.jsx` — React entry point
- `client/src/App.jsx` — placeholder
- `server/package.json` — Express, Socket.io, cors
- `server/index.js` — placeholder (health endpoint + socket logs)

**To run locally after Phase 1:**
```bash
# Terminal 1 — server
npm run dev:server

# Terminal 2 — client
npm run dev:client
```

---

### Phase 2 — Server: Game Logic
**File:** `server/gameManager.js`

Pure in-memory state — no sockets here, just plain functions.  
`Map<roomCode, GameRoom>` stores all active games.

**Functions to implement:**
- `createRoom(socketId, playerName)` → generates 6-char code, stores room
- `joinRoom(code, socketId, playerName)` → validates code, adds second player
- `doToss(roomCode)` → randomly picks first batsman
- `submitPick(roomCode, socketId, number)` → stores pick, returns `bothPicked`
- `resolveBall(roomCode)` → applies rules, advances ball/innings
- `swapInnings(roomCode)` → switches batsman/bowler for second innings
- `checkGameOver(roomCode)` → returns winner if game is done
- `getRoom(roomCode)` → returns current room state

**Room state shape:**
```js
{
  code: 'ZX4K9A',
  players: [
    { id: socketId, name: 'Alice', score: 0 },
    { id: socketId, name: 'Bob',   score: 0 },
  ],
  batsman: socketId,   // who is currently batting
  bowler: socketId,    // who is currently bowling
  ball: 1,             // current ball number (1–6)
  innings: 1,          // 1 or 2
  firstInningsScore: null,
  picks: {},           // { [socketId]: number }
  status: 'waiting' | 'toss' | 'playing' | 'innings_break' | 'finished',
  winner: null,
}
```

---

### Phase 3 — Server: Socket.io Events
**File:** `server/index.js` (replace placeholder)

Wire Socket.io events to gameManager functions.  
Server drives the 5-second timer per ball.

**Socket Events:**

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `create_room` | `{ name }` |
| Client → Server | `join_room` | `{ code, name }` |
| Client → Server | `submit_pick` | `{ number }` |
| Server → Client | `room_created` | `{ code }` |
| Server → Client | `player_joined` | `{ opponentName }` |
| Server → Client | `game_start` | `{ batsman, bowler, batsmanName, bowlerName }` |
| Server → Client | `ball_start` | `{ ball, score, target? }` |
| Server → Client | `ball_result` | `{ batsmanPick, bowlerPick, runs, isOut, score }` |
| Server → Client | `innings_switch` | `{ firstScore, newBatsman, newBatsmanName }` |
| Server → Client | `game_over` | `{ winner, winnerName, scores }` |

**Timer logic:**  
On `ball_start`, server calls `setTimeout(5000, resolveBall)`.  
If both players pick early, timer is cleared and ball resolves immediately.

---

### Phase 4 — Frontend: Socket Hook + Lobby
**Files:**
- `client/src/hooks/useSocket.js` — wraps socket.io-client, exposes via React context
- `client/src/App.jsx` — phase router (replaces placeholder)
- `client/src/components/Lobby.jsx` — name input + create/join room
- `client/src/components/Waiting.jsx` — shows room code, spinner

**Game phases (state machine in App.jsx):**
```
lobby → waiting → toss → playing → innings_break → playing → game_over
```

---

### Phase 5 — Frontend: Game Screens
**Files:**
- `client/src/components/Toss.jsx` — brief flash "You bat first!" (2s auto-advance)
- `client/src/components/BallScreen.jsx` — main game screen:
  - Ball counter dots (● ● ● ○ ○ ○)
  - Current score + target (if 2nd innings)
  - 6 number buttons (1–6)
  - 5-second countdown ring timer
  - After pick: buttons disabled, "Waiting for opponent..."
  - Result flash: "You picked 4 | Opponent picked 2 → +4 runs" or "OUT!"
- `client/src/components/GameOver.jsx` — final scores, winner banner, Play Again button

---

### Phase 6 — Deployment
**Changes:**
- Node server serves `client/dist` as static files in production
- `render.yaml` finalized with correct build + start commands
- Build: `npm install && npm run build` → start: `node server/index.js`

**Environment variable:** `PORT` (provided by Render automatically)

---

## Key Decisions
| Decision | Choice |
|---|---|
| Double-timeout (both pick 0) | 0 runs, no OUT |
| Timer authority | Server-driven (keeps both clients in sync) |
| Player names | Asked at Lobby screen |
| Play Again | Stays in same room — both must click, server resets scores and does new toss |
| Ball result display | ~2s then next ball auto-starts |
| Reconnection | Not handled in MVP |
| Database | None — in-memory only |

---

## Local Dev Commands (from project root)
```bash
npm run dev:server    # starts Node on port 3001
npm run dev:client    # starts Vite on port 5173
```
Open http://localhost:5173 in two browser tabs to test multiplayer locally.
