import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'qr-reader';

  const startScanning = async () => {
    try {
      setCameraError(null);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          stopScanning();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      const errorMsg = err.message || 'Failed to access camera';
      setCameraError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <div className="space-y-4">
      {!isScanning && !cameraError && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-red-600" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Position the QR code within the frame
              </p>
            </div>
            <Button
              onClick={startScanning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          </div>
        </Card>
      )}

      {cameraError && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center space-y-2">
            <X className="w-12 h-12 text-red-600 mx-auto" />
            <p className="font-semibold text-red-900">Camera Access Denied</p>
            <p className="text-sm text-red-700">{cameraError}</p>
            <Button
              onClick={() => {
                setCameraError(null);
                startScanning();
              }}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {isScanning && (
        <Card className="p-4 overflow-hidden">
          <div id={elementId} className="rounded-lg overflow-hidden" />
          <Button
            onClick={stopScanning}
            variant="outline"
            className="w-full mt-4"
          >
            <X className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        </Card>
      )}
    </div>
  );
}


