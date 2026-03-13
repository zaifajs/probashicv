/**
 * PM2 config: start with NODE_ENV=production so the app uses *_PROD env vars.
 * From repo root: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "probashicv",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
