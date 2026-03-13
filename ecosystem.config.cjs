const path = require("path");

/**
 * PM2 config: start with NODE_ENV=production so the app uses *_PROD env vars.
 * From repo root: pm2 start ecosystem.config.cjs
 * cwd is explicit so PM2 always uses this repo dir (not a stale path from dump).
 */
module.exports = {
  apps: [
    {
      name: "probashicv",
      script: "npm",
      args: "run start",
      cwd: path.resolve(__dirname),
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
