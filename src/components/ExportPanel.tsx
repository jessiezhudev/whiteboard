import React from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

const ExportPanel: React.FC<ExportPanelProps> = ({ canvasRef }) => {
  const handleExportPNG = async () => {
    if (!canvasRef.current) return

    const dataURL = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  const handleExportSVG = () => {
    if (!canvasRef.current) return

    const svgData = canvasRef.current.outerHTML
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height])
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`whiteboard-${Date.now()}.pdf`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Export</h3>
      <div className="space-y-2">
        <button
          onClick={handleExportPNG}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Export as PNG
        </button>
        <button
          onClick={handleExportSVG}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
        >
          Export as SVG
        </button>
        <button
          onClick={handleExportPDF}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm font-medium"
        >
          Export as PDF
        </button>
      </div>
    </div>
  )
}

export default ExportPanel
