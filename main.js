const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById("app");

function render() {
  app.innerHTML = `
    <div style="padding:40px;font-family:Arial">
      <h1>Kauhapadel</h1>

      <input id="name" placeholder="Nimi" /><br><br>
      <input id="email" placeholder="Sähköposti" /><br><br>
      <input id="password" type="password" placeholder="Salasana" /><br><br>

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
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (!error && data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        name: name,
        role: "player"
      });
    }

    document.getElementById("msg").innerText =
      error ? error.message : "Rekisteröinti onnistui";
  };
}

render();
