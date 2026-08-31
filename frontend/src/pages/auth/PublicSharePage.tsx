import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface SharedFile {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface ShareDetails {
  passwordProtected: boolean;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
}

const PublicSharePage = () => {
  const { shareToken } = useParams();

  const [file, setFile] = useState<SharedFile | null>(null);
  const [shareDetails, setShareDetails] = useState<ShareDetails | null>(null);

  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  // ==========================================
  // Load public share details
  // ==========================================

  useEffect(() => {
  const fetchShareDetails = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/share/${shareToken}`,
        {
          credentials: "include",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      // ==========================================
      // Backend returned an error
      // ==========================================

      if (!response.ok) {
        let errorMessage =
          "Unable to open this shared file.";

        // Only parse JSON if the response is actually JSON
        if (contentType.includes("application/json")) {
          const data = await response.json();

          errorMessage =
            data?.message ||
            "Unable to open this shared file.";
        } else {
          // HTML / unexpected response
          errorMessage =
            "This share link is no longer available.";
        }

        setMessage(errorMessage);
        return;
      }

      // ==========================================
      // Successful response must be JSON
      // ==========================================

      if (!contentType.includes("application/json")) {
        setMessage(
          "Unable to open this shared file. Unexpected response from server."
        );
        return;
      }

      const data = await response.json();

      // ==========================================
      // Validate response structure
      // ==========================================

      if (!data?.data?.file || !data?.data?.shareLink) {
        setMessage(
          "Unable to load the shared file."
        );
        return;
      }

      setFile(data.data.file);
      setShareDetails(data.data.shareLink);

      // If no password, user can download immediately
      if (!data.data.shareLink.passwordProtected) {
        setVerified(true);
      }

    } catch (error) {
      console.error(
        "Failed to load share details:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open this shared file."
      );
    } finally {
      setLoading(false);
    }
  };

  if (shareToken) {
    fetchShareDetails();
  }
}, [shareToken]);

  // ==========================================
  // Verify password
  // ==========================================

  const handleVerifyPassword = async () => {
    try {
      setMessage("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/share/${shareToken}/verify-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        },
      );

      const contentType = response.headers.get("content-type") || "";

      // ==========================================
      // Backend returned an error
      // ==========================================

      if (!response.ok) {
        let errorMessage = "Password verification failed.";

        if (contentType.includes("application/json")) {
          const data = await response.json();

          errorMessage = data?.message || "Password verification failed.";
        } else {
          errorMessage = "Unable to verify password. Please try again.";
        }

        setMessage(errorMessage);
        return;
      }

      // ==========================================
      // Successful verification
      // ==========================================

      if (!contentType.includes("application/json")) {
        setMessage("Unexpected response from server. Please try again.");
        return;
      }

      const data = await response.json();

      if (!data?.data?.verified) {
        setMessage("Password verification failed.");
        return;
      }

      setVerified(true);
      setPassword("");
      setMessage("");
    } catch (error) {
      console.error("Password verification error:", error);

      setMessage(
        error instanceof Error ? error.message : "Password verification failed",
      );
    }
  };

  // ==========================================
  // Download file
  // ==========================================

 const handleDownload = async () => {
  try {
    setDownloading(true);
    setMessage("");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/share/${shareToken}/download`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      let errorMessage = "Unable to download the file.";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        errorMessage = data?.message || errorMessage;
      } else {
        // Backend returned HTML error page
        if (response.status === 403) {
          errorMessage = "This share link has expired.";
        } else if (response.status === 401) {
          errorMessage = "Access denied. Please verify the password.";
        }
      }

      setMessage(errorMessage);
      return;
    }

    const data = await response.json();

    if (!data?.data?.downloadUrl) {
      setMessage("Unable to download the file.");
      return;
    }

    window.location.href = data.data.downloadUrl;
  } catch (error) {
    console.error("Download error:", error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to download the file."
    );
  } finally {
    setDownloading(false);
  }
};
  // ==========================================
  // Helper functions
  // ==========================================

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getFileLabel = () => {
    if (!file) return "FILE";

    if (file.mimeType === "application/pdf") {
      return "PDF";
    }

    if (file.mimeType.startsWith("image/")) {
      return "IMG";
    }

    if (file.mimeType.includes("word") || file.mimeType.includes("document")) {
      return "DOC";
    }

    if (
      file.mimeType.includes("excel") ||
      file.mimeType.includes("spreadsheet")
    ) {
      return "XLS";
    }

    return "FILE";
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-cream p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brown-dark text-2xl font-bold text-cream">
            V
          </div>

          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-4 border-beige-light border-t-gold" />

          <h2 className="mt-5 text-xl font-bold text-brown-dark">
            Opening shared vault...
          </h2>

          <p className="mt-2 text-sm text-brown-warm">
            Please wait while we securely load your file.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Error
  // ==========================================

  if (!file || !shareDetails) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-cream p-6 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-gold">
            Access unavailable
          </p>

          <h2 className="mt-2 text-2xl font-bold text-brown-dark">
            Unable to open this file
          </h2>

          <p className="mt-3 text-sm leading-6 text-brown-warm">
            {message || "This share link may be invalid, expired, or disabled."}
          </p>

          <div className="mt-7 border-t border-brown-primary/10 pt-5">
            <p className="text-sm font-semibold text-brown-dark">VaultShare</p>
            <p className="mt-1 text-xs text-brown-warm">Secure file sharing</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-beige">
      {/* ================= HEADER ================= */}
      <header className="border-b border-brown-primary/10 bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brown-dark text-lg font-bold text-cream">
              V
            </div>

            <div>
              <h1 className="text-lg font-bold text-brown-dark">VaultShare</h1>
              <p className="text-xs text-brown-warm">Secure file sharing</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm text-brown-warm sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Secure access
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Shared label */}
          <div className="mb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
              Someone shared a file with you
            </p>
          </div>

          {/* Main card */}
          <section className="overflow-hidden rounded-3xl border border-brown-primary/10 bg-cream shadow-xl">
            {/* File header */}
            <div className="border-b border-brown-primary/10 bg-beige/60 p-5 sm:p-8">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brown-dark text-lg font-extrabold text-cream shadow-lg">
                  {getFileLabel()}
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    className="break-words text-xl font-bold text-brown-dark sm:text-2xl"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h2>

                  <p className="mt-2 text-sm text-brown-warm">
                    {file.mimeType}
                  </p>
                </div>
              </div>
            </div>

            {/* File information */}
            <div className="grid grid-cols-2 divide-x divide-brown-primary/10 border-b border-brown-primary/10">
              <div className="p-4 text-center sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brown-warm">
                  File size
                </p>

                <p className="mt-2 text-sm font-bold text-brown-dark sm:text-base">
                  {formatFileSize(file.sizeBytes)}
                </p>
              </div>

              <div className="p-4 text-center sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brown-warm">
                  Security
                </p>

                <p className="mt-2 text-sm font-bold text-brown-dark sm:text-base">
                  {shareDetails.passwordProtected ? "Protected" : "Open access"}
                </p>
              </div>
            </div>

            {/* ================= MESSAGE ================= */}
            {message && (
              <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 sm:mx-8">
                {message}
              </div>
            )}

            {/* ================= PASSWORD ================= */}
            {!verified && shareDetails.passwordProtected && (
              <div className="p-5 sm:p-8">
                <div className="rounded-2xl bg-beige/70 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brown-primary text-cream">
                      🔒
                    </div>

                    <div>
                      <h3 className="font-bold text-brown-dark">
                        This file is protected
                      </h3>

                      <p className="mt-1 text-sm text-brown-warm">
                        Enter the password provided by the sender to unlock it.
                      </p>
                    </div>
                  </div>

                  <input
                    type="password"
                    placeholder="Enter file password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleVerifyPassword();
                      }
                    }}
                    className="mt-5 w-full rounded-xl border border-brown-primary/15 bg-cream px-4 py-3.5 text-sm text-brown-dark outline-none transition placeholder:text-brown-warm/60 focus:border-brown-primary focus:ring-4 focus:ring-brown-primary/10"
                  />

                  <button
                    onClick={handleVerifyPassword}
                    disabled={!password.trim()}
                    className="mt-3 w-full rounded-xl bg-brown-primary px-5 py-3.5 text-sm font-bold text-cream transition hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Unlock File
                  </button>
                </div>
              </div>
            )}

            {/* ================= DOWNLOAD ================= */}
            {verified && (
              <div className="p-5 sm:p-8">
                <div className="rounded-2xl bg-beige/70 p-6 text-center sm:p-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20 text-2xl">
                    ✓
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-brown-dark">
                    File ready for you
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brown-warm">
                    Your access has been verified. You can now securely download
                    this file.
                  </p>

                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="mt-6 w-full rounded-xl bg-brown-dark px-5 py-4 text-sm font-bold text-cream shadow-lg transition hover:bg-brown-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloading ? "Downloading..." : "↓ Download File"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="border-t border-brown-primary/10 px-5 py-4 text-center sm:px-8">
              <p className="text-xs leading-5 text-brown-warm">
                This file was securely shared through{" "}
                <span className="font-bold text-brown-dark">VaultShare</span>.
              </p>
            </div>
          </section>

          {/* Small security note */}
          <p className="mt-5 text-center text-xs text-brown-warm/80">
            Only download files from people you trust.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PublicSharePage;
