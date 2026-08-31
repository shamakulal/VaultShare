import React from "react";

interface ShareFile {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  visibility: string;
  created_at: string;
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
  onCopyShareLink: () => Promise<void>;
  onCreateShareLink: () => Promise<void>;
  onPasswordChange: (value: string) => void;
  onExpiryChange: React.Dispatch<React.SetStateAction<string>>;
  onMaxDownloadsChange: React.Dispatch<React.SetStateAction<string>>;
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

  const isCustomExpiry =
    shareExpiry !== "" &&
    !["1h", "24h", "7d"].includes(shareExpiry);

  const setExpiryHours = (hours: number) => {
    const date = new Date(Date.now() + hours * 60 * 60 * 1000);

    onExpiryChange(date.toISOString().slice(0, 16));
  };

  const setExpiryDays = (days: number) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    onExpiryChange(date.toISOString().slice(0, 16));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-brown-dark/60 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7">

        {/* HEADER */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
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
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige text-lg font-bold text-brown-dark transition hover:bg-beige-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* CREATED LINK */}
        {createdShareUrl ? (
          <div>
            <div className="rounded-2xl border border-gold/30 bg-beige p-4">
              <p className="font-bold text-brown-dark">
                Share link created successfully!
              </p>

              <p className="mt-1 text-sm text-brown-warm">
                Anyone with this link can access the shared file according to
                your settings.
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

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCopyShareLink}
                className="rounded-xl bg-brown-primary px-4 py-3 text-sm font-bold text-cream transition hover:bg-brown-dark"
              >
                Copy Link
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(
                    createdShareUrl,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                className="rounded-xl bg-brown-primary px-4 py-3 text-sm font-bold text-cream transition hover:bg-brown-dark"
              >
                ↗ Open
              </button>

              <button
                type="button"
                onClick={onClose}
                className="col-span-2 rounded-xl bg-beige px-4 py-3 text-sm font-bold text-brown-dark transition hover:bg-beige-light"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
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
                onChange={(event) =>
                  onPasswordChange(event.target.value)
                }
                placeholder={
                  shareFile.visibility === "private"
                    ? "Enter a password to share this private file"
                    : "Protect this link with a password"
                }
                required={shareFile.visibility === "private"}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
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

            {/* EXPIRATION */}
            <div className="mt-5">
              <label className="mb-3 block text-sm font-bold text-brown-dark">
                Expiration
                <span className="ml-1 font-normal text-brown-warm">
                  (optional)
                </span>
              </label>

              <div className="space-y-2">

                {/* NEVER */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brown-primary/10 bg-white p-3 transition hover:bg-beige">
                  <input
                    type="radio"
                    name="expiration"
                    checked={shareExpiry === ""}
                    onChange={() => onExpiryChange("")}
                  />

                  <span className="text-sm font-semibold text-brown-dark">
                    Never expires
                  </span>
                </label>

                {/* 1 HOUR */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brown-primary/10 bg-white p-3 transition hover:bg-beige">
                  <input
                    type="radio"
                    name="expiration"
                    checked={false}
                    onChange={() => setExpiryHours(1)}
                  />

                  <span className="text-sm font-semibold text-brown-dark">
                    1 hour
                  </span>
                </label>

                {/* 24 HOURS */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brown-primary/10 bg-white p-3 transition hover:bg-beige">
                  <input
                    type="radio"
                    name="expiration"
                    checked={false}
                    onChange={() => setExpiryHours(24)}
                  />

                  <span className="text-sm font-semibold text-brown-dark">
                    24 hours
                  </span>
                </label>

                {/* 7 DAYS */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brown-primary/10 bg-white p-3 transition hover:bg-beige">
                  <input
                    type="radio"
                    name="expiration"
                    checked={false}
                    onChange={() => setExpiryDays(7)}
                  />

                  <span className="text-sm font-semibold text-brown-dark">
                    7 days
                  </span>
                </label>

                {/* CUSTOM */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brown-primary/10 bg-white p-3 transition hover:bg-beige">
                  <input
                    type="radio"
                    name="expiration"
                    checked={isCustomExpiry}
                    onChange={() => {
                      if (!isCustomExpiry) {
                        const date = new Date(
                          Date.now() + 24 * 60 * 60 * 1000,
                        );

                        onExpiryChange(
                          date.toISOString().slice(0, 16),
                        );
                      }
                    }}
                  />

                  <span className="text-sm font-semibold text-brown-dark">
                    Custom date & time
                  </span>
                </label>

                {/* CUSTOM DATE */}
                {isCustomExpiry && (
                  <input
                    type="datetime-local"
                    value={shareExpiry}
                    onChange={(event) =>
                      onExpiryChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-brown-primary/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/10"
                  />
                )}
              </div>
            </div>

            {/* MAX DOWNLOADS */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-brown-dark">
                Maximum downloads
                <span className="ml-1 font-normal text-brown-warm">
                  (optional)
                </span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {["1", "5", "10"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onMaxDownloadsChange(value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      maxDownloads === value
                        ? "border-brown-primary bg-brown-primary text-cream"
                        : "border-brown-primary/15 bg-white text-brown-dark hover:bg-beige"
                    }`}
                  >
                    {value}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => onMaxDownloadsChange("")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    maxDownloads === ""
                      ? "border-brown-primary bg-brown-primary text-cream"
                      : "border-brown-primary/15 bg-white text-brown-dark hover:bg-beige"
                  }`}
                >
                  ∞
                </button>
              </div>

              <input
                type="number"
                min="1"
                value={maxDownloads}
                onChange={(event) =>
                  onMaxDownloadsChange(event.target.value)
                }
                placeholder="Custom limit"
                className="mt-3 w-full rounded-xl border border-brown-primary/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/10"
              />
            </div>

            {/* ERROR */}
            {message && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            {/* BUTTONS */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-beige px-4 py-3 text-sm font-bold text-brown-dark transition hover:bg-beige-light"
              >
                Cancel
              </button>

              <button
                type="button"
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