import jwt, { SignOptions } from "jsonwebtoken";

const generateToken = (userId: number | string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign(
    { userId },
    secret,
    options
  );
};

export default generateToken;