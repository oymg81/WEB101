// ========= CONFIG =========
const API_URL = "/api/registro";   // Cuando montemos Flask, este endpoint existirá
const USE_DEMO_FALLBACK = true;    // Mientras no haya backend, mantenlo en true

// ========= ALERTAS =========
const alertBox = document.getElementById("alert");
function showAlert(type, text) {
  if (!alertBox) return;
  alertBox.className = "alert " + (type === "success" ? "alert-success" : "alert-error");
  alertBox.textContent = text;
  alertBox.style.display = "block";
  setTimeout(() => { alertBox.style.display = "none"; }, 5000);
}

// ========= CASILLERO (preview + demo) =========
const STORAGE_YEAR = 'lk_year';
const STORAGE_COUNTER = 'lk_counter';
const START_COUNTER = 1001;

function loadState(){
  const y = parseInt(localStorage.getItem(STORAGE_YEAR),10);
  const c = parseInt(localStorage.getItem(STORAGE_COUNTER),10);
  if(Number.isNaN(y) || Number.isNaN(c)) return null;
  return {year:y, counter:c};
}
function saveState(year, counter){
  localStorage.setItem(STORAGE_YEAR, String(year));
  localStorage.setItem(STORAGE_COUNTER, String(counter));
}
function initState(){
  const nowYear = new Date().getFullYear();
  const st = loadState();
  if(!st || st.year !== nowYear){
    saveState(nowYear, START_COUNTER);
    return {year: nowYear, counter: START_COUNTER};
  }
  return st;
}
function formatCasillero(year, counter){
  const yy = String(year).slice(-2);
  return `LTK${yy}${counter}`;
}
function updatePreview(){
  const st = initState();
  const el = document.getElementById('nextPreview');
  if(el) el.textContent = `Next casillero: ${formatCasillero(st.year, st.counter)}`;
}
function nextCasilleroDemo() {
  const nowYear = new Date().getFullYear();
  const yy = String(nowYear).slice(-2);

  let state = loadState();
  if (!state || state.year !== nowYear) {
    state = { year: nowYear, counter: START_COUNTER };
  }
  const casillero = `LTK${yy}${state.counter}`;
  saveState(state.year, state.counter + 1);
  return casillero;
}

// ========= VALIDACIÓN =========
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateFormFields() {
  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const email = document.getElementById("email").value.trim();
  const weightChecked = !!document.querySelector('input[name="weight"]:checked');

  if (!fname || !lname || !email) {
    showAlert("error", "Por favor completa nombre, apellido y correo.");
    return false;
  }
  if (!isValidEmail(email)) {
    showAlert("error", "Ingresa un correo válido.");
    return false;
  }
  if (!weightChecked) {
    showAlert("error", "Selecciona una opción de peso de carga.");
    return false;
  }
  return true;
}
function collectPayload() {
  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const email = document.getElementById("email").value.trim();
  const weight = document.querySelector('input[name="weight"]:checked')?.value || null;

  return {
    nombre: `${fname} ${lname}`.replace(/\s+/g, " ").trim(),
    email,
    peso: weight
  };
}

// ========= UI: Submit State =========
function setSubmitting(isSubmitting) {
  const btn = document.getElementById("submitBtn");
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting ? "Enviando..." : "Submit";
}

// ========= ENVÍO AL BACKEND =========
async function submitToBackend(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(json?.message || "No se pudo registrar.");
  }
  return json; // { ok:true, casillero:"LTK251001", email_status: "sent|failed|disabled" }
}

// ========= INIT =========
document.addEventListener("DOMContentLoaded", () => {
  updatePreview();

  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if (!validateFormFields()) return;

    setSubmitting(true);
    showAlert("success", "Procesando...");

    const payload = collectPayload();

    try {
      // Intentar backend real
      const data = await submitToBackend(payload);
      const casillero = data.casillero || "LTK????";
      document.getElementById('casilleroResult').textContent = `Your Casillero Number: ${casillero}`;
      showAlert("success", `¡Registro exitoso! Tu casillero es ${casillero}.`);
      form.reset();
      updatePreview();
    } catch (err) {
      // Fallback demo si backend no está listo
      if (USE_DEMO_FALLBACK) {
        const casillero = nextCasilleroDemo();
        document.getElementById('casilleroResult').textContent = `Your Casillero Number: ${casillero}`;
        showAlert("success", `¡Registro (demo) exitoso! Tu casillero es ${casillero}.`);
        form.reset();
        updatePreview();
      } else {
        console.error(err);
        showAlert("error", err.message || "Error al registrar.");
      }
    } finally {
      setSubmitting(false);
    }
  });
});
