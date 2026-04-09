const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById("app");

let name = "";

function renderNameInput() {
  app.innerHTML = `
    <div style="padding:40px;font-family:Arial">
      <h1>Kauhapadel</h1>
      <p>Syötä nimesi</p>

      <input id="name" placeholder="Nimi" />
      <button id="continue">Jatka</button>
    </div>
  `;

  document.getElementById("continue").onclick = () => {
    name = document.getElementById("name").value;
    if (!name) return alert("Anna nimi");
    renderEvents();
  };
}

async function renderEvents() {
  const { data: events, error } = await supabase.from("events").select("*");

  if (error) {
    app.innerHTML = `<div style="color:red;padding:40px">${error.message}</div>`;
    return;
  }

  if (!events || events.length === 0) {
    app.innerHTML = `
      <div style="padding:40px;font-family:Arial">
        <h1>Kauhapadel</h1>
        <p>Hei ${name}</p>
        <p>❗ Ei tapahtumia tietokannassa</p>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div style="padding:40px;font-family:Arial">
      <h1>Kauhapadel</h1>
      <p>Hei ${name}</p>

      <div id="events"></div>
    </div>
  `;

  const container = document.getElementById("events");

  container.innerHTML = events.map(e => `
    <div style="border:1px solid #ccc;padding:15px;margin:10px 0">
      <h3>${e.title}</h3>
      <p>${e.date} ${e.time}</p>
      <p>${e.location}</p>
      <button onclick="join('${e.id}')">Ilmoittaudu</button>
    </div>
  `).join("");
}

window.join = async (eventId) => {
  await supabase.from("event_registrations").insert({
    event_id: eventId,
    name: name
  });

  alert("Ilmoittauduttu!");
};

renderNameInput();