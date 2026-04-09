const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const app = document.getElementById("app");

try {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  app.innerHTML = `
    <div style="padding:40px;font-family:Arial">
      <h1>Kauhapadel</h1>
      <p>Supabase yhdistetty</p>
    </div>
  `;
} catch (e) {
  app.innerHTML = `
    <div style="padding:40px;font-family:Arial;color:red">
      <h1>Virhe</h1>
      <p>${e.message}</p>
    </div>
  `;
}