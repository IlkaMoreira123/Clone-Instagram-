const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");

let app;

async function register(username) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, email: `${username}@teste.com`, password: "senha123" });
  assert.equal(res.status, 201);
  return res.body.token;
}

const IMG = "https://picsum.photos/600";

beforeEach(() => {
  app = createApp({ dbFile: ":memory:", jwtSecret: "teste", serveFrontend: false });
});

describe("Autenticação", () => {
  test("cadastra e faz login com usuário ou e-mail", async () => {
    await register("ilka");

    const byUser = await request(app)
      .post("/api/auth/login")
      .send({ username: "ilka", password: "senha123" });
    assert.equal(byUser.status, 200);
    assert.ok(byUser.body.token);
    assert.equal(byUser.body.user.username, "ilka");
    assert.equal(byUser.body.user.passwordHash, undefined);

    const byEmail = await request(app)
      .post("/api/auth/login")
      .send({ username: "ILKA@teste.com", password: "senha123" });
    assert.equal(byEmail.status, 200);
  });

  test("recusa senha errada, cadastro duplicado e dados inválidos", async () => {
    await register("ilka");

    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ username: "ilka", password: "errada" });
    assert.equal(wrong.status, 401);

    const dup = await request(app)
      .post("/api/auth/register")
      .send({ username: "ilka", email: "outro@teste.com", password: "senha123" });
    assert.equal(dup.status, 409);

    const short = await request(app)
      .post("/api/auth/register")
      .send({ username: "novo", email: "novo@teste.com", password: "123" });
    assert.equal(short.status, 400);
  });

  test("/me exige token válido", async () => {
    const token = await register("ilka");
    assert.equal((await request(app).get("/api/auth/me")).status, 401);
    assert.equal(
      (await request(app).get("/api/auth/me").set("Authorization", "Bearer invalido")).status,
      401
    );
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.username, "ilka");
  });
});

describe("Posts, curtidas e comentários", () => {
  test("fluxo completo", async () => {
    const ilka = await register("ilka");
    const ana = await register("ana");
    const asIlka = (r) => r.set("Authorization", `Bearer ${ilka}`);
    const asAna = (r) => r.set("Authorization", `Bearer ${ana}`);

    // Sem login não acessa o feed
    assert.equal((await request(app).get("/api/posts")).status, 401);

    // Cria post
    const created = await asIlka(request(app).post("/api/posts")).send({
      imageUrl: IMG,
      caption: "Meu primeiro post",
    });
    assert.equal(created.status, 201);
    const id = created.body.post.id;
    assert.equal(created.body.post.author.username, "ilka");

    // Imagem inválida
    const bad = await asIlka(request(app).post("/api/posts")).send({ imageUrl: "nada" });
    assert.equal(bad.status, 400);

    // Ana curte e descurte
    let like = await asAna(request(app).post(`/api/posts/${id}/like`));
    assert.deepEqual(like.body, { liked: true, likesCount: 1 });
    like = await asAna(request(app).post(`/api/posts/${id}/like`));
    assert.deepEqual(like.body, { liked: false, likesCount: 0 });

    // Ana comenta
    const comment = await asAna(request(app).post(`/api/posts/${id}/comments`)).send({
      text: "Que lindo!",
    });
    assert.equal(comment.status, 201);
    assert.equal(comment.body.post.comments[0].author.username, "ana");
    const commentId = comment.body.post.comments[0].id;

    // Comentário vazio
    const empty = await asAna(request(app).post(`/api/posts/${id}/comments`)).send({ text: " " });
    assert.equal(empty.status, 400);

    // Feed mostra o post
    const feed = await asAna(request(app).get("/api/posts"));
    assert.equal(feed.body.posts.length, 1);
    assert.equal(feed.body.posts[0].comments.length, 1);

    // Dona do post pode apagar o comentário da Ana
    const delComment = await asIlka(request(app).delete(`/api/posts/${id}/comments/${commentId}`));
    assert.equal(delComment.status, 204);

    // Ana não pode apagar o post da Ilka
    assert.equal((await asAna(request(app).delete(`/api/posts/${id}`))).status, 403);
    assert.equal((await asIlka(request(app).delete(`/api/posts/${id}`))).status, 204);
    assert.equal((await asIlka(request(app).get(`/api/posts/${id}`))).status, 404);
  });
});

test("JSON inválido devolve 400", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{nao e json");
  assert.equal(res.status, 400);
});
