import { fabric } from 'fabric'

export type ToolType = 'brush' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text' | 'select'

export type ShapeType = 'rect' | 'circle' | 'arrow' | 'line'

export interface DrawingState {
  tool: ToolType
  brushSize: number
  brushColor: string
  fillColor: string
  strokeColor: string
  fontSize: number
  fontFamily: string
  isDrawing: boolean
  currentLayer: number
  layers: Layer[]
  history: HistoryItem[]
  historyIndex: number
  isCollaborating: boolean
  users: User[]
}

export interface Layer {
  id: number
  name: string
  visible: boolean
  locked: boolean
  objects: fabric.Object[]
}

export interface HistoryItem {
  type: 'add' | 'remove' | 'modify'
  objects: fabric.Object[]
  previousState?: fabric.Object[]
}

export interface User {
  id: string
  name: string
  color: string
}

export interface SocketEvent {
  type: 'objectAdded' | 'objectRemoved' | 'objectModified' | 'history' | 'layerChange'
  data: any
  userId: string
}

export interface Point {
  x: number
  y: number
}

// OT Types
export type OperationType = 'objectAdded' | 'objectRemoved' | 'objectModified'

export interface Operation {
  id: string
  type: OperationType
  object?: any
  objectId?: string
  timestamp: number
  userId: string | undefined
  version: number
}

export interface OTState {
  currentVersion: number
  localQueue: Operation[]
  serverQueue: Operation[]
  history: Operation[]
  lastAppliedOperation: Operation | null
}

export interface OTResult {
  op1: Operation
  op2: Operation
}
