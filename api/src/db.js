const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

/**
 * Banco de dados simples em arquivo JSON.
 * Ideal para estudo: não precisa instalar nenhum banco.
 * Use o caminho ":memory:" para manter tudo só na memória (usado nos testes).
 */
function createDb(file) {
  const inMemory = file === ":memory:";
  let data = { users: [], posts: [] };

  if (!inMemory && fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, "utf-8"));
  }

  function save() {
    if (inMemory) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  const newId = () => crypto.randomUUID();

  return {
    // ---------- Usuários ----------
    findUserByLogin(login) {
      const value = String(login).toLowerCase();
      return data.users.find(
        (u) => u.username.toLowerCase() === value || u.email.toLowerCase() === value
      );
    },
    findUserById(id) {
      return data.users.find((u) => u.id === id);
    },
    createUser({ username, email, name, passwordHash }) {
      const user = {
        id: newId(),
        username,
        email,
        name,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      save();
      return user;
    },

    // ---------- Posts ----------
    listPosts() {
      return [...data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    findPost(id) {
      return data.posts.find((p) => p.id === id);
    },
    createPost({ authorId, imageUrl, caption }) {
      const post = {
        id: newId(),
        authorId,
        imageUrl,
        caption,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      data.posts.push(post);
      save();
      return post;
    },
    deletePost(id) {
      data.posts = data.posts.filter((p) => p.id !== id);
      save();
    },
    toggleLike(post, userId) {
      const liked = post.likes.includes(userId);
      post.likes = liked ? post.likes.filter((id) => id !== userId) : [...post.likes, userId];
      save();
      return !liked;
    },
    addComment(post, { authorId, text }) {
      const comment = { id: newId(), authorId, text, createdAt: new Date().toISOString() };
      post.comments.push(comment);
      save();
      return comment;
    },
    deleteComment(post, commentId) {
      post.comments = post.comments.filter((c) => c.id !== commentId);
      save();
    },
  };
}

module.exports = { createDb };
