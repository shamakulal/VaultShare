interface ShareFile {
  original_name: string;
  visibility: string;
}

interface ShareFileModalProps {
  shareFile: ShareFile | null;
  createdShareUrl: string;
  sharePassword: string;
  shareExpiry: string;
  maxDownloads: string;
  loading: boolean;
  message: string;

  onClose: () => void;
  onCopyShareLink: () => void;
  onCreateShareLink: () => void;

  onPasswordChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onMaxDownloadsChange: (value: string) => void;
}

const ShareFileModal = ({
  shareFile,
  createdShareUrl,
  sharePassword,
  shareExpiry,
  maxDownloads,
  loading,
  message,
  onClose,
  onCopyShareLink,
  onCreateShareLink,
  onPasswordChange,
  onExpiryChange,
  onMaxDownloadsChange,
}: ShareFileModalProps) => {
  if (!shareFile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-brown-dark/60 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7">

        {/* HEADER */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Share securely
            </p>

            <h2 className="mt-1 text-2xl font-bold text-brown-dark">
              Share this file
            </h2>

            <p
              className="mt-2 max-w-sm truncate text-sm text-brown-warm"
              title={shareFile.original_name}
            >
              {shareFile.original_name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-beige text-lg font-bold text-brown-dark transition hover:bg-beige-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ================= SUCCESS ================= */}

        {createdShareUrl ? (
          <div>
            <div className="rounded-2xl border border-gold/30 bg-beige p-4">
              <p className="font-bold text-brown-dark">
                Share link created successfully!
              </p>

              <p className="mt-1 text-sm text-brown-warm">
                Anyone with this link can access the shared file according
                to your settings.
              </p>
            </div>

            <label className="mt-5 block text-sm font-bold text-brown-dark">
              Your share link
            </label>

            <input
              type="text"
              value={createdShareUrl}
              readOnly
              className="mt-2 w-full rounded-xl border border-brown-primary/15 bg-beige px-3 py-3 text-sm text-brown-dark outline-none"
            />

            {/* BUTTONS */}
            <div className="mt-5 grid grid-cols-3 gap-3">

              {/* COPY */}
              <button
                onClick={onCopyShareLink}
                className="rounded-xl bg-brown-primary px-4 py-3 text-sm font-bold text-cream transition hover:bg-brown-dark"
              >
                Copy Link
              </button>

              {/* OPEN NEW TAB */}
              <button
                onClick={() => {
                  window.open(
                    createdShareUrl,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-brown-primary px-4 py-3 text-sm font-bold text-cream transition hover:bg-brown-dark"
              >
                <span className="text-cream">↗</span>
                Open
              </button>

              {/* DONE */}
              <button
                onClick={onClose}
                className="rounded-xl bg-beige px-4 py-3 text-sm font-bold text-brown-dark transition hover:bg-beige-light"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ================= CREATE SHARE LINK ================= */}

            <div className="space-y-4">

              {/* PASSWORD */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-brown-dark">
                  Password{" "}
                  {shareFile.visibility === "private" ? (
                    <span className="font-normal text-red-600">
                      (required for private files)
                    </span>
                  ) : (
                    <span className="font-normal text-brown-primary/70">
                      (optional)
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  value={sharePassword}
                  onChange={(event) => {
                    onPasswordChange(event.target.value);
                  }}
                  placeholder={
                    shareFile.visibility === "private"
                      ? "Enter a password to share this private file"
                      : "Protect this link with a password"
                  }
                  required={shareFile.visibility === "private"}
                  className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                    shareFile.visibility === "private" &&
                    !sharePassword.trim()
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-brown-primary/15 focus:border-brown-primary focus:ring-brown-primary/10"
                  }`}
                />

                {shareFile.visibility === "private" && (
                  <p className="mt-2 text-xs text-brown-warm">
                    This file is private. You must set a password before
                    creating a share link.
                  </p>
                )}
              </div>

              {/* EXPIRY */}
              <div>
                <label className="text-sm font-bold text-brown-dark">
                  Expiry date
                  <span className="ml-1 font-normal text-brown-warm">
                    (optional)
                  </span>
                </label>

                <input
                  type="datetime-local"
                  value={shareExpiry}
                  onChange={(event) =>
                    onExpiryChange(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-brown-primary/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/10"
                />
              </div>

              {/* MAX DOWNLOADS */}
              <div>
                <label className="text-sm font-bold text-brown-dark">
                  Maximum downloads
                  <span className="ml-1 font-normal text-brown-warm">
                    (optional)
                  </span>
                </label>

                <input
                  type="number"
                  min="1"
                  value={maxDownloads}
                  onChange={(event) =>
                    onMaxDownloadsChange(event.target.value)
                  }
                  placeholder="For example: 5"
                  className="mt-2 w-full rounded-xl border border-brown-primary/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/10"
                />
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {message && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="mt-7 grid grid-cols-2 gap-3">

              <button
                onClick={onClose}
                className="rounded-xl bg-beige px-4 py-3 text-sm font-bold text-brown-dark transition hover:bg-beige-light"
              >
                Cancel
              </button>

              <button
                onClick={onCreateShareLink}
                disabled={
                  loading ||
                  (shareFile.visibility === "private" &&
                    !sharePassword.trim())
                }
                className="rounded-xl bg-brown-primary px-4 py-3 text-sm font-bold text-cream transition hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShareFileModal;