// Já está logado? Vai direto para o feed.
if (auth.token) location.href = "feed.html";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const message = document.querySelector("#form-message");
const toggleText = document.querySelector("#toggle-text");

function showMessage(text) {
  message.textContent = text;
}

function setLoading(form, loading) {
  form.querySelector("input[type=submit]").disabled = loading;
}

// Alterna entre login e cadastro
toggleText.addEventListener("click", (event) => {
  if (event.target.id !== "toggle-form") return;
  event.preventDefault();

  const showRegister = registerForm.hidden;
  registerForm.hidden = !showRegister;
  loginForm.hidden = showRegister;
  showMessage("");

  toggleText.innerHTML = showRegister
    ? 'Tem uma conta? <a href="#" id="toggle-form">Conecte-se</a>'
    : 'Não tem uma conta? <a href="#" id="toggle-form">Cadastre-se</a>';
});

async function handleSubmit(form, path) {
  const data = Object.fromEntries(new FormData(form));
  showMessage("");
  setLoading(form, true);

  try {
    const result = await api(path, { method: "POST", body: data });
    auth.save(result);
    location.href = "feed.html";
  } catch (error) {
    showMessage(error.message);
  } finally {
    setLoading(form, false);
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSubmit(loginForm, "/auth/login");
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSubmit(registerForm, "/auth/register");
});
