import React from 'react'
import { useWhiteboardStore } from '../store/useWhiteboardStore'
import { ToolType } from '../types'

const Toolbar: React.FC = () => {
  const { tool, setTool, brushSize, setBrushSize, brushColor, setBrushColor, strokeColor, setStrokeColor, fillColor, setFillColor } = useWhiteboardStore()

  const tools: { type: ToolType; icon: string; label: string }[] = [
    { type: 'select', icon: '🖱️', label: 'Select' },
    { type: 'brush', icon: '✏️', label: 'Brush' },
    { type: 'rectangle', icon: '⬜', label: 'Rectangle' },
    { type: 'circle', icon: '⭕', label: 'Circle' },
    { type: 'arrow', icon: '➡️', label: 'Arrow' },
    { type: 'line', icon: '📏', label: 'Line' },
    { type: 'text', icon: '📝', label: 'Text' }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-gray-50 p-2 rounded">
          {tools.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => setTool(type)}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${tool === type ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title={label}
            >
              <span className="text-xl">{icon}</span>
            </button>
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <label className="text-sm text-gray-600 font-medium">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-sm text-gray-600 w-10 text-right">{brushSize}</span>
        </div>

        {/* Brush Color */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <label className="text-sm text-gray-600 font-medium">Brush:</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
          />
        </div>

        {/* Stroke Color */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <label className="text-sm text-gray-600 font-medium">Stroke:</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
          />
        </div>

        {/* Fill Color */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <label className="text-sm text-gray-600 font-medium">Fill:</label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
          />
        </div>
      </div>
    </div>
  )
}

export default Toolbar
