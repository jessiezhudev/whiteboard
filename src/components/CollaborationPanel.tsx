import React from 'react'
import { useWhiteboardStore } from '../store/useWhiteboardStore'

const CollaborationPanel: React.FC = () => {
  const { users, isCollaborating } = useWhiteboardStore()

  if (!isCollaborating) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Collaboration</h3>
        <div className="text-sm text-gray-500">
          Not connected to collaboration server
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Online Users ({users.length})</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-sm text-gray-700">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CollaborationPanel
