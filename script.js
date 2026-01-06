// Les Beautés de Léa — interactions + mini “système” de rendez‑vous (localStorage)
const $ = (sel, root = document) => root.querySelector(sel);

const burger = $(".burger");
const mobileNav = $(".mobile-nav");

if (burger && mobileNav) {
  burger.addEventListener("click", () => {
    const expanded = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!expanded));
    mobileNav.hidden = expanded;
  });

  mobileNav.addEventListener("click", (e) => {
    if (e.target.matches("a")) {
      burger.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
    }
  });
}

// Smooth scroll
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href^='#']");
  if (!a) return;
  const id = a.getAttribute("href");
  const el = document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Footer year
$("#year").textContent = new Date().getFullYear();

// Booking system (local)
const STORAGE_KEY = "lbdl_appointments_v1";
const form = $("#bookingForm");
const list = $("#appointmentsList");
const toast = $("#toast");
const clearBtn = $("#clearAppointments");
const mailtoBtn = $("#mailtoBtn");

function loadAppointments() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveAppointments(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatWhen(appt) {
  // Appt.date: YYYY-MM-DD, appt.time: HH:MM
  return `${appt.date} • ${appt.time}`;
}

function renderAppointments() {
  const items = loadAppointments();
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="appt"><div class="appt__title">Aucune demande pour le moment</div><div class="appt__meta">Tes demandes s’afficheront ici 💗</div></div>`;
    return;
  }
  items.slice().reverse().forEach((appt) => {
    const div = document.createElement("div");
    div.className = "appt";
    div.innerHTML = `
      <div class="appt__top">
        <div class="appt__title">${escapeHtml(appt.service)} — ${escapeHtml(appt.name)}</div>
        <div class="appt__when">${escapeHtml(formatWhen(appt))}</div>
      </div>
      <div class="appt__meta">
        <div><strong>Email :</strong> ${escapeHtml(appt.email)}</div>
        ${appt.phone ? `<div><strong>Tél :</strong> ${escapeHtml(appt.phone)}</div>` : ""}
        ${appt.message ? `<div><strong>Message :</strong> ${escapeHtml(appt.message)}</div>` : ""}
      </div>
    `;
    list.appendChild(div);
  });
}

function showToast(msg) {
  toast.hidden = false;
  toast.textContent = msg;
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => (toast.hidden = true), 4500);
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFormData() {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    name: (data.name || "").trim(),
    email: (data.email || "").trim(),
    phone: (data.phone || "").trim(),
    service: (data.service || "").trim(),
    date: (data.date || "").trim(),
    time: (data.time || "").trim(),
    message: (data.message || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

function validate(data) {
  if (!data.name || !data.email || !data.service || !data.date || !data.time) return false;
  // Prevent past dates (simple client check)
  const selected = new Date(`${data.date}T${data.time}:00`);
  if (Number.isNaN(selected.getTime())) return true;
  const now = new Date();
  if (selected.getTime() < now.getTime() - 5 * 60 * 1000) return false;
  return true;
}

function buildMailto(data) {
  const to = "contact@lesbeautesdelea.fr";
  const subject = encodeURIComponent(`Demande de rendez-vous — ${data.service}`);
  const body = encodeURIComponent(
`Bonjour Léa,

Je souhaite prendre rendez-vous :

• Prestation : ${data.service}
• Date : ${data.date}
• Heure : ${data.time}
• Nom : ${data.name}
• Email : ${data.email}
• Téléphone : ${data.phone || "—"}

Message :
${data.message || "—"}

Merci 💗`
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

renderAppointments();

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = getFormData();
  if (!validate(data)) {
    showToast("Oups… vérifie les champs (et choisis un créneau futur).");
    return;
  }
  const items = loadAppointments();
  items.push(data);
  saveAppointments(items);
  renderAppointments();
  form.reset();
  showToast("Demande enregistrée 💗 Tu peux aussi l’envoyer par e‑mail si tu veux.");
});

mailtoBtn?.addEventListener("click", () => {
  const data = getFormData();
  if (!data.name || !data.email || !data.service || !data.date || !data.time) {
    showToast("Remplis d’abord le formulaire (nom, email, prestation, date, heure).");
    return;
  }
  window.location.href = buildMailto(data);
});

clearBtn?.addEventListener("click", () => {
  saveAppointments([]);
  renderAppointments();
  showToast("C’est tout effacé ✨");
});
