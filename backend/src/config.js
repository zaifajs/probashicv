import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envDir = path.resolve(__dirname, "..");
const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

// Load single .env file (gitignored). Use _LOCAL / _PROD suffixes for per-environment values.
dotenv.config({ path: path.join(envDir, ".env") });

function get(key, defaultValue = "") {
  const val = process.env[key];
  if (val !== undefined && val !== "") return val;
  const suffixed = process.env[isProduction ? `${key}_PROD` : `${key}_LOCAL`];
  if (suffixed !== undefined && suffixed !== "") return suffixed;
  return defaultValue;
}

// Prisma reads process.env.DATABASE_URL at load time; set it so _LOCAL/_PROD works
const databaseUrl = get("DATABASE_URL");
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

export const config = {
  port: Number(get("PORT") || 4000),
  jwtSecret: get("JWT_SECRET", "dev-secret"),
  openAiApiKey: get("OPENAI_API_KEY", ""),
  frontendUrl: get("FRONTEND_URL", isProduction ? "https://cv.divsketch.com" : "http://localhost:5173")
};
