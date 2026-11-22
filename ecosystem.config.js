/* =========================================================
   PM2 — fait tourner le site et le récepteur du direct en continu
   sur le serveur, et les relance après un plantage ou un redémarrage.

   Sur le serveur :
     pm2 start ecosystem.config.js
     pm2 save
   ========================================================= */
module.exports = {
  apps: [
    {
      name: "151-site",
      script: "server.js",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
    },
    {
      name: "151-direct",
      script: "scripts/direct-local.js",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
      restart_delay: 3000,
    },
  ],
};
