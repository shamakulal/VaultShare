import multer from "multer";

import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
} from "../config/uploadConfig";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  const lastDotIndex = file.originalname.lastIndexOf(".");
  const extension =
    lastDotIndex >= 0
      ? file.originalname
          .slice(lastDotIndex)
          .toLowerCase()
      : "";

  const isMimeTypeAllowed = ALLOWED_MIME_TYPES.includes(
    file.mimetype
  );

  const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(
    extension
  );

  if (!isMimeTypeAllowed || !isExtensionAllowed) {
    return cb(
      new Error(
        "Invalid file type. Only images, PDF, text, DOCX, XLSX, and PPTX files are allowed."
      )
    );
  }

  cb(null, true);
};


export const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter,
});