const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { publicUser } = require("../serializers");

function authRoutes({ db, secret, requireAuth }) {
  const router = express.Router();

  const makeToken = (user) => jwt.sign({ sub: user.id }, secret, { expiresIn: "7d" });

  // POST /api/auth/register  { username, email, name, password }
  router.post("/register", async (req, res) => {
    const { username, email, name, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Informe usuário, e-mail e senha." });
    }
    if (!/^[a-zA-Z0-9._]{3,30}$/.test(username)) {
      return res
        .status(400)
        .json({ error: "Usuário deve ter 3 a 30 caracteres: letras, números, ponto ou _." });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "A senha precisa ter pelo menos 6 caracteres." });
    }
    if (db.findUserByLogin(username) || db.findUserByLogin(email)) {
      return res.status(409).json({ error: "Usuário ou e-mail já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = db.createUser({ username, email, name: name || username, passwordHash });

    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  });

  // POST /api/auth/login  { username, password }  (username aceita usuário ou e-mail)
  router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    const user = username ? db.findUserByLogin(username) : null;

    const ok = user && (await bcrypt.compare(String(password || ""), user.passwordHash));
    if (!ok) {
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }

    res.json({ token: makeToken(user), user: publicUser(user) });
  });

  // GET /api/auth/me
  router.get("/me", requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  return router;
}

module.exports = { authRoutes };
