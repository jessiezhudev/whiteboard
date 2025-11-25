import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DrawingState, ToolType, Layer, HistoryItem, User } from '../types'

const MAX_HISTORY = 50

const initialState: DrawingState = {
  tool: 'select',
  brushSize: 3,
  brushColor: '#000000',
  fillColor: 'rgba(0, 0, 0, 0)',
  strokeColor: '#000000',
  fontSize: 24,
  fontFamily: 'Arial',
  isDrawing: false,
  currentLayer: 0,
  layers: [
    {
      id: 0,
      name: 'Layer 1',
      visible: true,
      locked: false,
      objects: []
    }
  ],
  history: [],
  historyIndex: -1,
  isCollaborating: false,
  users: []
}

export const useWhiteboardStore = create<DrawingState & {
  setTool: (tool: ToolType) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeColor: (color: string) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setIsDrawing: (isDrawing: boolean) => void
  addLayer: () => void
  removeLayer: (id: number) => void
  setLayerVisible: (id: number, visible: boolean) => void
  setLayerLocked: (id: number, locked: boolean) => void
  moveLayerUp: (id: number) => void
  moveLayerDown: (id: number) => void
  setCurrentLayer: (id: number) => void
  addToHistory: (item: HistoryItem) => void
  undo: () => HistoryItem | null
  redo: () => HistoryItem | null
  clearHistory: () => void
  setIsCollaborating: (collaborating: boolean) => void
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  updateUsers: (users: User[]) => void
  setCanvasObjects: (objects: any[]) => void
  setHistory: (history: HistoryItem[]) => void
}>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTool: (tool) => set({ tool }),
      setBrushSize: (size) => set({ brushSize: size }),
      setBrushColor: (color) => set({ brushColor: color }),
      setFillColor: (color) => set({ fillColor: color }),
      setStrokeColor: (color) => set({ strokeColor: color }),
      setFontSize: (size) => set({ fontSize: size }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setIsDrawing: (isDrawing) => set({ isDrawing }),

      setCanvasObjects: (objects) => {
        const { layers } = get()
        const updatedLayers = layers.map((layer, index) => 
          index === 0 ? { ...layer, objects } : layer
        )
        set({ layers: updatedLayers })
      },

      setHistory: (history) => set({ history, historyIndex: history.length - 1 }),

      addLayer: () => {
        const { layers } = get()
        const newId = layers.length
        const newLayer: Layer = {
          id: newId,
          name: `Layer ${newId + 1}`,
          visible: true,
          locked: false,
          objects: []
        }
        set({ layers: [...layers, newLayer], currentLayer: newId })
      },

      removeLayer: (id) => {
        const { layers, currentLayer } = get()
        if (layers.length <= 1) return
        const filteredLayers = layers.filter((layer) => layer.id !== id)
        const newCurrentLayer = currentLayer === id ? Math.max(0, id - 1) : currentLayer
        set({ layers: filteredLayers, currentLayer: newCurrentLayer })
      },

      setLayerVisible: (id, visible) => {
        const { layers } = get()
        const updatedLayers = layers.map((layer) =>
          layer.id === id ? { ...layer, visible } : layer
        )
        set({ layers: updatedLayers })
      },

      setLayerLocked: (id, locked) => {
        const { layers } = get()
        const updatedLayers = layers.map((layer) =>
          layer.id === id ? { ...layer, locked } : layer
        )
        set({ layers: updatedLayers })
      },

      moveLayerUp: (id) => {
        const { layers } = get()
        const index = layers.findIndex((layer) => layer.id === id)
        if (index === -1 || index === layers.length - 1) return
        const updatedLayers = [...layers]
        ;[updatedLayers[index], updatedLayers[index + 1]] = [
          updatedLayers[index + 1],
          updatedLayers[index]
        ]
        set({ layers: updatedLayers })
      },

      moveLayerDown: (id) => {
        const { layers } = get()
        const index = layers.findIndex((layer) => layer.id === id)
        if (index === -1 || index === 0) return
        const updatedLayers = [...layers]
        ;[updatedLayers[index], updatedLayers[index - 1]] = [
          updatedLayers[index - 1],
          updatedLayers[index]
        ]
        set({ layers: updatedLayers })
      },

      setCurrentLayer: (id) => set({ currentLayer: id }),

      addToHistory: (item) => {
        const { history, historyIndex } = get()
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(item)
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift()
        }
        set({ history: newHistory, historyIndex: newHistory.length - 1 })
      },

      undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex < 0) return null
        const item = history[historyIndex]
        set({ historyIndex: historyIndex - 1 })
        return item
      },

      redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex >= history.length - 1) return null
        const item = history[historyIndex + 1]
        set({ historyIndex: historyIndex + 1 })
        return item
      },

      clearHistory: () => set({ history: [], historyIndex: -1 }),

      setIsCollaborating: (collaborating) => set({ isCollaborating: collaborating }),

      addUser: (user) => {
        const { users } = get()
        const updatedUsers = [...users, user]
        set({ users: updatedUsers })
      },

      removeUser: (userId) => {
        const { users } = get()
        const updatedUsers = users.filter((user) => user.id !== userId)
        set({ users: updatedUsers })
      },

      updateUsers: (users) => set({ users })
    }),
    {
      name: 'whiteboard-storage',
      partialize: (state) => ({
        brushSize: state.brushSize,
        brushColor: state.brushColor,
        fillColor: state.fillColor,
        strokeColor: state.strokeColor,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        layers: state.layers
      })
    }
  )
)
