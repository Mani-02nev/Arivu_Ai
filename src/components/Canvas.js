import React, { useRef, useState, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import './Canvas.css';

const Canvas = ({ isOpen, onClose, onSave, onGenerateCode, onSendMessage }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00d4ff');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // brush, eraser, select
  const [selectedArea, setSelectedArea] = useState(null);
  const [codePreview, setCodePreview] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], `canvas-${Date.now()}.png`, { type: 'image/png' });
      onSave(file);
      onClose();
    }, 'image/png');
  };

  const generateWebsiteCode = async () => {
    if (!selectedArea) {
      alert('Please select an area on the canvas first');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get selected area image
    const imageData = ctx.getImageData(selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selectedArea.width;
    tempCanvas.height = selectedArea.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);
    
    tempCanvas.toBlob(async (blob) => {
      // Convert to base64 for Gemini API
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        
        // Send to Gemini to generate website code
        try {
          const fileObj = {
            file: blob,
            type: 'image/png',
            name: 'canvas-selection.png'
          };
          
          const prompt = 'Analyze this image and generate complete HTML, CSS, and JavaScript code to recreate this design as a website. Provide clean, modern, responsive code.';
          
          const result = await sendMessageToGemini(prompt, [], [fileObj]);
          
          if (result.success) {
            // Parse the response to extract HTML, CSS, JS
            const response = result.message;
            const htmlMatch = response.match(/```html\s*([\s\S]*?)```/i) || response.match(/<html[\s\S]*?<\/html>/i);
            const cssMatch = response.match(/```css\s*([\s\S]*?)```/i) || response.match(/<style[\s\S]*?<\/style>/i);
            const jsMatch = response.match(/```javascript\s*([\s\S]*?)```/i) || response.match(/<script[\s\S]*?<\/script>/i);
            
            setCodePreview({
              html: htmlMatch ? htmlMatch[1] || htmlMatch[0] : response,
              css: cssMatch ? cssMatch[1] || cssMatch[0] : '',
              js: jsMatch ? jsMatch[1] || jsMatch[0] : ''
            });
          } else {
            alert('Failed to generate code: ' + result.error);
          }
        } catch (error) {
          console.error('Code generation error:', error);
          alert('Error generating code. Please try again.');
        }
      };
      reader.readAsDataURL(blob);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="canvas-overlay" onClick={onClose}>
      <div className="canvas-modal" onClick={(e) => e.stopPropagation()}>
        <div className="canvas-header">
          <h3>Canvas</h3>
          <button className="canvas-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="canvas-tools">
          <div className="tool-group">
            <button
              className={`tool-btn ${tool === 'brush' ? 'active' : ''}`}
              onClick={() => setTool('brush')}
              title="Brush"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <i className="bi bi-eraser"></i>
            </button>
            <button
              className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
              onClick={() => setTool('select')}
              title="Select Area (Generate Code)"
            >
              <i className="bi bi-cursor"></i>
            </button>
          </div>
          <div className="tool-group">
            <label>Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="color-picker"
            />
          </div>
          <div className="tool-group">
            <label>Size: {brushSize}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="brush-slider"
            />
          </div>
          <button className="tool-btn clear-btn" onClick={clearCanvas} title="Clear">
            <i className="bi bi-trash3"></i>
          </button>
        </div>
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="drawing-canvas"
          />
        </div>
        <div className="canvas-footer">
          <button className="canvas-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          {tool === 'select' && selectedArea && (
            <button className="canvas-generate-btn" onClick={generateWebsiteCode}>
              Generate Code
            </button>
          )}
          <button className="canvas-save-btn" onClick={saveCanvas}>
            Save & Attach
          </button>
        </div>
        {codePreview && (
          <div className="code-preview-modal">
            <div className="code-preview-content">
              <div className="code-preview-header">
                <h4>Generated Website Code</h4>
                <button onClick={() => setCodePreview(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="code-tabs">
                <button className="code-tab active">HTML</button>
                <button className="code-tab">CSS</button>
                <button className="code-tab">JS</button>
              </div>
              <pre className="code-preview">
                <code>{codePreview.html}</code>
              </pre>
              <div className="code-preview-actions">
                <button onClick={() => {
                  navigator.clipboard.writeText(codePreview.html);
                  alert('Code copied to clipboard!');
                }}>
                  Copy Code
                </button>
                <button onClick={() => {
                  const newWindow = window.open();
                  newWindow.document.write(codePreview.html);
                }}>
                  Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;

