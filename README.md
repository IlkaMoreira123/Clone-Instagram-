# Clone do Instagram

Projeto de estudo: a tela de login do Instagram feita com HTML e CSS, agora com uma **API back-end em Node.js + Express** que permite criar conta, entrar, publicar fotos, curtir e comentar.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org/) 20 ou mais recente.

```bash
cd api
npm install
npm start
```

Abra **http://localhost:3000** no navegador. O próprio servidor entrega as páginas do site e a API.

1. Clique em **Cadastre-se** e crie uma conta.
2. No feed, cole o link de uma imagem (ex.: `https://picsum.photos/600`) e publique.
3. Curta (botão ♡ ou duplo clique na foto) e comente.

Os dados ficam salvos em `api/data/db.json`, criado automaticamente.

### Variáveis de ambiente (opcionais)

| Variável     | Padrão               | Para que serve                           |
| ------------ | -------------------- | ---------------------------------------- |
| `PORT`       | `3000`               | Porta do servidor                        |
| `JWT_SECRET` | `troque-este-segredo`| Segredo dos tokens de login (troque em produção) |
| `DB_FILE`    | `api/data/db.json`   | Onde os dados são salvos                 |

## Estrutura

```
10_clone instagram/     Front-end
  index.html            Login e cadastro
  feed.html             Feed com posts, curtidas e comentários
  js/api.js             Funções para chamar a API
  js/login.js           Lógica de login/cadastro
  js/feed.js            Lógica do feed
api/                    Back-end
  src/server.js         Inicia o servidor
  src/app.js            Configura o Express e as rotas
  src/db.js             "Banco" em arquivo JSON
  src/routes/auth.js    Cadastro, login e /me
  src/routes/posts.js   Posts, curtidas e comentários
  test/api.test.js      Testes automáticos
```

## Rotas da API

Rotas marcadas com 🔒 precisam do cabeçalho `Authorization: Bearer <token>`.

| Método | Rota                                  | Descrição                         |
| ------ | ------------------------------------- | --------------------------------- |
| POST   | `/api/auth/register`                  | Cria conta `{ username, email, name, password }` |
| POST   | `/api/auth/login`                     | Entra `{ username, password }` (usuário ou e-mail) |
| GET    | `/api/auth/me` 🔒                     | Dados do usuário logado           |
| GET    | `/api/posts` 🔒                       | Feed, mais recentes primeiro      |
| POST   | `/api/posts` 🔒                       | Novo post `{ imageUrl, caption }` |
| GET    | `/api/posts/:id` 🔒                   | Um post                           |
| DELETE | `/api/posts/:id` 🔒                   | Apaga (só o autor)                |
| POST   | `/api/posts/:id/like` 🔒              | Curte / descurte                  |
| POST   | `/api/posts/:id/comments` 🔒          | Comenta `{ text }`                |
| DELETE | `/api/posts/:id/comments/:commentId` 🔒 | Apaga comentário (autor do comentário ou do post) |

## Testes

```bash
cd api
npm test
```

Os testes também rodam automaticamente no GitHub Actions a cada push e Pull Request.

## Tecnologias

HTML, CSS, JavaScript, Node.js, Express, JWT (`jsonwebtoken`) e `bcryptjs` para guardar senhas com segurança.
