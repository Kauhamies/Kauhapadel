const SUPABASE_URL = "https://kgayunrioytcnlirgyvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OSNlw36GCL2buO26zgqVNw_N1wZAXQJ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById("app");

const state = {
  session: null,
  profile: null,
  profiles: [],
  events: [],
  mode: "login",
  message: "",
  loading: false,
  search: "",
  filter: "all",
  activeTab: "events",
  eventForm: emptyEventForm(),
};

function emptyEventForm() {
  return {
    id: "",
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    level: "",
    max_players: 4,
    price: "",
    mobilepay_link: "",
  };
}

function setMessage(msg) {
  state.message = msg || "";
  render();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortEvents(events) {
  return [...events].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
}

function isAdmin() {
  return state.profile?.role === "admin";
}

function getParticipantNames(event) {
  const profilesById = Object.fromEntries(state.profiles.map((p) => [p.id, p]));
  return (event.registrations || []).map((r) => profilesById[r.user_id]?.name || "Tuntematon");
}

function filteredEvents() {
  const search = state.search.trim().toLowerCase();

  return sortEvents(state.events).filter((event) => {
    const text = [event.title, event.location, event.level, event.description].join(" ").toLowerCase();
    const matchesSearch = !search || text.includes(search);
    if (!matchesSearch) return false;

    if (state.filter === "joined") {
      return (event.registrations || []).some((r) => r.user_id === state.profile?.id);
    }
    if (state.filter === "available") {
      return (event.registrations || []).length < Number(event.max_players);
    }
    if (state.filter === "full") {
      return (event.registrations || []).length >= Number(event.max_players);
    }
    return true;
  });
}

async function loadSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  state.session = data.session || null;
}

async function loadAllData() {
  if (!state.session?.user?.id) return;

  const userId = state.session.user.id;

  const [profileRes, profilesRes, eventsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase
      .from("events")
      .select("*, registrations:event_registrations(id, user_id)")
      .order("date", { ascending: true }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (eventsRes.error) throw eventsRes.error;

  state.profile = profileRes.data;
  state.profiles = profilesRes.data || [];
  state.events = (eventsRes.data || []).map((e) => ({
    ...e,
    registrations: e.registrations || [],
  }));
}

async function handleRegister() {
  const name = document.getElementById("auth-name")?.value.trim() || "";
  const email = document.getElementById("auth-email")?.value.trim() || "";
  const password = document.getElementById("auth-password")?.value || "";

  if (!name || !email || !password) {
    setMessage("Täytä kaikki kentät.");
    return;
  }

  state.loading = true;
  render();

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Käyttäjän luonti epäonnistui.");

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name,
      role: "player",
    });

    if (profileError) throw profileError;

    setMessage("Käyttäjä luotu. Voit kirjautua sisään.");
    state.mode = "login";
  } catch (error) {
    setMessage(error.message || "Rekisteröinti epäonnistui.");
  } finally {
    state.loading = false;
    render();
  }
}

async function handleLogin() {
  const email = document.getElementById("auth-email")?.value.trim() || "";
  const password = document.getElementById("auth-password")?.value || "";

  if (!email || !password) {
    setMessage("Täytä sähköposti ja salasana.");
    return;
  }

  state.loading = true;
  render();

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    await loadSession();
    await loadAllData();
    setMessage("Kirjautuminen onnistui.");
  } catch (error) {
    setMessage(error.message || "Kirjautuminen epäonnistui.");
  } finally {
    state.loading = false;
    render();
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  state.session = null;
  state.profile = null;
  state.profiles = [];
  state.events = [];
  setMessage("Kirjauduit ulos.");
}

function openNewEventForm() {
  state.eventForm = emptyEventForm();
  render();
  const panel = document.getElementById("event-form-panel");
  if (panel) panel.classList.remove("hidden");
}

function openEditEvent(id) {
  const event = state.events.find((e) => e.id === id);
  if (!event) return;

  state.eventForm = {
    id: event.id,
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    date: event.date || "",
    time: event.time || "",
    level: event.level || "",
    max_players: event.max_players || 4,
    price: event.price ?? "",
    mobilepay_link: event.mobilepay_link || "",
  };
  render();
  const panel = document.getElementById("event-form-panel");
  if (panel) panel.classList.remove("hidden");
}

function closeEventForm() {
  state.eventForm = emptyEventForm();
  const panel = document.getElementById("event-form-panel");
  if (panel) panel.classList.add("hidden");
}

