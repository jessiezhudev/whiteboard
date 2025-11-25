import React, { useRef } from 'react'
import WhiteboardCanvas from './components/WhiteboardCanvas'
import Toolbar from './components/Toolbar'
import TextSettings from './components/TextSettings'
import LayerPanel from './components/LayerPanel'
import ExportPanel from './components/ExportPanel'
import CollaborationPanel from './components/CollaborationPanel'
import { useWhiteboardStore } from './store/useWhiteboardStore'
import { useOTStore } from './store/useOTStore'
import useSocket from './hooks/useSocket'

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { undo, redo } = useWhiteboardStore()
  const { currentVersion, localQueue, serverQueue } = useOTStore()
  const socket = useSocket()

  const handleUndo = () => {
    undo()
  }

  const handleRedo = () => {
    redo()
  }

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">Collaborative Whiteboard</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Version: {currentVersion}
                </span>
                {socket.isConnected ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Connected
                  </span>
                ) : socket.isReconnecting ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Reconnecting...
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    Disconnected
                  </span>
                )}
                {localQueue.length > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                    Local Queue: {localQueue.length}
                  </span>
                )}
                {serverQueue.length > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                    Server Queue: {serverQueue.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                  title="Undo (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={handleRedo}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  ↷ Redo
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Press Ctrl+Z to undo, Ctrl+Shift+Z to redo
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar */}
          <div className="lg:w-64 space-y-4">
            <LayerPanel />
            <ExportPanel canvasRef={canvasRef} />
            <CollaborationPanel />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 space-y-4">
            <Toolbar />
            <TextSettings />
            <div className="relative">
              <WhiteboardCanvas />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4 py-3">
          <p className="text-sm text-gray-500 text-center">
            Collaborative Whiteboard - Real-time drawing with multiple users
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
