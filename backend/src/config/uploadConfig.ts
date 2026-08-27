export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",

  // Documents
  "application/pdf",
  "text/plain",

  // Microsoft Office
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".txt",
  ".docx",
  ".xlsx",
  ".pptx",
];