// OT Operation Types
export const OperationType = { 
  ADD: 'add', 
  REMOVE: 'remove', 
  MODIFY: 'modify', 
  NOOP: 'noop' 
}

// Generate unique operation ID
export const generateOpId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Compose two operations into one
export const compose = (op1, op2) => {
  // If op1 is no-op, return op2
  if (!op1) return op2
  if (!op2) return op1

  // Compose operations on the same object
  if (op1.type === OperationType.ADD && op2.type === OperationType.MODIFY && op1.object?.id === op2.object?.id) {
    return { ...op1, object: op2.object, version: op2.version }
  }

  if (op1.type === OperationType.MODIFY && op2.type === OperationType.MODIFY && op1.object?.id === op2.object?.id) {
    return { ...op2, version: op2.version }
  }

  if (op1.type === OperationType.ADD && op2.type === OperationType.REMOVE && op1.object?.id === op2.objectId) {
    // Add followed by remove is a no-op
    return { ...op1, type: OperationType.NOOP }
  }

  // Default: return op2 (op1 is overridden)
  return op2
}

// Transform two concurrent operations
export const transform = (op1, op2) => {
  // If no conflict, return as is
  if (!isConflict(op1, op2)) {
    return { op1, op2 }
  }

  // Handle conflicts based on operation types
  switch (op1.type) {
    case OperationType.ADD:
      if (op2.type === OperationType.ADD) {
        // Two objects added at the same time - keep both
        return { op1, op2 }
      }
      if (op2.type === OperationType.REMOVE) {
        // Remove on non-existent object - op2 becomes no-op
        const transformedOp2 = { ...op2, type: OperationType.NOOP }
        return { op1, transformedOp2 }
      }
      if (op2.type === OperationType.MODIFY) {
        // Modify on non-existent object - op2 becomes no-op
        const transformedOp2 = { ...op2, type: OperationType.NOOP }
        return { op1, transformedOp2 }
      }
      break

    case OperationType.REMOVE:
      if (op2.type === OperationType.ADD) {
        // Add after remove - keep both (op1 is no-op)
        const transformedOp1 = { ...op1, type: OperationType.NOOP }
        return { transformedOp1, op2 }
      }
      if (op2.type === OperationType.REMOVE) {
        // Two removes - both become no-op
        const transformedOp1 = { ...op1, type: OperationType.NOOP }
        const transformedOp2 = { ...op2, type: OperationType.NOOP }
        return { transformedOp1, transformedOp2 }
      }
      if (op2.type === OperationType.MODIFY) {
        // Modify after remove - op2 becomes no-op
        const transformedOp2 = { ...op2, type: OperationType.NOOP }
        return { op1, transformedOp2 }
      }
      break

    case OperationType.MODIFY:
      if (op2.type === OperationType.ADD) {
        // Add after modify - keep both
        return { op1, op2 }
      }
      if (op2.type === OperationType.REMOVE) {
        // Remove after modify - op1 becomes no-op
        const transformedOp1 = { ...op1, type: OperationType.NOOP }
        return { transformedOp1, op2 }
      }
      if (op2.type === OperationType.MODIFY) {
        // Two modifications on the same object
        // Use last-write-wins or merge based on properties
        // For simplicity, use last-write-wins based on timestamp
        if (op1.timestamp > op2.timestamp) {
          const transformedOp2 = { ...op2, type: OperationType.NOOP }
          return { op1, transformedOp2 }
        } else {
          const transformedOp1 = { ...op1, type: OperationType.NOOP }
          return { transformedOp1, op2 }
        }
      }
      break
  }

  // Default: no transformation needed
  return { op1, op2 }
}

// Check if two operations conflict
export const isConflict = (op1, op2) => {
  if (!op1 || !op2) return false

  // Check if operations affect the same object
  const op1ObjectId = op1.object?.id || op1.objectId
  const op2ObjectId = op2.object?.id || op2.objectId

  if (op1ObjectId && op2ObjectId && op1ObjectId === op2ObjectId) {
    return true
  }

  // Check for potential conflicts in object creation
  if (op1.type === OperationType.ADD && op2.type === OperationType.ADD) {
    // Two objects added at the same time - could conflict if they have the same ID
    return op1.object?.id === op2.object?.id
  }

  return false
}

// Apply an operation to the canvas state
export const applyOperation = (op, state) => {
  if (!op || op.type === OperationType.NOOP) return state

  const newState = JSON.parse(JSON.stringify(state))

  switch (op.type) {
    case OperationType.ADD:
      if (op.object) {
        newState.objects.push(op.object)
      }
      break

    case OperationType.REMOVE:
      if (op.objectId) {
        newState.objects = newState.objects.filter((obj) => obj.id !== op.objectId)
      }
      break

    case OperationType.MODIFY:
      if (op.object && op.object.id) {
        const index = newState.objects.findIndex((obj) => obj.id === op.object.id)
        if (index !== -1) {
          newState.objects[index] = op.object
        }
      }
      break
  }

  return newState
}
