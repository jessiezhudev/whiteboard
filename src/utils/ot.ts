import { fabric } from 'fabric'

// OT Operation Types
export type OperationType = 'add' | 'remove' | 'modify' | 'noop'

export interface Operation {
  id: string
  type: OperationType
  userId: string
  timestamp: number
  version: number
  object?: fabric.Object | any
  objectId?: string
  previousState?: fabric.Object | any
}

export interface OTResult {
  op1: Operation
  op2: Operation
}

// Generate unique operation ID
export const generateOpId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Compose two operations into one
export const compose = (op1: Operation, op2: Operation): Operation => {
  // If op1 is no-op, return op2
  if (!op1) return op2
  if (!op2) return op1

  // Compose operations on the same object
  if (op1.type === 'add' && op2.type === 'modify' && op1.object?.id === op2.object?.id) {
    return { ...op1, object: op2.object, version: op2.version }
  }

  if (op1.type === 'modify' && op2.type === 'modify' && op1.object?.id === op2.object?.id) {
    return { ...op2, version: op2.version }
  }

  if (op1.type === 'add' && op2.type === 'remove' && op1.object?.id === op2.objectId) {
    // Add followed by remove is a no-op
    return { ...op1, type: 'noop' }
  }

  // Default: return op2 (op1 is overridden)
  return op2
}

// Transform two concurrent operations
export const transform = (op1: Operation, op2: Operation): OTResult => {
  // If no conflict, return as is
  if (!isConflict(op1, op2)) {
    return { op1, op2 }
  }

  // Handle conflicts based on operation types
  switch (op1.type) {
    case 'add':
      if (op2.type === 'add') {
        // Two objects added at the same time - keep both
        return { op1, op2 }
      }
      if (op2.type === 'remove') {
        // Remove on non-existent object - op2 becomes no-op
        return { op1, { ...op2, type: 'noop' } }
      }
      if (op2.type === 'modify') {
        // Modify on non-existent object - op2 becomes no-op
        return { op1, { ...op2, type: 'noop' } }
      }
      break

    case 'remove':
      if (op2.type === 'add') {
        // Add after remove - keep both (op1 is no-op)
        return { { ...op1, type: 'noop' }, op2 }
      }
      if (op2.type === 'remove') {
        // Two removes - both become no-op
        return {
          { ...op1, type: 'noop' },
          { ...op2, type: 'noop' }
        }
      }
      if (op2.type === 'modify') {
        // Modify after remove - op2 becomes no-op
        return { op1, { ...op2, type: 'noop' } }
      }
      break

    case 'modify':
      if (op2.type === 'add') {
        // Add after modify - keep both
        return { op1, op2 }
      }
      if (op2.type === 'remove') {
        // Remove after modify - op1 becomes no-op
        return { { ...op1, type: 'noop' }, op2 }
      }
      if (op2.type === 'modify') {
        // Two modifications on the same object
        // Use last-write-wins or merge based on properties
        // For simplicity, use last-write-wins based on timestamp
        if (op1.timestamp > op2.timestamp) {
          return { op1, { ...op2, type: 'noop' } }
        } else {
          return { { ...op1, type: 'noop' }, op2 }
        }
      }
      break
  }

  // Default: no transformation needed
  return { op1, op2 }
}

// Check if two operations conflict
export const isConflict = (op1: Operation, op2: Operation): boolean => {
  if (!op1 || !op2) return false

  // Check if operations affect the same object
  const op1ObjectId = op1.object?.id || op1.objectId
  const op2ObjectId = op2.object?.id || op2.objectId

  if (op1ObjectId && op2ObjectId && op1ObjectId === op2ObjectId) {
    return true
  }

  // Check for potential conflicts in object creation
  if (op1.type === 'add' && op2.type === 'add') {
    // Two objects added at the same time - could conflict if they have the same ID
    return op1.object?.id === op2.object?.id
  }

  return false
}

// Apply an operation to the canvas state
export const applyOperation = (op: Operation, state: any): any => {
  if (!op || op.type === 'noop') return state

  const newState = JSON.parse(JSON.stringify(state))

  switch (op.type) {
    case 'add':
      if (op.object) {
        newState.objects.push(op.object)
      }
      break

    case 'remove':
      if (op.objectId) {
        newState.objects = newState.objects.filter((obj: any) => obj.id !== op.objectId)
      }
      break

    case 'modify':
      if (op.object && op.object.id) {
        const index = newState.objects.findIndex((obj: any) => obj.id === op.object.id)
        if (index !== -1) {
          newState.objects[index] = op.object
        }
      }
      break
  }

  return newState
}
