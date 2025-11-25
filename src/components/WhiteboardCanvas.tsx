import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { useWhiteboardStore } from '../store/useWhiteboardStore'
import useSocket from '../hooks/useSocket'
import { useOTStore } from '../store/useOTStore'
import { generateOpId } from '../utils/ot'
import { ToolType, ShapeType } from '../types'

const WhiteboardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isReady, setIsReady] = useState(false)
  const { isConnected, sendOperation, socket, on, off } = useSocket()

  const {
    tool,
    brushSize,
    brushColor,
    fillColor,
    strokeColor,
    fontSize,
    fontFamily,
    currentLayer,
    layers,
    addToHistory,
    setCanvasObjects
  } = useWhiteboardStore()

  const { applyOperation } = useOTStore()

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 300,
      height: window.innerHeight - 100,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    })

    fabricCanvasRef.current = canvas
    setIsReady(true)

    // Set up brush
    canvas.freeDrawingBrush.width = brushSize
    canvas.freeDrawingBrush.color = brushColor

    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth - 300)
      canvas.setHeight(window.innerHeight - 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.dispose()
    }
  }, [])

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    canvas.freeDrawingBrush.width = brushSize
    canvas.freeDrawingBrush.color = brushColor
  }, [brushSize, brushColor])

  // Update drawing mode based on tool
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    switch (tool) {
      case 'brush':
        canvas.isDrawingMode = true
        canvas.selection = false
        break
      case 'select':
        canvas.isDrawingMode = false
        canvas.selection = true
        break
      case 'text':
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line':
        canvas.isDrawingMode = false
        canvas.selection = false
        break
      default:
        canvas.isDrawingMode = false
        canvas.selection = true
    }
  }, [tool])

  // Handle object added
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    const handleObjectAdded = (e: any) => {
      const object = e.target
      if (object) {
        // Generate object ID if not exists
        if (!object.objectId) {
          object.objectId = generateOpId()
        }

        // Create operation
        const operation = {
          id: generateOpId(),
          type: 'objectAdded',
          object: object.toJSON(),
          timestamp: Date.now(),
          userId: socket?.id,
          version: 0
        }

        // Apply locally
        applyOperation(operation)
        addToHistory({ type: 'add', objects: [object] })
        
        // Send to server
        if (isConnected) {
          sendOperation(operation)
        }
      }
    }

    canvas.on('object:added', handleObjectAdded)

    return () => {
      canvas.off('object:added', handleObjectAdded)
    }
  }, [addToHistory, sendOperation, isConnected, socket, applyOperation])

  // Handle object modified
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    const handleObjectModified = (e: any) => {
      const object = e.target
      if (object) {
        // Create operation
        const operation = {
          id: generateOpId(),
          type: 'objectModified',
          object: object.toJSON(),
          timestamp: Date.now(),
          userId: socket?.id,
          version: 0
        }

        // Apply locally
        applyOperation(operation)
        addToHistory({ type: 'modify', objects: [object] })
        
        // Send to server
        if (isConnected) {
          sendOperation(operation)
        }
      }
    }

    canvas.on('object:modified', handleObjectModified)

    return () => {
      canvas.off('object:modified', handleObjectModified)
    }
  }, [addToHistory, sendOperation, isConnected, socket, applyOperation])

  // Handle object removed
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    const handleObjectRemoved = (e: any) => {
      const object = e.target
      if (object) {
        // Create operation
        const operation = {
          id: generateOpId(),
          type: 'objectRemoved',
          objectId: object.objectId,
          timestamp: Date.now(),
          userId: socket?.id,
          version: 0
        }

        // Apply locally
        applyOperation(operation)
        addToHistory({ type: 'remove', objects: [object] })
        
        // Send to server
        if (isConnected) {
          sendOperation(operation)
        }
      }
    }

    canvas.on('object:removed', handleObjectRemoved)

    return () => {
      canvas.off('object:removed', handleObjectRemoved)
    }
  }, [addToHistory, sendOperation, isConnected, socket, applyOperation])

  // Handle mouse down for shape tools
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    let isMouseDown = false
    let startX = 0
    let startY = 0
    let currentObject: fabric.Object | null = null

    const handleMouseDown = (e: any) => {
      if (tool === 'select' || tool === 'brush') return

      isMouseDown = true
      const pointer = canvas.getPointer(e.e)
      startX = pointer.x
      startY = pointer.y

      switch (tool) {
        case 'rectangle':
          currentObject = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: brushSize,
            selectable: true,
            objectId: generateOpId()
          })
          break
        case 'circle':
          currentObject = new fabric.Circle({
            left: startX,
            top: startY,
            radius: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: brushSize,
            selectable: true,
            objectId: generateOpId()
          })
          break
        case 'line':
          currentObject = new fabric.Line([startX, startY, startX, startY], {
            stroke: strokeColor,
            strokeWidth: brushSize,
            selectable: true,
            objectId: generateOpId()
          })
          break
        case 'arrow':
          currentObject = new fabric.Line([startX, startY, startX, startY], {
            stroke: strokeColor,
            strokeWidth: brushSize,
            selectable: true,
            objectId: generateOpId()
          })
          // Add arrow heads
          ;(currentObject as any).set({ hasBorders: false, hasControls: true })
          break
        case 'text':
          currentObject = new fabric.IText('Text', {
            left: startX,
            top: startY,
            fontSize,
            fontFamily,
            fill: strokeColor,
            selectable: true,
            objectId: generateOpId()
          })
          break
        default:
          return
      }

      if (currentObject) {
        canvas.add(currentObject)
        canvas.setActiveObject(currentObject)
      }
    }

    const handleMouseMove = (e: any) => {
      if (!isMouseDown || !currentObject) return

      const pointer = canvas.getPointer(e.e)

      switch (tool) {
        case 'rectangle':
          const rect = currentObject as fabric.Rect
          rect.set({
            width: pointer.x - startX,
            height: pointer.y - startY
          })
          break
        case 'circle':
          const circle = currentObject as fabric.Circle
          const radius = Math.sqrt(
            Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
          )
          circle.set({ radius })
          break
        case 'line':
        case 'arrow':
          const line = currentObject as fabric.Line
          line.set({
            x2: pointer.x,
            y2: pointer.y
          })
          break
        default:
          return
      }

      canvas.renderAll()
    }

    const handleMouseUp = () => {
      isMouseDown = false
      currentObject = null
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('mouse:out', handleMouseUp)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      canvas.off('mouse:out', handleMouseUp)
    }
  }, [tool, brushSize, fillColor, strokeColor, fontSize, fontFamily])

  // Handle incoming socket events
  useEffect(() => {
    if (!fabricCanvasRef.current || !isConnected) return

    const canvas = fabricCanvasRef.current

    const handleDrawEvent = (data: any) => {
      // Apply operation from server
      applyOperation(data)
    }

    on('draw', handleDrawEvent)

    return () => {
      off('draw', handleDrawEvent)
    }
  }, [isConnected, on, off, applyOperation])

  // Apply operation from OT store
  useEffect(() => {
    const unsubscribe = useOTStore.subscribe(
      (state) => state.lastAppliedOperation,
      (operation) => {
        if (!operation || !fabricCanvasRef.current) return

        const canvas = fabricCanvasRef.current

        switch (operation.type) {
          case 'objectAdded':
            fabric.util.enlivenObjects([operation.object], (enlivenedObjects) => {
              enlivenedObjects.forEach((obj) => {
                canvas.add(obj)
              })
              canvas.renderAll()
            })
            break
          case 'objectRemoved':
            const objectToRemove = canvas.getObjects().find(obj => (obj as any).objectId === operation.objectId)
            if (objectToRemove) {
              canvas.remove(objectToRemove)
              canvas.renderAll()
            }
            break
          case 'objectModified':
            const objectToUpdate = canvas.getObjects().find(obj => (obj as any).objectId === operation.object.id)
            if (objectToUpdate) {
              objectToUpdate.set(operation.object)
              canvas.renderAll()
            }
            break
        }
      }
    )

    return () => unsubscribe()
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="fabric-canvas border border-gray-200 rounded-lg shadow-sm"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-gray-500">Loading canvas...</div>
        </div>
      )}
    </div>
  )
}

export default WhiteboardCanvas
