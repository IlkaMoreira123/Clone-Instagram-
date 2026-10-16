const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { createDb } = require("./db");
const { requireAuth } = require("./middleware/auth");
const { authRoutes } = require("./routes/auth");
const { postRoutes } = require("./routes/posts");

/**
 * Cria o app Express. Recebe as configurações por parâmetro
 * para facilitar os testes (banco em memória, segredo fixo etc.).
 */
function createApp({ dbFile = ":memory:", jwtSecret = "dev-secret", serveFrontend = true } = {}) {
  const app = express();
  const db = createDb(dbFile);
  const auth = requireAuth(jwtSecret, db);

  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes({ db, secret: jwtSecret, requireAuth: auth }));
  app.use("/api/posts", postRoutes({ db, requireAuth: auth }));

  // Rota de API inexistente
  app.use("/api", (req, res) => res.status(404).json({ error: "Rota não encontrada." }));

  // Serve o front-end (index.html, feed.html, css, img, js)
  if (serveFrontend) {
    app.use(express.static(path.join(__dirname, "..", "..", "10_clone instagram")));
  }

  // JSON inválido ou erro inesperado
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "JSON inválido." });
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  });

  return app;
}

module.exports = { createApp };
