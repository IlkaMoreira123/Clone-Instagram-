const jwt = require("jsonwebtoken");

/** Exige o cabeçalho "Authorization: Bearer <token>" e coloca o usuário em req.user. */
function requireAuth(secret, db) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Faça login para continuar." });
    }

    try {
      const payload = jwt.verify(token, secret);
      const user = db.findUserById(payload.sub);
      if (!user) return res.status(401).json({ error: "Usuário não encontrado." });
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
  };
}

module.exports = { requireAuth };
