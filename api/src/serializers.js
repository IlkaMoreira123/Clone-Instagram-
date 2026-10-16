/** Remove dados sensíveis (como a senha) antes de enviar o usuário ao cliente. */
function publicUser(user) {
  if (!user) return null;
  const { id, username, name } = user;
  return { id, username, name };
}

/** Monta o post no formato que o front-end usa. */
function publicPost(post, db, viewerId) {
  return {
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    author: publicUser(db.findUserById(post.authorId)),
    likesCount: post.likes.length,
    likedByMe: viewerId ? post.likes.includes(viewerId) : false,
    comments: post.comments.map((c) => ({
      id: c.id,
      text: c.text,
      author: publicUser(db.findUserById(c.authorId)),
      createdAt: c.createdAt,
    })),
    createdAt: post.createdAt,
  };
}

module.exports = { publicUser, publicPost };
