import "dotenv/config";
import app from "./app";
import pool from "./config/db";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();

    console.log("Database connected successfully");

    connection.release();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VaultShare API running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();