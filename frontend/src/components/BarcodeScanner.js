import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Camera, X, Loader2 } from 'lucide-react';

export function BarcodeScanner({ open, onClose, onScan }) {
  const { language } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (open && !scanning) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    setError(null);
    setScanning(true);

    try {
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5
        },
        (decodedText, decodedResult) => {
          // Successfully scanned
          onScan(decodedText, decodedResult);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Scan error - ignore, keep scanning
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError(language === 'ar' 
        ? 'لا يمكن الوصول للكاميرا. تأكد من إعطاء الإذن.'
        : 'Cannot access camera. Please grant permission.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        // Ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cairo flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {language === 'ar' ? 'مسح الباركود' : 'Scan Barcode'}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Scanner Container */}
          <div 
            id="barcode-reader" 
            ref={scannerRef}
            className="w-full min-h-[250px] rounded-lg overflow-hidden bg-black"
          />

          {/* Loading State */}
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/90 rounded-lg p-4 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={startScanner} variant="outline">
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {language === 'ar' 
            ? 'وجّه الكاميرا نحو الباركود للمسح'
            : 'Point camera at barcode to scan'}
        </p>

        <Button variant="outline" onClick={handleClose} className="w-full">
          <X className="w-4 h-4 me-2" />
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
