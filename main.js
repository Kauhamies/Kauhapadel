const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = document.getElementById("app");

app.innerHTML = `
  <div style="padding:40px;font-family:Arial">
    <h1>Kauhapadel</h1>
    <p>Supabase yhdistetty</p>
  </div>
`;