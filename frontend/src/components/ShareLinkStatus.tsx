interface ShareLinkStatusProps {
  expiresAt?: string | null;
  downloadCount?: number;
  maxDownloads?: number | null;
}

const ShareLinkStatus = ({
  expiresAt,
  downloadCount = 0,
  maxDownloads,
}: ShareLinkStatusProps) => {
  const isExpired =
    expiresAt && new Date(expiresAt.replace(" ", "T")) <= new Date();

  const isDownloadLimitReached =
    maxDownloads !== null &&
    maxDownloads !== undefined &&
    downloadCount >= maxDownloads;

  let status = "Active";
  let statusClass = "bg-green-100 text-green-700";

  if (isExpired) {
    status = "Expired";
    statusClass = "bg-red-100 text-red-700";
  } else if (isDownloadLimitReached) {
    status = "Limit reached";
    statusClass = "bg-orange-100 text-orange-700";
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
      >
        {status}
      </span>

      <span className="text-xs text-brown-primary">
        {downloadCount} /{" "}
        {maxDownloads === null || maxDownloads === undefined
          ? "∞"
          : maxDownloads}{" "}
        downloads
      </span>
    </div>
  );
};

export default ShareLinkStatus;