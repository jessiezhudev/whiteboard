# Collaborative Whiteboard

A real-time collaborative whiteboard application built with React, TypeScript, Fabric.js, and Socket.io.

## Features

### 🎨 Drawing Tools
- **Brush**: Freehand drawing with adjustable size and color
- **Shapes**: Rectangle, Circle, Arrow, and Line with customizable stroke and fill colors
- **Text**: Add text with multiple font options and sizes
- **Select**: Move, scale, and rotate objects

### 👥 Real-time Collaboration
- WebSocket-based real-time communication using Socket.io
- Multiple users can draw simultaneously
- User presence indicator
- Conflict resolution for concurrent edits

### ⏮️ Undo/Redo
- Unlimited undo/redo functionality (up to 50 steps)
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)

### 📁 Layer Management
- Create multiple layers
- Show/hide layers
- Lock/unlock layers
- Reorder layers
- Active layer selection

### 💾 Export Options
- Export as PNG
- Export as SVG
- Export as PDF

### 📱 Responsive Design
- Optimized for desktop and mobile devices
- Touch-friendly interface for mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Drawing Engine**: Fabric.js
- **Real-time Communication**: Socket.io
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Install Dependencies

```bash
npm install
```

## Running the Application

### Start Backend Server

```bash
npm run server
```

The WebSocket server will run on `http://localhost:3001`

### Start Frontend Development Server

In a separate terminal:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Usage

1. **Select a Tool**: Choose from the toolbar (Select, Brush, Rectangle, Circle, Arrow, Line, Text)
2. **Customize Settings**: Adjust brush size, colors, font size, and font family
3. **Draw**: Click and drag on the canvas
4. **Collaborate**: Share the URL with others to draw together
5. **Manage Layers**: Use the layer panel to organize your drawing
6. **Export**: Save your work as PNG, SVG, or PDF

## Keyboard Shortcuts

- **Ctrl+Z**: Undo last action
- **Ctrl+Shift+Z**: Redo last action

## Project Structure

```
whiteboard/
├── src/
│   ├── components/
│   │   ├── WhiteboardCanvas.tsx   # Main canvas component
│   │   ├── Toolbar.tsx            # Drawing tools
│   │   ├── TextSettings.tsx       # Text configuration
│   │   ├── LayerPanel.tsx         # Layer management
│   │   ├── ExportPanel.tsx        # Export options
│   │   └── CollaborationPanel.tsx # Online users
│   ├── store/
│   │   └── useWhiteboardStore.ts  # Zustand state management
│   ├── hooks/
│   │   └── useSocket.ts           # WebSocket hook
│   ├── types.ts                   # TypeScript type definitions
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── server/
│   └── index.js                   # WebSocket server
├── index.html                     # HTML template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
└── tailwind.config.js             # Tailwind CSS configuration
```

## License

MIT
