import React from 'react'
import { useWhiteboardStore } from '../store/useWhiteboardStore'

const LayerPanel: React.FC = () => {
  const {
    layers,
    currentLayer,
    addLayer,
    removeLayer,
    setLayerVisible,
    setLayerLocked,
    moveLayerUp,
    moveLayerDown,
    setCurrentLayer
  } = useWhiteboardStore()

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Layers</h3>
        <button
          onClick={addLayer}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          + Add
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`p-3 rounded-lg border-2 transition-all ${currentLayer === layer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              {/* Visibility Toggle */}
              <button
                onClick={() => setLayerVisible(layer.id, !layer.visible)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {layer.visible ? '👁️' : '👁️‍🗨️'}
              </button>

              {/* Lock Toggle */}
              <button
                onClick={() => setLayerLocked(layer.id, !layer.locked)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>

              {/* Layer Name */}
              <button
                onClick={() => setCurrentLayer(layer.id)}
                className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {layer.name}
              </button>

              {/* Object Count */}
              <span className="text-xs text-gray-500">{layer.objects.length} objects</span>

              {/* Move Up */}
              <button
                onClick={() => moveLayerUp(layer.id)}
                disabled={index === layers.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ↑
              </button>

              {/* Move Down */}
              <button
                onClick={() => moveLayerDown(layer.id)}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ↓
              </button>

              {/* Delete */}
              <button
                onClick={() => removeLayer(layer.id)}
                disabled={layers.length <= 1}
                className="text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LayerPanel
