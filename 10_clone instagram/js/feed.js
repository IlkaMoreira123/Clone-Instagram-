// Sem login? Volta para a tela de entrada.
if (!auth.token) location.href = "index.html";

const postsEl = document.querySelector("#posts");
const statusEl = document.querySelector("#feed-status");
const newPostForm = document.querySelector("#new-post-form");
const template = document.querySelector("#post-template");
const me = auth.user;

document.querySelector("#current-user").textContent = me ? `@${me.username}` : "";

document.querySelector("#logout-btn").addEventListener("click", () => {
  auth.clear();
  location.href = "index.html";
});

// Se o token expirar, desloga
function handleError(error) {
  if (error.status === 401) {
    auth.clear();
    location.href = "index.html";
    return;
  }
  alert(error.message);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

// Cria o HTML de um comentário usando textContent (evita injeção de HTML)
function renderComment(post, comment) {
  const li = document.createElement("li");
  const name = document.createElement("strong");
  name.textContent = comment.author?.username ?? "usuário";
  const text = document.createElement("span");
  text.textContent = comment.text;
  li.append(name, text);

  const canDelete = comment.author?.id === me?.id || post.author?.id === me?.id;
  if (canDelete) {
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-comment";
    del.textContent = "apagar";
    del.addEventListener("click", async () => {
      try {
        await api(`/posts/${post.id}/comments/${comment.id}`, { method: "DELETE" });
        li.remove();
      } catch (error) {
        handleError(error);
      }
    });
    li.append(del);
  }
  return li;
}

function renderPost(post) {
  const node = template.content.firstElementChild.cloneNode(true);
  const author = post.author?.username ?? "usuário";

  node.querySelector(".avatar").textContent = author[0].toUpperCase();
  node.querySelector(".post-author").textContent = author;
  node.querySelector(".post-image").src = post.imageUrl;
  node.querySelector(".post-image").alt = post.caption || `Post de ${author}`;
  node.querySelector(".post-date").textContent = formatDate(post.createdAt);

  const caption = node.querySelector(".caption");
  if (post.caption) {
    const name = document.createElement("strong");
    name.textContent = author;
    caption.append(name, document.createTextNode(post.caption));
  } else {
    caption.remove();
  }

  // Curtidas
  const likeBtn = node.querySelector(".like-btn");
  const likesEl = node.querySelector(".likes");
  function updateLikes(liked, count) {
    likeBtn.textContent = liked ? "♥" : "♡";
    likeBtn.classList.toggle("liked", liked);
    likeBtn.setAttribute("aria-label", liked ? "Descurtir" : "Curtir");
    likesEl.textContent = `${count} curtida${count === 1 ? "" : "s"}`;
  }
  updateLikes(post.likedByMe, post.likesCount);

  likeBtn.addEventListener("click", async () => {
    try {
      const { liked, likesCount } = await api(`/posts/${post.id}/like`, { method: "POST" });
      updateLikes(liked, likesCount);
    } catch (error) {
      handleError(error);
    }
  });

  // Duplo clique na imagem também curte
  node.querySelector(".post-image").addEventListener("dblclick", () => {
    if (!likeBtn.classList.contains("liked")) likeBtn.click();
  });

  // Comentários
  const commentsEl = node.querySelector(".comments");
  post.comments.forEach((c) => commentsEl.append(renderComment(post, c)));

  const commentForm = node.querySelector(".comment-form");
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = commentForm.elements.text;
    try {
      const { post: updated } = await api(`/posts/${post.id}/comments`, {
        method: "POST",
        body: { text: input.value },
      });
      const newComment = updated.comments.at(-1);
      commentsEl.append(renderComment(updated, newComment));
      input.value = "";
    } catch (error) {
      handleError(error);
    }
  });

  // Apagar post (somente o autor)
  const deleteBtn = node.querySelector(".delete-post");
  if (post.author?.id === me?.id) {
    deleteBtn.hidden = false;
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Apagar este post?")) return;
      try {
        await api(`/posts/${post.id}`, { method: "DELETE" });
        node.remove();
        if (!postsEl.children.length) statusEl.textContent = "Nenhum post ainda. Publique o primeiro!";
      } catch (error) {
        handleError(error);
      }
    });
  }

  return node;
}

async function loadFeed() {
  statusEl.textContent = "Carregando...";
  try {
    const { posts } = await api("/posts");
    postsEl.replaceChildren(...posts.map(renderPost));
    statusEl.textContent = posts.length ? "" : "Nenhum post ainda. Publique o primeiro!";
  } catch (error) {
    statusEl.textContent = error.message;
    if (error.status === 401) handleError(error);
  }
}

newPostForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = newPostForm.querySelector(".form-error");
  const button = newPostForm.querySelector("button");
  errorEl.textContent = "";
  button.disabled = true;

  try {
    const body = Object.fromEntries(new FormData(newPostForm));
    const { post } = await api("/posts", { method: "POST", body });
    postsEl.prepend(renderPost(post));
    statusEl.textContent = "";
    newPostForm.reset();
  } catch (error) {
    if (error.status === 401) return handleError(error);
    errorEl.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

loadFeed();
