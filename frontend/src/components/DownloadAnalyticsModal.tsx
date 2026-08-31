interface DownloadAnalyticsModalProps {
  fileName: string;
  downloadCount: number;
  createdAt: string;
  onClose: () => void;
}

const DownloadAnalyticsModal = ({
  fileName,
  downloadCount,
  createdAt,
  onClose,
}: DownloadAnalyticsModalProps) => {
  const formattedCreatedAt = new Date(createdAt).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-dark/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-2xl sm:p-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Analytics
            </p>

            <h2 className="mt-1 text-2xl font-bold text-brown-dark">
              Download Analytics
            </h2>

            <p
              className="mt-2 truncate text-sm text-brown-warm"
              title={fileName}
            >
              {fileName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige text-lg font-bold text-brown-dark transition hover:bg-beige-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Download Count */}
        <div className="mt-7 rounded-2xl border border-brown-primary/10 bg-beige p-6">
          <p className="text-sm font-semibold text-brown-warm">
            Total downloads
          </p>

          <p className="mt-2 text-5xl font-bold text-brown-dark">
            {downloadCount}
          </p>
        </div>

        {/* Created */}
        <div className="mt-4 rounded-2xl border border-brown-primary/10 bg-beige p-5">
          <p className="text-sm font-semibold text-brown-warm">
            Created
          </p>

          <p className="mt-2 text-base font-semibold text-brown-dark">
            {formattedCreatedAt}
          </p>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-brown-primary/15 bg-cream px-4 py-3 text-sm font-bold text-brown-dark transition hover:bg-beige"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DownloadAnalyticsModal;