async function saveEvent() {
  const payload = {
    id: document.getElementById("event-id").value,
    title: document.getElementById("event-title").value.trim(),
    description: document.getElementById("event-description").value.trim(),
    location: document.getElementById("event-location").value.trim(),
    date: document.getElementById("event-date").value,
    time: document.getElementById("event-time").value,
    level: document.getElementById("event-level").value.trim(),
    max_players: Number(document.getElementById("event-max").value),
    price: document.getElementById("event-price").value,
    mobilepay_link: document.getElementById("event-link").value.trim(),
  };

  if (!payload.title || !payload.location || !payload.date || !payload.time) {
    setMessage("Täytä vähintään nimi, paikka, päivä ja kellonaika.");
    return;
  }

  if (payload.mobilepay_link && !/^https?:\/\//i.test(payload.mobilepay_link)) {
    setMessage("MobilePay-linkin pitää alkaa http:// tai https://");
    return;
  }

  state.loading = true;
  render();

  try {
    const dbPayload = {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      date: payload.date,
      time: payload.time,
      level: payload.level,
      max_players: payload.max_players,
      price: payload.price === "" ? null : Number(payload.price),
      mobilepay_link: payload.mobilepay_link || null,
      created_by: state.profile.id,
    };

    if (payload.id) {
      const { error } = await supabase.from("events").update(dbPayload).eq("id", payload.id);
      if (error) throw error;
      setMessage("Tapahtuma päivitetty.");
    } else {
      const { error } = await supabase.from("events").insert(dbPayload);
      if (error) throw error;
      setMessage("Tapahtuma lisätty.");
    }

    await loadAllData();
    closeEventForm();
    render();
  } catch (error) {
    setMessage(error.message || "Tallennus epäonnistui.");
  } finally {
    state.loading = false;
    render();
  }
}

async function deleteEvent(id) {
  if (!confirm("Poistetaanko tapahtuma?")) return;

  state.loading = true;
  render();

  try {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
    await loadAllData();
    setMessage("Tapahtuma poistettu.");
  } catch (error) {
    setMessage(error.message || "Poisto epäonnistui.");
  } finally {
    state.loading = false;
    render();
  }
}

async function joinEvent(id) {
  const event = state.events.find((e) => e.id === id);
  if (!event) return;

  if ((event.registrations || []).some((r) => r.user_id === state.profile.id)) return;
  if ((event.registrations || []).length >= Number(event.max_players)) {
    setMessage("Tapahtuma on täynnä.");
    return;
  }

  state.loading = true;
  render();

  try {
    const { error } = await supabase.from("event_registrations").insert({
      event_id: event.id,
      user_id: state.profile.id,
    });
    if (error) throw error;

    await loadAllData();
    setMessage("Ilmoittautuminen onnistui.");
  } catch (error) {
    setMessage(error.message || "Ilmoittautuminen epäonnistui.");
  } finally {
    state.loading = false;
    render();
  }
}

async function leaveEvent(id) {
  state.loading = true;
  render();

  try {
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", id)
      .eq("user_id", state.profile.id);

    if (error) throw error;

    await loadAllData();
    setMessage("Osallistuminen peruttu.");
  } catch (error) {
    setMessage(error.message || "Peruminen epäonnistui.");
  } finally {
    state.loading = false;
    render();
  }
}

function bindEvents() {
  document.getElementById("toggle-auth-mode")?.addEventListener("click", () => {
    state.mode = state.mode === "login" ? "register" : "login";
    setMessage("");
  });

  document.getElementById("auth-submit")?.addEventListener("click", () => {
    if (state.mode === "login") handleLogin();
    else handleRegister();
  });

  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      render();
    });
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      render();
    });
  });

  document.getElementById("new-event-btn")?.addEventListener("click", openNewEventForm);
  document.getElementById("cancel-event-btn")?.addEventListener("click", closeEventForm);
  document.getElementById("save-event-btn")?.addEventListener("click", saveEvent);

  document.querySelectorAll("[data-join]").forEach((btn) => {
    btn.addEventListener("click", () => joinEvent(btn.dataset.join));
  });

  document.querySelectorAll("[data-leave]").forEach((btn) => {
    btn.addEventListener("click", () => leaveEvent(btn.dataset.leave));
  });

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditEvent(btn.dataset.edit));
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteEvent(btn.dataset.delete));
  });
}

