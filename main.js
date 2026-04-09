const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const app = document.getElementById("app");
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function boot() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    app.innerHTML = `
      <div style="padding:40px;font-family:Arial,sans-serif;">
        <h1>Kauhapadel</h1>
        <p>Supabase-yhteys toimii.</p>
        <p>Kirjautunut: ${data.session ? "kyllä" : "ei"}</p>
        <button id="test-register">Näytä rekisteröinti</button>
        <div id="content" style="margin-top:20px;"></div>
      </div>
    `;

    document.getElementById("test-register").addEventListener("click", () => {
      document.getElementById("content").innerHTML = `
        <div style="max-width:420px;padding:20px;border:1px solid #ddd;border-radius:12px;">
          <h2>Rekisteröidy / kirjaudu</h2>
          <input id="email" type="email" placeholder="Sähköposti" style="width:100%;padding:10px;margin:8px 0;" />
          <input id="password" type="password" placeholder="Salasana" style="width:100%;padding:10px;margin:8px 0;" />
          <button id="loginBtn" style="padding:10px 14px;margin-right:8px;">Kirjaudu</button>
          <button id="signupBtn" style="padding:10px 14px;">Rekisteröidy</button>
          <p id="msg" style="margin-top:12px;"></p>
        </div>
      `;

      document.getElementById("loginBtn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        document.getElementById("msg").textContent = error ? error.message : "Kirjautuminen onnistui. Päivitä sivu.";
      });

      document.getElementById("signupBtn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const { error } = await supabase.auth.signUp({ email, password });
        document.getElementById("msg").textContent = error ? error.message : "Rekisteröinti onnistui.";
      });
    });
  } catch (error) {
    app.innerHTML = `<div style="padding:40px;font-family:Arial;">Virhe: ${error.message}</div>`;
  }
}

boot();