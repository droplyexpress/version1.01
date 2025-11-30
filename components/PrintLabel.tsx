import { Order } from '@shared/types';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Fa886f79a8a774641a790f442f2e15190?format=webp&width=100';

interface PrintLabelProps {
  order: Order;
  onClose: () => void;
}

export function PrintLabel({ order, onClose }: PrintLabelProps) {
  const handlePrint = () => {
    // Create a new window with only the print content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.getElementById('print-content')?.innerHTML || '';
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etiqueta - Pedido ${order.order_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
            background: white;
          }

          @page {
            size: A4;
            margin: 0;
          }

          .container {
            width: 210mm;
            height: 148mm;
            padding: 20px;
            box-sizing: border-box;
            page-break-after: avoid;
            background: white;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .container {
              page-break-after: avoid;
              margin: 0;
              padding: 20px;
              width: 210mm;
              height: 148mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${printContent}
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-black">Etiqueta para Imprimir - Pedido #{order.order_number}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Print Preview - This will be styled for printing */}
        <div
          id="print-content"
          className="p-6"
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {/* Header: Logo/Name (Left) + Order Number (Right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '12px', borderBottom: '3px solid #000' }}>
            {/* Left Side: Logo and Company Name */}
            <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <img
                src={LOGO_URL}
                alt="Droply Express"
                style={{ height: '100px', objectFit: 'contain' }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af', lineHeight: '1' }}>
                  DROPLY EXPRESS
                </div>
              </div>
            </div>

            {/* Right Side: Order Number */}
            <div style={{ flex: '0 0 55%', textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', marginBottom: '6px' }}>
                PEDIDO #
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px', color: '#000', marginBottom: '12px' }}>
                {order.order_number}
              </div>
            </div>
          </div>

          {/* Customer Info: Sender (Top) + Recipient (Below) */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {/* Left: Client who sends (Remitente) */}
            <div style={{ flex: '1', padding: '10px', backgroundColor: '#fff', border: '1px solid #000' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', marginBottom: '6px', textTransform: 'uppercase' }}>
                Enviado por:
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', marginBottom: '3px' }}>
                {order.client?.nombre || 'No especificado'}
              </div>
              <div style={{ fontSize: '11px', color: '#000', marginBottom: '3px' }}>
                Tel: {order.client?.telefono || 'No especificado'}
              </div>
            </div>

            {/* Right: Recipient (Destinatario) */}
            <div style={{ flex: '1', padding: '10px', backgroundColor: '#fff', border: '1px solid #000' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', marginBottom: '6px', textTransform: 'uppercase' }}>
                Para:
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', marginBottom: '3px' }}>
                {order.recipient_name || 'No especificado'}
              </div>
              <div style={{ fontSize: '11px', color: '#000', marginBottom: '3px' }}>
                Tel: {order.recipient_phone || 'No especificado'}
              </div>
            </div>
          </div>

          {/* Delivery Info Section (Main Content) */}
          <div style={{ marginBottom: '20px' }}>
            {/* Delivery Address - Large and Bold */}
            <div style={{ marginBottom: '16px', padding: '14px', border: '2px solid #000', backgroundColor: '#fff', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', marginBottom: '8px', textTransform: 'uppercase' }}>
                🏁 Dirección de Entrega
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', lineHeight: '1.6' }}>
                {order.delivery_address || 'No especificada'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', marginTop: '8px' }}>
                Hora: <span style={{ color: '#000' }}>{order.delivery_date} {order.delivery_time}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#fff', borderLeft: '4px solid #000', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#000', textTransform: 'uppercase' }}>
                Notas
              </div>
              <div style={{ fontSize: '12px', color: '#000' }}>
                {order.notes}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #000', fontSize: '10px', color: '#000' }}>
            Etiqueta impresa: {new Date().toLocaleString('es-ES')}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} className="text-black">
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2 text-white">
            <Printer size={18} />
            Imprimir Etiqueta
          </Button>
        </div>
      </div>

    </div>
  );
}
