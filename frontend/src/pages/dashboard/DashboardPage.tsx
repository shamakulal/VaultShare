import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import Toast from "../../components/Toast";
import ShareFileModal from "../../components/ShareFileModal";
import QRCodeModal from "../../components/QRCodeModal";
import DownloadAnalyticsModal from "../../components/DownloadAnalyticsModal";
interface FileItem {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  visibility: string;
  created_at: string;
}

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [createdShareUrl, setCreatedShareUrl] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showDownloadAnalytics, setShowDownloadAnalytics] = useState(false);
  const [analyticsFile, setAnalyticsFile] = useState<FileItem | null>(null);
  const [analyticsDownloadCount, setAnalyticsDownloadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [downloadLoading, setDownloadLoading] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState<number | null>(
    null,
  );
  // ==========================================
  // Load user's files
  // ==========================================
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setToastType(type);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/files`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch files");
      }

      setFiles(data.data.files || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to fetch files",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Load files when page opens
  // ==========================================

  useEffect(() => {
    fetchFiles();
  }, []);

  // ==========================================
  // Upload file
  // ==========================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      setMessage("");

      // ==========================================
      // STEP 1: Ask backend for signed upload URL
      // ==========================================

      const urlResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/files/upload-url`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
          }),
        },
      );

      const urlData = await urlResponse.json();

      if (!urlResponse.ok) {
        throw new Error(urlData.message || "Failed to prepare upload");
      }

      const { path: storageKey } = urlData.data;

      // ==========================================
      // STEP 2: Upload DIRECTLY to Supabase
      // ==========================================

      const { error: uploadError } = await supabase.storage
        .from("vaultshare-files")
        .upload(storageKey, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);

        throw new Error(
          uploadError.message || "Failed to upload file to storage",
        );
      }

      // ==========================================
      // STEP 3: Save metadata in MySQL
      // ==========================================

      const completeResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/files/upload-complete`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalName: selectedFile.name,
            storageKey,
            mimeType: selectedFile.type,
            sizeBytes: selectedFile.size,
          }),
        },
      );

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(
          completeData.message || "Failed to save file information",
        );
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      setSelectedFile(null);

      showToast("File uploaded successfully!");

      await fetchFiles();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "File upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Logout
  // ==========================================
  const handleShare = (file: FileItem) => {
    setShareFile(file);

    setSharePassword("");
    setShareExpiry("");
    setMaxDownloads("");
    setCreatedShareUrl("");
  };

  const handleCreateShareLink = async () => {
    if (!shareFile) return;

    // Private files require a password
    if (shareFile.visibility === "private" && !sharePassword.trim()) {
      setMessage("A password is required before sharing a private file");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const body = {
        password: sharePassword.trim() || undefined,
        expiresAt: shareExpiry
          ? new Date(shareExpiry).toISOString()
          : undefined,
        maxDownloads: maxDownloads ? Number(maxDownloads) : undefined,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/share/files/${shareFile.id}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const contentType = response.headers.get("content-type");

      let data: any;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(text || "Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create share link");
      }

      console.log("Share link response:", data);

      const shareToken = data.data?.shareLink?.shareToken;

      if (!shareToken) {
        throw new Error(
          "Share link was created, but no share token was returned",
        );
      }

      const publicUrl = `${window.location.origin}/share/${shareToken}`;

      setCreatedShareUrl(publicUrl);

      showToast("Share link created successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create share link",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(createdShareUrl);

      showToast("Share link copied!");
    } catch {
      showToast("Failed to copy share link");
    }
  };
  const handleSharePasswordChange = (value: string) => {
    setSharePassword(value);

    if (message.includes("password")) {
      setMessage("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };
  const handleDownload = async (fileId: number) => {
    try {
      setDownloadLoading(fileId);
      setMessage("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/${fileId}/download`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let errorMessage = "Failed to download file.";

        if (contentType.includes("application/json")) {
          const data = await response.json();
          errorMessage = data?.message || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data?.data?.downloadUrl) {
        throw new Error("Download URL was not returned by the server.");
      }

      // Direct browser download.
      // Do NOT fetch the Supabase URL from JavaScript.
      // Download using the original uploaded filename
      const downloadResponse = await fetch(data.data.downloadUrl);

      if (!downloadResponse.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await downloadResponse.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = data.data.fileName || "download";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to download file",
        "error",
      );
    } finally {
      setDownloadLoading(null);
    }
  };
  const handleDeleteFile = async (fileId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this file?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(fileId);
      setMessage("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/${fileId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete file");
      }

      setFiles((previousFiles) =>
        previousFiles.filter((file) => file.id !== fileId),
      );

      showToast("File deleted successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete file",
      );
    } finally {
      setDeleteLoading(null);
    }
  };
  const handleOpenDownloadAnalytics = async (file: FileItem) => {
    try {
      setAnalyticsFile(file);
      setShowDownloadAnalytics(true);
      setAnalyticsDownloadCount(0);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/${file.id}/analytics`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Failed to load analytics");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load analytics");
      }

      setAnalyticsDownloadCount(Number(data.data?.downloadCount || 0));
    } catch (error) {
      console.error("Analytics error:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to load analytics",
        "error",
      );
    }
  };
  const handleVisibilityChange = async (
    fileId: number,
    newVisibility: "private" | "public",
  ) => {
    try {
      setVisibilityLoading(fileId);
      setMessage("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/${fileId}/visibility`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visibility: newVisibility,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update file visibility");
      }

      // Update the file immediately in the UI
      setFiles((previousFiles) =>
        previousFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                visibility: newVisibility,
              }
            : file,
        ),
      );

      showToast(
        `File is now ${newVisibility === "public" ? "public" : "private"}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update file visibility",
      );
    } finally {
      setVisibilityLoading(null);
    }
  };
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.original_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesVisibility =
      visibilityFilter === "all" || file.visibility === visibilityFilter;

    return matchesSearch && matchesVisibility;
  });
  const getFileType = (mimeType: string) => {
    if (mimeType === "application/pdf") {
      return {
        label: "PDF",
        icon: "📄",
      };
    }

    if (mimeType.startsWith("image/")) {
      return {
        label: "IMAGE",
        icon: "🖼️",
      };
    }

    if (mimeType.includes("word") || mimeType.includes("document")) {
      return {
        label: "DOC",
        icon: "📝",
      };
    }

    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return {
        label: "XLS",
        icon: "📊",
      };
    }

    if (mimeType.includes("zip") || mimeType.includes("compressed")) {
      return {
        label: "ZIP",
        icon: "📦",
      };
    }

    if (mimeType.startsWith("video/")) {
      return {
        label: "VIDEO",
        icon: "🎬",
      };
    }

    if (mimeType.startsWith("audio/")) {
      return {
        label: "AUDIO",
        icon: "🎵",
      };
    }

    return {
      label: "FILE",
      icon: "📁",
    };
  };

  return (
    <div className="min-h-screen bg-beige text-brown-dark">
      <Toast message={message} type={toastType} />
      {/* {toast && (
        <div className="fixed right-5 top-5 z-[9999] animate-in rounded-xl bg-brown-dark px-5 py-3 text-sm font-semibold text-cream shadow-xl">
          ✓ {toast}
        </div>
      )} */}

      {/* ================= HEADER ================= */}
      <header className="border-b border-brown-warm/20 bg-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brown-dark text-xl font-bold text-cream shadow-lg">
              V
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-brown-dark sm:text-2xl">
                VaultShare
              </h1>
              <p className="hidden text-xs text-brown-warm sm:block">
                Your secure personal vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-brown-warm">Signed in as</p>
              <p className="max-w-35 truncate text-sm font-semibold text-brown-dark">
                {user?.name || "User"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-beige-light font-bold text-brown-primary">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-brown-primary/20 bg-cream px-3 py-2 text-sm font-semibold text-brown-primary transition hover:bg-brown-dark hover:text-cream sm:px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Welcome */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Personal workspace
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-brown-dark sm:text-4xl">
            Good to see you, {user?.name?.split(" ")[0] || "there"}.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-brown-warm sm:text-base">
            Upload, organize, protect and share your files from one secure
            place.
          </p>
        </section>

        {/* ================= STATS ================= */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brown-primary/10 bg-cream p-5 shadow-sm">
            <p className="text-sm text-brown-warm">Total files</p>
            <p className="mt-2 text-3xl font-bold text-brown-dark">
              {files.length}
            </p>
          </div>

          <div className="rounded-2xl border border-brown-primary/10 bg-cream p-5 shadow-sm">
            <p className="text-sm text-brown-warm">Private files</p>
            <p className="mt-2 text-3xl font-bold text-brown-dark">
              {files.filter((file) => file.visibility === "private").length}
            </p>
          </div>

          <div className="rounded-2xl border border-brown-primary/10 bg-cream p-5 shadow-sm">
            <p className="text-sm text-brown-warm">Shared files</p>
            <p className="mt-2 text-3xl font-bold text-brown-dark">
              {files.filter((file) => file.visibility === "public").length}
            </p>
          </div>
        </section>

        {/* ================= UPLOAD AREA ================= */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-brown-dark shadow-xl">
          <div className="grid lg:grid-cols-[1fr_1.4fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
                Secure upload
              </p>

              <h2 className="mt-3 text-2xl font-bold text-cream sm:text-3xl">
                Add something to your vault.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-beige-light">
                Select a file and securely store it in your personal VaultShare
                workspace.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm text-beige-light">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Your files remain under your account
              </div>
            </div>

            <div className="bg-cream p-5 sm:p-6 lg:p-8">
              <label
                htmlFor="file-upload"
                className="group flex min-h-45 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brown-warm/30 bg-beige/40 p-6 text-center transition hover:border-brown-primary hover:bg-beige"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brown-dark text-2xl text-cream transition group-hover:scale-110">
                  ↑
                </div>

                <p className="mt-4 font-semibold text-brown-dark">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a file from your device"}
                </p>

                <p className="mt-1 text-sm text-brown-warm">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB selected`
                    : "Click here to browse your files"}
                </p>

                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                />
              </label>

              {loading ? (
                <div className="mt-4 w-full rounded-xl bg-beige-light p-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-brown-dark">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>

                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-brown-primary/10">
                    <div
                      className="h-full rounded-full bg-brown-primary transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-center text-xs text-brown-warm">
                    Please don't close this page while the file is uploading.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="mt-4 w-full rounded-xl bg-brown-primary px-5 py-3.5 text-sm font-bold text-cream transition hover:bg-brown-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upload to Vault
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================= MESSAGE ================= */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-medium shadow-sm ${
              message.toLowerCase().includes("success") ||
              message.toLowerCase().includes("uploaded") ||
              message.toLowerCase().includes("deleted")
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-bold shadow-sm">
              {message.toLowerCase().includes("success") ||
              message.toLowerCase().includes("uploaded") ||
              message.toLowerCase().includes("deleted")
                ? "✓"
                : "!"}
            </span>

            <span>{message}</span>

            <button
              onClick={() => setMessage("")}
              className="ml-auto text-lg font-bold opacity-60 transition hover:opacity-100"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}

        {/* ================= FILES HEADER ================= */}
        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              Vault contents
            </p>

            <h2 className="mt-1 text-2xl font-bold text-brown-dark sm:text-3xl">
              My Files
            </h2>
          </div>

          <p className="text-sm text-brown-warm">
            {files.length} {files.length === 1 ? "file" : "files"} stored
          </p>
        </section>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* ================= SMART SEARCH ================= */}
          <div className="relative w-full md:max-w-md">
            {/* Search icon */}
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-warm">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-brown-primary/15 bg-cream py-3 pl-11 pr-11 text-sm text-brown-dark outline-none transition placeholder:text-brown-warm/60 focus:border-brown-primary focus:ring-4 focus:ring-brown-primary/10"
            />

            {/* Clear search */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-sm font-bold text-brown-warm transition hover:bg-beige hover:text-brown-dark"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex rounded-xl border border-brown-primary/10 bg-cream p-1 shadow-sm">
            <button
              onClick={() => setVisibilityFilter("all")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                visibilityFilter === "all"
                  ? "bg-brown-dark text-cream shadow-sm"
                  : "text-brown-warm hover:bg-beige"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setVisibilityFilter("private")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                visibilityFilter === "private"
                  ? "bg-brown-dark text-cream shadow-sm"
                  : "text-brown-warm hover:bg-beige"
              }`}
            >
              Private
            </button>

            <button
              onClick={() => setVisibilityFilter("public")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                visibilityFilter === "public"
                  ? "bg-brown-dark text-cream shadow-sm"
                  : "text-brown-warm hover:bg-beige"
              }`}
            >
              Public
            </button>
          </div>
        </div>

        {/* ================= LOADING ================= */}
        {loading && files.length === 0 && (
          <div className="rounded-2xl border border-brown-primary/10 bg-cream p-8 text-center text-brown-warm">
            Loading your vault...
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!loading && files.length === 0 && (
          <div className="rounded-3xl border border-dashed border-brown-warm/30 bg-cream p-10 text-center sm:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-beige text-3xl">
              📁
            </div>

            <h3 className="mt-5 text-xl font-bold text-brown-dark">
              Your vault is empty
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brown-warm">
              Upload your first file above and it will appear here.
            </p>
          </div>
        )}
        {files.length > 0 && filteredFiles.length === 0 && (
          <div className="rounded-3xl border border-dashed border-brown-warm/30 bg-cream p-10 text-center">
            <div className="text-4xl">🔎</div>

            <h3 className="mt-4 text-lg font-bold text-brown-dark">
              No files found
            </h3>

            <p className="mt-2 text-sm text-brown-warm">
              {searchQuery
                ? `No files match "${searchQuery}".`
                : "Try changing your search or filter."}
            </p>

            <button
              onClick={() => {
                setSearchQuery("");
                setVisibilityFilter("all");
              }}
              className="mt-5 rounded-xl bg-brown-primary px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-brown-dark"
            >
              Clear Filters
            </button>
          </div>
        )}
        {/* ================= FILE GRID ================= */}
        {filteredFiles.length > 0 && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFiles.map((file) => {
              // const isImage = file.mime_type.startsWith("image/");
              // const isPdf = file.mime_type === "application/pdf";
              const fileType = getFileType(file.mime_type);
              return (
                <article
                  key={file.id}
                  className="group overflow-hidden rounded-2xl border border-brown-primary/10 bg-cream shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between bg-beige/70 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brown-dark text-xl shadow-sm">
                      {fileType.icon}
                    </div>

                    <select
                      value={file.visibility}
                      disabled={visibilityLoading === file.id}
                      onChange={(event) =>
                        handleVisibilityChange(
                          file.id,
                          event.target.value as "private" | "public",
                        )
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        file.visibility === "public"
                          ? "border-gold/30 bg-gold/20 text-brown-primary"
                          : "border-brown-dark/10 bg-brown-dark/10 text-brown-dark"
                      }`}
                    >
                      <option value="private">🔒 Private</option>

                      <option value="public">🌐 Public</option>
                    </select>
                  </div>

                  <div className="p-5">
                    <h3
                      className="truncate text-base font-bold text-brown-dark"
                      title={file.original_name}
                    >
                      {file.original_name}
                    </h3>

                    <p className="mt-2 truncate text-xs text-brown-warm">
                      {file.mime_type}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-brown-primary/10 pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-warm">
                          Size
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brown-dark">
                          {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-warm">
                          Uploaded
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brown-dark">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {/* DOWNLOAD */}
                      <button
                        type="button"
                        onClick={() => handleDownload(file.id)}
                        disabled={downloadLoading === file.id}
                        className="rounded-lg bg-beige px-2 py-2.5 text-xs font-bold text-brown-dark transition hover:bg-beige-light disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadLoading === file.id
                          ? "Downloading..."
                          : "Download"}
                      </button>

                      {/* SHARE */}
                      <button
                        type="button"
                        onClick={() => handleShare(file)}
                        className="rounded-lg bg-gold px-2 py-2.5 text-xs font-bold text-brown-dark transition hover:brightness-95"
                      >
                        Share
                      </button>

                      {/* ANALYTICS */}
                      <button
                        type="button"
                        onClick={() => handleOpenDownloadAnalytics(file)}
                        className="rounded-xl border border-brown-primary/20 bg-cream px-3 py-2 text-sm font-semibold text-brown-dark transition hover:bg-beige"
                      >
                        Analytics
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deleteLoading === file.id}
                        className="col-span-3 rounded-lg border border-red-200 bg-red-50 px-2 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deleteLoading === file.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* ================= SHARE MODAL ================= */}
      {/* ================= SHARE MODAL ================= */}

      <ShareFileModal
        shareFile={shareFile}
        createdShareUrl={createdShareUrl}
        sharePassword={sharePassword}
        shareExpiry={shareExpiry}
        maxDownloads={maxDownloads}
        loading={loading}
        message={message}
        onClose={() => {
          setShareFile(null);
          setCreatedShareUrl("");
        }}
        onCopyShareLink={handleCopyShareLink}
        onCreateShareLink={handleCreateShareLink}
        onPasswordChange={handleSharePasswordChange}
        onExpiryChange={setShareExpiry}
        onMaxDownloadsChange={setMaxDownloads}
        onOpenQRCode={() => setShowQRCode(true)}
      />
      {showQRCode && createdShareUrl && (
        <QRCodeModal
          shareUrl={createdShareUrl}
          onClose={() => setShowQRCode(false)}
        />
      )}
      {showDownloadAnalytics && analyticsFile && (
        <DownloadAnalyticsModal
          fileName={analyticsFile.original_name}
          downloadCount={analyticsDownloadCount}
          createdAt={analyticsFile.created_at}
          onClose={() => setAnalyticsFile(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
