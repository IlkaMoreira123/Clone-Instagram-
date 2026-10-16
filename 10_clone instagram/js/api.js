// Comunicação com a API back-end.
// Se a página for aberta pelo servidor (http://localhost:3000), usa a mesma origem.
// Se for aberta direto do arquivo (file://), usa http://localhost:3000.
const API_URL = location.protocol.startsWith("http") ? "" : "http://localhost:3000";

const auth = {
  get token() {
    return localStorage.getItem("token");
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },
  save({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Ele está rodando?");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || "Algo deu errado.");
    error.status = res.status;
    throw error;
  }
  return data;
}
