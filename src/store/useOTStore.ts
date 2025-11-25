import { create } from 'zustand'
import { Operation, generateOpId, compose, transform, isConflict } from '../utils/ot'

interface OTState {
  localVersion: number
  serverVersion: number
  localQueue: Operation[]
  serverQueue: Operation[]
  history: Operation[]
  currentBranch: string
  branches: Record<string, Operation[]>
  isOnline: boolean
  
  addLocalOperation: (op: Omit<Operation, 'id' | 'timestamp' | 'version'>) => Operation
  addServerOperation: (op: Operation) => void
  applyOperation: (op: Operation) => void
  processQueues: () => void
  transformOperations: (localOp: Operation, serverOp: Operation) => { transformedLocal: Operation; transformedServer: Operation }
  mergeBranches: (branchId: string) => void
  switchBranch: (branchId: string) => void
  setOnlineStatus: (online: boolean) => void
  syncWithServer: () => Operation[]
}

export const useOTStore = create<OTState>((set, get) => ({
  localVersion: 0,
  serverVersion: 0,
  localQueue: [],
  serverQueue: [],
  history: [],
  currentBranch: 'main',
  branches: { main: [] },
  isOnline: true,

  addLocalOperation: (opData) => {
    const { localVersion, localQueue, history, currentBranch, branches } = get()
    
    const op: Operation = {
      ...opData,
      id: generateOpId(),
      timestamp: Date.now(),
      version: localVersion + 1
    }

    const newLocalQueue = [...localQueue, op]
    const newHistory = [...history, op]
    const newBranches = { ...branches }
    newBranches[currentBranch] = [...newBranches[currentBranch], op]

    set({
      localQueue: newLocalQueue,
      history: newHistory,
      branches: newBranches,
      localVersion: op.version
    })

    return op
  },

  addServerOperation: (op) => {
    const { serverQueue, serverVersion } = get()
    
    // Only add if we haven't seen this operation before
    const isDuplicate = serverQueue.some((existingOp) => existingOp.id === op.id)
    if (isDuplicate) return

    const newServerQueue = [...serverQueue, op]
    
    set({
      serverQueue: newServerQueue,
      serverVersion: Math.max(serverVersion, op.version)
    })

    // Process queues immediately if online
    get().processQueues()
  },

  applyOperation: (op) => {
    // This will be called by the canvas component to actually apply the operation
    const { history, currentBranch, branches } = get()
    const newHistory = [...history, op]
    const newBranches = { ...branches }
    newBranches[currentBranch] = [...newBranches[currentBranch], op]

    set({
      history: newHistory,
      branches: newBranches
    })
  },

  processQueues: () => {
    const { localQueue, serverQueue, localVersion, serverVersion } = get()
    
    if (localQueue.length === 0 || serverQueue.length === 0) return

    let updatedLocalQueue = [...localQueue]
    let updatedServerQueue = [...serverQueue]
    let updatedLocalVersion = localVersion
    let updatedServerVersion = serverVersion

    // Process each server operation against local operations
    for (let i = 0; i < updatedServerQueue.length; i++) {
      const serverOp = updatedServerQueue[i]

      for (let j = 0; j < updatedLocalQueue.length; j++) {
        const localOp = updatedLocalQueue[j]

        if (isConflict(localOp, serverOp)) {
          // Transform both operations
          const { op1: transformedLocal, op2: transformedServer } = transform(localOp, serverOp)
          
          // Update the queues with transformed operations
          updatedLocalQueue[j] = transformedLocal
          updatedServerQueue[i] = transformedServer
        }
      }

      // Apply server operation
      get().applyOperation(updatedServerOp)
      updatedServerVersion = Math.max(updatedServerVersion, updatedServerOp.version)
    }

    // Apply all local operations
    for (const localOp of updatedLocalQueue) {
      get().applyOperation(localOp)
      updatedLocalVersion = Math.max(updatedLocalVersion, localOp.version)
    }

    set({
      localQueue: [],
      serverQueue: [],
      localVersion: updatedLocalVersion,
      serverVersion: updatedServerVersion
    })
  },

  transformOperations: (localOp, serverOp) => {
    const { op1: transformedLocal, op2: transformedServer } = transform(localOp, serverOp)
    return { transformedLocal, transformedServer }
  },

  mergeBranches: (branchId) => {
    const { branches, currentBranch, history } = get()
    const branchToMerge = branches[branchId]
    if (!branchToMerge) return

    const mainBranch = branches[currentBranch] || []
    let mergedHistory = [...mainBranch]

    // Merge operations from the branch
    for (const op of branchToMerge) {
      const lastOp = mergedHistory[mergedHistory.length - 1]
      if (lastOp) {
        const composed = compose(lastOp, op)
        if (composed) {
          mergedHistory[mergedHistory.length - 1] = composed
        } else {
          mergedHistory.push(op)
        }
      } else {
        mergedHistory.push(op)
      }
    }

    const newBranches = { ...branches }
    newBranches[currentBranch] = mergedHistory

    set({
      branches: newBranches,
      history: mergedHistory
    })
  },

  switchBranch: (branchId) => {
    const { branches } = get()
    const branch = branches[branchId]
    if (!branch) return

    set({
      currentBranch: branchId,
      history: branch,
      localVersion: branch.length,
      serverVersion: branch.length
    })
  },

  setOnlineStatus: (online) => {
    set({ isOnline: online })
    
    // If coming back online, process any pending queues
    if (online) {
      get().processQueues()
    }
  },

  syncWithServer: () => {
    const { localQueue, serverQueue, history } = get()
    
    // Return all operations that need to be synced
    return [...localQueue, ...serverQueue, ...history]
  }
}))
