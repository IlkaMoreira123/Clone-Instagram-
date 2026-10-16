const path = require("node:path");
const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "troque-este-segredo";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "..", "data", "db.json");

if (!process.env.JWT_SECRET) {
  console.warn("Aviso: JWT_SECRET não definido. Usando um segredo padrão (só para desenvolvimento).");
}

const app = createApp({ dbFile: DB_FILE, jwtSecret: JWT_SECRET });

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
