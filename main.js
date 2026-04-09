const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById("app");

async function test() {
  try {
    const { data, error } = await supabase.from("events").select("id,title").limit(1);

    if (error) {
      app.innerHTML = `<div style="padding:40px;font-family:Arial;color:red">
        <h1>Supabase virhe</h1>
        <p>${error.message}</p>
      </div>`;
      return;
    }

    app.innerHTML = `<div style="padding:40px;font-family:Arial">
      <h1>Kauhapadel</h1>
      <p>Yhteys onnistui.</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>`;
  } catch (e) {
    app.innerHTML = `<div style="padding:40px;font-family:Arial;color:red">
      <h1>Fetch virhe</h1>
      <p>${e.message}</p>
      <p>Tämä viittaa yleensä URL-/avain- tai selainyhteysongelmaan.</p>
    </div>`;
  }
}

test();
