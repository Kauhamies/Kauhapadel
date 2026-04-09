const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const app = document.getElementById("app");
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.innerHTML = `
  <div style="padding:40px;font-family:Arial;">
    <h1>Kauhapadel</h1>
    <p>Testataan kirjautuminen</p>

    <input id="email" placeholder="sähköposti" /><br><br>
    <input id="password" type="password" placeholder="salasana" /><br><br>

    <button id="login">Kirjaudu</button>
    <button id="signup">Rekisteröidy</button>

    <p id="msg"></p>
  </div>
`;

document.getElementById("login").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  document.getElementById("msg").innerText =
    error ? error.message : "Kirjautuminen onnistui";
};

document.getElementById("signup").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });

  document.getElementById("msg").innerText =
    error ? error.message : "Rekisteröinti onnistui";
};