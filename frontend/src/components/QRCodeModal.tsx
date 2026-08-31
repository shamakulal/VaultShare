import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QRCodeModalProps {
  shareUrl: string;
  onClose: () => void;
}

const QRCodeModal = ({
  shareUrl,
  onClose,
}: QRCodeModalProps) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadQR = () => {
    try {
      setDownloading(true);

      const canvas = document.querySelector(
        "#vaultshare-qr-code"
      ) as HTMLCanvasElement | null;

      if (!canvas) {
        return;
      }

      const imageUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "vaultshare-qr-code.png";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-2xl sm:p-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Share
            </p>

            <h2 className="mt-1 text-2xl font-bold text-brown-dark">
              QR Code
            </h2>

            <p className="mt-2 text-sm text-brown-warm">
              Scan this QR code to open the shared file.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-brown-warm transition hover:bg-beige hover:text-brown-dark"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* QR Code */}
        <div className="mt-7 flex justify-center">
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <QRCodeCanvas
              id="vaultshare-qr-code"
              value={shareUrl}
              size={220}
              level="H"
              includeMargin
            />
          </div>
        </div>

        {/* URL */}
        <div className="mt-6 rounded-xl bg-beige/70 p-4">
          <p className="break-all text-center text-xs leading-5 text-brown-warm">
            {shareUrl}
          </p>
        </div>

        {/* Download */}
        <button
          type="button"
          onClick={handleDownloadQR}
          disabled={downloading}
          className="mt-5 w-full rounded-xl bg-brown-dark px-5 py-3.5 text-sm font-bold text-cream transition hover:bg-brown-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? "Preparing..." : "↓ Download QR Code"}
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-brown-primary/15 bg-cream px-5 py-3.5 text-sm font-bold text-brown-dark transition hover:bg-beige"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;