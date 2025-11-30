import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { orderService } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';

interface DeliveryEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  driverId: string;
  onSuccess: () => void;
}

export function DeliveryEvidenceModal({
  isOpen,
  onClose,
  orderId,
  driverId,
  onSuccess,
}: DeliveryEvidenceModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientDni, setRecipientDni] = useState('');
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  // Initialize canvas when modal opens
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      setIsSignatureEmpty(true);
      setRecipientName('');
      setRecipientDni('');
    }
  }, [isOpen]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left,
        y: (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsSignatureEmpty(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsSignatureEmpty(false);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const handleTouchEnd = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setIsSignatureEmpty(true);
    }
  };

  const handleSubmit = async () => {
    if (!recipientName.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa el nombre del destinatario',
        variant: 'destructive',
      });
      return;
    }

    if (!recipientDni.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa el DNI del destinatario',
        variant: 'destructive',
      });
      return;
    }

    if (isSignatureEmpty) {
      toast({
        title: 'Error',
        description: 'Por favor dibuja tu firma',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!canvasRef.current) throw new Error('Canvas not available');

      const canvas = canvasRef.current;
      const file = await new Promise<File>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], `signature-${orderId}.png`, { type: 'image/png' }));
          } else {
            reject(new Error('Could not create blob from canvas'));
          }
        }, 'image/png');
      });

      await orderService.uploadDeliveryEvidence(
        orderId,
        driverId,
        file,
        recipientDni,
        recipientName
      );

      setRecipientName('');
      setRecipientDni('');
      clearSignature();
      setIsLoading(false);

      // Call onSuccess first to update parent state and remove from display
      onSuccess();

      // Close modal after parent has processed the success callback
      onClose();
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar la entrega';
      console.error('Error uploading evidence:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 z-50">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Finalizar Entrega - Datos del Destinatario
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Completa los datos del destinatario y la firma para finalizar la entrega
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Recipient Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre del Destinatario *
            </label>
            <input
              type="text"
              placeholder="Ej: Juan García López"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>

          {/* Recipient DNI */}
          <div>
            <label className="block text-sm font-medium mb-1">
              DNI del Destinatario *
            </label>
            <input
              type="text"
              placeholder="Ej: 12345678A"
              value={recipientDni}
              onChange={(e) => setRecipientDni(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>

          {/* Signature Canvas */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Firma del Destinatario *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden dark:border-slate-600">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full bg-white dark:bg-slate-800 cursor-crosshair"
                style={{ touchAction: 'none' }}
              />
            </div>
            {!isSignatureEmpty && (
              <button
                onClick={clearSignature}
                disabled={isLoading}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Limpiar firma
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t p-6 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !recipientName.trim() || !recipientDni.trim() || isSignatureEmpty}
          >
            {isLoading ? 'Procesando...' : '✓ Confirmar Entrega'}
          </Button>
        </div>
      </div>
    </div>
  );
}
