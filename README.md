# 🏏 Hand Cricket

A real-time 2-player hand cricket game played in the browser. Two players join the same room, pick numbers simultaneously each ball, and the classic hand cricket rules apply — matching numbers means OUT!

🔗 **Live:** https://hand-cricket.onrender.com

---

## How to Play

1. One player creates a room and shares the 6-character room code.
2. The other player enters the code to join.
3. A toss decides who bats first.
4. Each ball, both players secretly pick a number (1–6).
   - **Batsman** scores the runs equal to their pick — unless both pick the same number.
   - If both pick the **same number** → **OUT!** Innings ends.
5. After 6 balls (one over) or when the batsman is out, innings switches.
6. The second team chases the target. Whoever scores more wins!
7. Play again in the same room with a rematch vote.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Real-time | Socket.io 4.7 |
| Styling | Plain CSS (separate per component) |
| Deployment | Render (auto-deploy from GitHub) |
| Package management | npm Workspaces |

---

## Project Structure

```
hand-cricket/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── css/             # All component CSS files
│       ├── components/      # React components
│       │   ├── BallScreen.jsx
│       │   ├── GameOver.jsx
│       │   ├── Lobby.jsx
│       │   ├── Toss.jsx
│       │   └── Waiting.jsx
│       ├── hooks/
│       │   └── useSocket.jsx
│       ├── config.js        # Client-side constants
│       ├── App.jsx
│       └── main.jsx
├── server/                  # Node.js backend
│   ├── index.js             # HTTP server + Socket.io events
│   ├── gameManager.js       # Pure game logic (no sockets)
│   ├── config.js            # Server-side constants
│   └── package.json
├── package.json             # npm workspaces root
└── render.yaml              # Render deployment config
```

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 8+

### Install dependencies

```bash
npm install
```

### Run both client and server

Open two terminals:

```bash
# Terminal 1 — backend (port 3001)
npm run dev:server

# Terminal 2 — frontend (port 5173)
npm run dev:client
```

Then open http://localhost:5173 in two browser tabs to test both players.

> The Vite dev server proxies `/socket.io` requests to `localhost:3001` automatically.

### Build for production

```bash
npm run build
```

---

## Game Config

Constants are centralised so you can tweak them in one place:

| File | Constant | Default |
|---|---|---|
| `server/config.js` | `BALL_TIMER_MS` | `3000` (3 seconds) |
| `server/config.js` | `BALLS_PER_OVER` | `6` |
| `client/src/config.js` | `BALL_TIMER_SECONDS` | `3` |
| `client/src/config.js` | `BALLS_PER_OVER` | `6` |

---

## Deployment

The app is deployed on **Render** via `render.yaml`. Every push to the `master` branch triggers an automatic redeploy.

- **Build:** `npm install && npm run build`
- **Start:** `node server/index.js`
- In production, Express serves the built React app as static files and Socket.io runs on the same port.
