import { createContext, useContext, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

// Single socket instance shared across the app
let socketInstance = null

function getSocket() {
  if (!socketInstance) {
    socketInstance = io({
      // In dev, Vite proxy forwards /socket.io → localhost:3001
      // In production, same origin
      autoConnect: true,
    })
  }
  return socketInstance
}

export function SocketProvider({ children }) {
  const socketRef = useRef(getSocket())

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
