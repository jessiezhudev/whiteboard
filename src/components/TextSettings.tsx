import React from 'react'
import { useWhiteboardStore } from '../store/useWhiteboardStore'

const TextSettings: React.FC = () => {
  const { fontSize, setFontSize, fontFamily, setFontFamily } = useWhiteboardStore()

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia']

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <label className="text-sm text-gray-600 font-medium">Font Size:</label>
          <input
            type="range"
            min="12"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-sm text-gray-600 w-12 text-right">{fontSize}</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
          <label className="text-sm text-gray-600 font-medium">Font:</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default TextSettings
