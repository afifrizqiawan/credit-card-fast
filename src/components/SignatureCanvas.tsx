import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Paintbrush } from 'lucide-react';

interface SignatureCanvasProps {
  value: string; // Base64 dataURI
  onChange: (base64: string) => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas size to parent container on mount
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 140;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#0f172a'; // dark tailwind slate-900
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Load existing value if any
      if (value) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = value;
      }
    }
  }, []);

  // Handle Resize safely
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create backup of current signature before resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Resize
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width - 2; // offset borders
      
      // Restore backup
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsEmpty(false);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      onChange('');
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && !isEmpty) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1">
          <Paintbrush className="w-3 h-3 text-blue-600" />
          Tanda Tangan Digital Nasabah <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          id="btn-clear-signature"
          onClick={clearCanvas}
          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Eraser className="w-3 h-3" />
          Hapus
        </button>
      </div>

      <div className="relative border border-dashed border-gray-300 hover:border-gray-400 bg-slate-50/50 rounded-xl overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full block bg-slate-50 touch-none"
          style={{ height: '140px' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400 select-none">
            <span className="text-xs">Tanda tangan di sini menggunakan jari / stylus</span>
            <span className="text-[10px] text-gray-300 mt-1">(Wajib untuk on-the-spot bank event)</span>
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold bg-green-50 py-1 px-2.5 rounded-lg w-max">
          <Check className="w-3 h-3" />
          Tanda Tangan Tersimpan Aman
        </div>
      )}
    </div>
  );
};
