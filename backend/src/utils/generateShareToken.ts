import crypto from "crypto";

const generateShareToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export default generateShareToken;