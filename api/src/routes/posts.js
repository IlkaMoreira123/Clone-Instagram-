const express = require("express");
const { publicPost } = require("../serializers");

function postRoutes({ db, requireAuth }) {
  const router = express.Router();

  // Todas as rotas de posts exigem login
  router.use(requireAuth);

  // Busca o post pelo :id e devolve 404 se não existir
  router.param("id", (req, res, next, id) => {
    const post = db.findPost(id);
    if (!post) return res.status(404).json({ error: "Post não encontrado." });
    req.post = post;
    next();
  });

  // GET /api/posts  → feed (mais recentes primeiro)
  router.get("/", (req, res) => {
    res.json({ posts: db.listPosts().map((p) => publicPost(p, db, req.user.id)) });
  });

  // GET /api/posts/:id
  router.get("/:id", (req, res) => {
    res.json({ post: publicPost(req.post, db, req.user.id) });
  });

  // POST /api/posts  { imageUrl, caption }
  router.post("/", (req, res) => {
    const { imageUrl, caption = "" } = req.body || {};

    if (!imageUrl || !/^https?:\/\/\S+$/.test(imageUrl)) {
      return res.status(400).json({ error: "Informe um link de imagem válido (http ou https)." });
    }
    if (String(caption).length > 2200) {
      return res.status(400).json({ error: "A legenda pode ter no máximo 2200 caracteres." });
    }

    const post = db.createPost({ authorId: req.user.id, imageUrl, caption: String(caption) });
    res.status(201).json({ post: publicPost(post, db, req.user.id) });
  });

  // DELETE /api/posts/:id  (somente o autor)
  router.delete("/:id", (req, res) => {
    if (req.post.authorId !== req.user.id) {
      return res.status(403).json({ error: "Você só pode apagar seus próprios posts." });
    }
    db.deletePost(req.post.id);
    res.status(204).end();
  });

  // POST /api/posts/:id/like  → curte ou descurte
  router.post("/:id/like", (req, res) => {
    const liked = db.toggleLike(req.post, req.user.id);
    res.json({ liked, likesCount: req.post.likes.length });
  });

  // POST /api/posts/:id/comments  { text }
  router.post("/:id/comments", (req, res) => {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "O comentário não pode ser vazio." });
    if (text.length > 500) {
      return res.status(400).json({ error: "O comentário pode ter no máximo 500 caracteres." });
    }

    db.addComment(req.post, { authorId: req.user.id, text });
    res.status(201).json({ post: publicPost(req.post, db, req.user.id) });
  });

  // DELETE /api/posts/:id/comments/:commentId  (autor do comentário ou do post)
  router.delete("/:id/comments/:commentId", (req, res) => {
    const comment = req.post.comments.find((c) => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comentário não encontrado." });

    const canDelete = comment.authorId === req.user.id || req.post.authorId === req.user.id;
    if (!canDelete) {
      return res.status(403).json({ error: "Você não pode apagar este comentário." });
    }

    db.deleteComment(req.post, comment.id);
    res.status(204).end();
  });

  return router;
}

module.exports = { postRoutes };
