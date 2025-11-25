import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { generateOpId, compose, transform, isConflict } from '../src/utils/ot.js'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const users = new Map()
const whiteboardState = {
  objects: [],
  layers: [],
  history: [],
  currentVersion: 0,
  operations: new Map() // key: opId, value: operation
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

// Apply operation to server state
const applyOperationToState = (op) => {
  switch (op.type) {
    case 'objectAdded':
      whiteboardState.objects.push(op.object)
      break
    case 'objectRemoved':
      whiteboardState.objects = whiteboardState.objects.filter(obj => obj.id !== op.objectId)
      break
    case 'objectModified':
      const index = whiteboardState.objects.findIndex(obj => obj.id === op.object.id)
      if (index !== -1) {
        whiteboardState.objects[index] = op.object
      }
      break
  }

  // Add to history
  whiteboardState.history.push(op)
  whiteboardState.currentVersion = Math.max(whiteboardState.currentVersion, op.version)
  whiteboardState.operations.set(op.id, op)
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Generate random username and color
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const username = `User ${socket.id.slice(-4)}`
  
  users.set(socket.id, { id: socket.id, name: username, color: randomColor })

  // Send current whiteboard state to new user
  socket.emit('init', {
    users: Array.from(users.values()),
    whiteboard: whiteboardState,
    currentVersion: whiteboardState.currentVersion
  })

  // Notify all users about new connection
  socket.broadcast.emit('userJoined', { id: socket.id, name: username, color: randomColor })

  // Handle drawing events with OT
  socket.on('draw', (data) => {
    console.log('Received draw operation:', data)
    
    let operation = data.operation
    const clientVersion = data.clientVersion

    // Check for conflicts with existing operations
    const conflictingOps = []
    whiteboardState.history.forEach((existingOp) => {
      if (existingOp.version > clientVersion && isConflict(existingOp, operation)) {
        conflictingOps.push(existingOp)
      }
    })

    // Transform operation against conflicting operations
    for (const conflictingOp of conflictingOps) {
      const { op1: transformedClient, op2: transformedServer } = transform(operation, conflictingOp)
      operation = transformedClient
    }

    // Update operation version
    operation.version = whiteboardState.currentVersion + 1

    // Apply to server state
    applyOperationToState(operation)

    // Broadcast to all other clients
    socket.broadcast.emit('draw', {
      operation,
      userId: socket.id,
      serverVersion: whiteboardState.currentVersion
    })

    // Acknowledge to sender
    socket.emit('drawAck', {
      opId: operation.id,
      serverVersion: whiteboardState.currentVersion
    })
  })

  // Handle history sync request
  socket.on('syncHistory', (fromVersion) => {
    const operationsToSync = whiteboardState.history.filter(op => op.version > fromVersion)
    socket.emit('historySync', {
      operations: operationsToSync,
      currentVersion: whiteboardState.currentVersion
    })
  })

  // Handle layer events
  socket.on('layer', (data) => {
    whiteboardState.layers = data.layers
    socket.broadcast.emit('layer', { ...data, userId: socket.id })
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    users.delete(socket.id)
    socket.broadcast.emit('userLeft', socket.id)
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})