function authView() {
  return `
    <div class="auth-wrap">
      <div class="card">
        <div class="section-title">Kauhapadel</div>
        <p class="muted">Julkaistava ilmaisversio harrastusporukalle. Kaikki käyttäjät näkevät samat tapahtumat ja ilmoittautumiset.</p>
        <div class="notice">Rekisteröidy ensin. Kun haluat itsellesi admin-oikeudet, vaihda profiles-taulussa role = admin.</div>
      </div>

      <div class="card">
        <div class="section-title">${state.mode === "login" ? "Kirjaudu sisään" : "Luo käyttäjä"}</div>
        <div class="col">
          ${state.mode === "register" ? `
            <div>
              <label class="small">Nimi</label>
              <input id="auth-name" />
            </div>
          ` : ""}
          <div>
            <label class="small">Sähköposti</label>
            <input id="auth-email" type="email" />
          </div>
          <div>
            <label class="small">Salasana</label>
            <input id="auth-password" type="password" />
          </div>
          <button id="auth-submit" class="btn-primary">${state.loading ? "Odota..." : state.mode === "login" ? "Kirjaudu" : "Rekisteröidy"}</button>
          <button id="toggle-auth-mode" class="btn-secondary">${state.mode === "login" ? "Luo uusi käyttäjä" : "Minulla on jo käyttäjä"}</button>
          ${state.message ? `<div class="notice">${escapeHtml(state.message)}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

function eventsHtml() {
  const events = filteredEvents();

  if (events.length === 0) {
    return `<div class="card">Hakuehdoilla ei löytynyt tapahtumia.</div>`;
  }

  return `
    <div class="grid">
      ${events.map((event) => {
        const joined = (event.registrations || []).some((r) => r.user_id === state.profile.id);
        const full = (event.registrations || []).length >= Number(event.max_players);
        const participants = getParticipantNames(event);

        return `
          <div class="event-card">
            <div class="row" style="justify-content:space-between;align-items:start;">
              <div>
                <h3 style="margin:0 0 6px;">${escapeHtml(event.title)}</h3>
                <span class="pill">${escapeHtml(event.level || "Ei määritelty")}</span>
              </div>
            </div>

            <p class="muted">${escapeHtml(event.description || "")}</p>

            <div class="col small">
              <div>Ajankohta: ${escapeHtml(formatDate(event.date, event.time))}</div>
              <div>Paikka: ${escapeHtml(event.location)}</div>
              <div>Pelaajat: ${(event.registrations || []).length} / ${event.max_players}</div>
              ${event.price != null ? `<div>Hinta: ${escapeHtml(String(event.price))} €</div>` : ""}
            </div>

            <div class="participants">
              <strong>Osallistujat</strong>
              ${
                participants.length === 0
                  ? `<div class="muted">Ei osallistujia vielä.</div>`
                  : `<div class="participant-list">${participants.map((name) => `<span class="participant">${escapeHtml(name)}</span>`).join("")}</div>`
              }
            </div>

            ${event.mobilepay_link ? `
              <div class="mb16" style="margin-top:12px;">
                <a class="linkbtn btn-secondary" href="${escapeHtml(event.mobilepay_link)}" target="_blank" rel="noreferrer">Maksa MobilePaylla</a>
              </div>
            ` : ""}

            <div class="row">
              ${
                joined
                  ? `<button class="btn-secondary" data-leave="${event.id}">Peru osallistuminen</button>`
                  : `<button class="btn-primary" data-join="${event.id}" ${full ? "disabled" : ""}>${full ? "Täynnä" : "Ilmoittaudu"}</button>`
              }
              ${
                isAdmin()
                  ? `<button class="btn-secondary" data-edit="${event.id}">Muokkaa</button>
                     <button class="btn-danger" data-delete="${event.id}">Poista</button>`
                  : ""
              }
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function profileHtml() {
  const mine = sortEvents(state.events).filter((event) =>
    (event.registrations || []).some((r) => r.user_id === state.profile.id)
  );

  return `
    <div class="card">
      <div class="section-title">Oma profiili</div>
      <div class="col small">
        <div><strong>Nimi:</strong> ${escapeHtml(state.profile.name)}</div>
        <div><strong>Sähköposti:</strong> ${escapeHtml(state.session.user.email)}</div>
        <div><strong>Rooli:</strong> ${isAdmin() ? "Admin" : "Pelaaja"}</div>
      </div>

      <div class="hr"></div>
      <div><strong>Omat ilmoittautumiset</strong></div>
      <div class="col" style="margin-top:10px;">
        ${
          mine.length === 0
            ? `<div class="muted">Ei ilmoittautumisia.</div>`
            : mine.map((event) => `<div class="participants">${escapeHtml(event.title)} — ${escapeHtml(formatDate(event.date, event.time))}</div>`).join("")
        }
      </div>
    </div>
  `;
}

function adminHtml() {
  if (!isAdmin()) return "";

  return `
    <div class="card">
      <div class="row" style="justify-content:space-between;align-items:center;">
        <div class="section-title" style="margin:0;">Admin</div>
        <button id="new-event-btn" class="btn-primary">Lisää tapahtuma</button>
      </div>

      <div id="event-form-panel" class="hidden" style="margin-top:16px;">
        <div class="hr"></div>
        <input id="event-id" type="hidden" value="${escapeHtml(state.eventForm.id)}" />
        <div class="col">
          <div><label class="small">Nimi</label><input id="event-title" value="${escapeHtml(state.eventForm.title)}" /></div>
          <div><label class="small">Kuvaus</label><textarea id="event-description">${escapeHtml(state.eventForm.description)}</textarea></div>
          <div><label class="small">Paikka</label><input id="event-location" value="${escapeHtml(state.eventForm.location)}" /></div>
          <div class="row">
            <div style="flex:1;"><label class="small">Päivä</label><input id="event-date" type="date" value="${escapeHtml(state.eventForm.date)}" /></div>
            <div style="flex:1;"><label class="small">Kellonaika</label><input id="event-time" type="time" value="${escapeHtml(state.eventForm.time)}" /></div>
          </div>
          <div class="row">
            <div style="flex:1;"><label class="small">Taso</label><input id="event-level" value="${escapeHtml(state.eventForm.level)}" /></div>
            <div style="flex:1;"><label class="small">Maksimipelaajat</label><input id="event-max" type="number" min="2" max="8" value="${escapeHtml(String(state.eventForm.max_players))}" /></div>
          </div>
          <div class="row">
            <div style="flex:1;"><label class="small">Hinta (€)</label><input id="event-price" type="number" min="0" step="0.01" value="${escapeHtml(String(state.eventForm.price))}" /></div>
            <div style="flex:2;"><label class="small">MobilePay-linkki</label><input id="event-link" value="${escapeHtml(state.eventForm.mobilepay_link)}" placeholder="https://pay.mobilepay.fi/..." /></div>
          </div>
          <div class="row">
            <button id="save-event-btn" class="btn-primary">${state.loading ? "Tallennetaan..." : "Tallenna"}</button>
            <button id="cancel-event-btn" class="btn-secondary">Peruuta</button>
          </div>
        </div>
      </div>

      <div class="hr"></div>
      <div class="col">
        ${sortEvents(state.events).map((event) => `
          <div class="participants">
            <div><strong>${escapeHtml(event.title)}</strong></div>
            <div class="small muted">${escapeHtml(formatDate(event.date, event.time))} · ${escapeHtml(event.location)}</div>
            <div class="small" style="margin-top:8px;">
              <strong>Osallistujat:</strong>
              ${getParticipantNames(event).length ? escapeHtml(getParticipantNames(event).join(", ")) : "Ei osallistujia"}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function appView() {
  return `
    <div class="container">
      <div class="header">
        <div>
          <div class="section-title" style="margin:0;">Kauhapadel</div>
          <div class="muted">Tervetuloa, ${escapeHtml(state.profile.name)}</div>
        </div>
        <div class="top-actions">
          ${isAdmin() ? `<span class="pill">Admin</span>` : ""}
          <button id="logout-btn" class="btn-secondary">Kirjaudu ulos</button>
        </div>
      </div>

      ${state.message ? `<div class="notice mb24">${escapeHtml(state.message)}</div>` : ""}

      <div class="tabs">
        <button class="tab ${state.activeTab === "events" ? "active" : ""} btn-secondary" data-tab="events">Tapahtumat</button>
        <button class="tab ${state.activeTab === "profile" ? "active" : ""} btn-secondary" data-tab="profile">Oma profiili</button>
        ${isAdmin() ? `<button class="tab ${state.activeTab === "admin" ? "active" : ""} btn-secondary" data-tab="admin">Admin</button>` : ""}
      </div>

      <div class="panel ${state.activeTab !== "events" ? "hidden" : ""}">
        <div class="card mb16">
          <div class="row">
            <input id="search-input" placeholder="Hae tapahtumia tai paikkoja" value="${escapeHtml(state.search)}" />
            <button class="btn-secondary" data-filter="all">Kaikki</button>
            <button class="btn-secondary" data-filter="available">Vapaat</button>
            <button class="btn-secondary" data-filter="joined">Omat</button>
            <button class="btn-secondary" data-filter="full">Täynnä</button>
          </div>
        </div>
        ${eventsHtml()}
      </div>

      <div class="panel ${state.activeTab !== "profile" ? "hidden" : ""}">
        ${profileHtml()}
      </div>

      <div class="panel ${state.activeTab !== "admin" ? "hidden" : ""}">
        ${adminHtml()}
      </div>
    </div>
  `;
}

function render() {
  app.innerHTML = state.session && state.profile ? appView() : authView();
  bindEvents();
}

async function boot() {
  try {
    await loadSession();
    if (state.session?.user?.id) {
      await loadAllData();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      state.session = session || null;
      if (state.session?.user?.id) {
        await loadAllData();
      } else {
        state.profile = null;
        state.profiles = [];
        state.events = [];
      }
      render();
    });

    render();
  } catch (error) {
    app.innerHTML = `<div class="container"><div class="card">Virhe: ${escapeHtml(error.message || "Tuntematon virhe")}</div></div>`;
  }
}

boot();

