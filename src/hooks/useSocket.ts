import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useWhiteboardStore } from '../store/useWhiteboardStore'
import { useOTStore } from '../store/useOTStore'
import { Operation } from '../types'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const { 
    addUser, 
    removeUser, 
    updateUsers, 
    setIsCollaborating,
    setCanvasObjects,
    setHistory
  } = useWhiteboardStore()

  const { 
    addLocalOperation, 
    addServerOperation, 
    processQueues,
    applyOperation,
    currentVersion
  } = useOTStore()

  useEffect(() => {
    const connectSocket = () => {
      setIsReconnecting(true)
      
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false // We handle reconnection manually
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
        setIsReconnecting(false)
        setReconnectAttempts(0)
        setIsCollaborating(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
        setIsCollaborating(false)
        handleReconnect()
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })

      socket.on('init', (data) => {
        console.log('Received initial data:', data)
        updateUsers(data.users)
        
        // Initialize canvas with server state
        if (data.whiteboard?.objects) {
          setCanvasObjects(data.whiteboard.objects)
        }
        if (data.whiteboard?.history) {
          setHistory(data.whiteboard.history)
        }
        
        // Update OT store with server version
        useOTStore.setState({ currentVersion: data.currentVersion })
      })

      socket.on('userJoined', (user) => {
        console.log('User joined:', user)
        addUser(user)
      })

      socket.on('userLeft', (userId) => {
        console.log('User left:', userId)
        removeUser(userId)
      })

      socket.on('draw', (data) => {
        console.log('Received draw operation:', data)
        
        // Add server operation to OT store
        addServerOperation(data.operation)
        
        // Process queues to handle conflicts
        processQueues()
        
        // Update local version
        useOTStore.setState({ currentVersion: data.serverVersion })
      })

      socket.on('drawAck', (data) => {
        console.log('Received draw acknowledgment:', data)
        
        // Remove acknowledged operation from local queue
        useOTStore.setState(prev => ({
          localQueue: prev.localQueue.filter(op => op.id !== data.opId)
        }))
        
        // Update local version
        useOTStore.setState({ currentVersion: data.serverVersion })
      })

      socket.on('historySync', (data) => {
        console.log('Received history sync:', data)
        
        // Apply all missing operations
        data.operations.forEach((op: Operation) => {
          addServerOperation(op)
        })
        
        // Process queues
        processQueues()
        
        // Update version
        useOTStore.setState({ currentVersion: data.currentVersion })
      })

      socketRef.current = socket

      return () => {
        socket.close()
      }
    }

    const handleReconnect = () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const nextAttempt = reconnectAttempts + 1
        setReconnectAttempts(nextAttempt)
        
        // Exponential backoff
        const delay = Math.pow(2, nextAttempt) * 1000
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})`)
        
        setTimeout(connectSocket, delay)
      } else {
        console.error('Max reconnection attempts reached')
        setIsReconnecting(false)
      }
    }

    const cleanup = connectSocket()

    return () => {
      cleanup()
    }
  }, [reconnectAttempts, addUser, removeUser, updateUsers, setIsCollaborating])

  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }

  const off = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }

  const syncHistory = (fromVersion: number) => {
    emit('syncHistory', fromVersion)
  }

  const sendOperation = (operation: Operation) => {
    // Add to local queue
    addLocalOperation(operation)
    
    // Send to server
    emit('draw', {
      operation,
      clientVersion: currentVersion
    })
  }

  return { 
    emit, 
    on, 
    off, 
    isConnected,
    isReconnecting,
    syncHistory,
    sendOperation 
  }
}

export default useSocket
