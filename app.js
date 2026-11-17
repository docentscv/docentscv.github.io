
// ====== CONEXIÓN SUPABASE ======
/* Días de prueba que se anuncian en la web: debe coincidir con config.dias_prueba de Supabase (update config set valor='15' where clave='dias_prueba') */
const DIAS_PRUEBA = 15, DIAS_AVISO = DIAS_PRUEBA + 7;      // el aviso de descuento sale 7 días después de acabar la prueba (mismo cálculo en lanzamiento.sql)
document.querySelectorAll(".dp").forEach(e => e.textContent = DIAS_PRUEBA); document.querySelectorAll(".da").forEach(e => e.textContent = DIAS_AVISO); document.getElementById("cad-sum").textContent = "Pruebas terminadas sin pagar (" + DIAS_AVISO + " días o más)";
const SUPABASE_URL = "https://gwoamxgvnhietzhixjlf.supabase.co";
const SUPABASE_KEY = "sb_publishable_H2de5fVQpyV-L9y_5K6DpA_ZQ_zQCUl";   // clave pública
// ===============================
const PAGE = 100, ZONA = 300, PREV = 15;
const $ = id => document.getElementById(id);
const enc = encodeURIComponent;
const esc = s => String(s ?? "").replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
let offset = 0, timer = null, CURSOS = [], ESPS = [], ESPU = [], CUERPOS = [], LIST = [];
// La familia de una especialidad la da la primera cifra de su código: 1xx Maestros, 2xx Secundaria, 3xx FP especialistas, 4xx Escuelas de Idiomas, 5xx Catedráticos de Música, 6xx Música y Artes Escénicas, 7xx Artes Plásticas y Diseño, 8xx Maestros de Taller
const FAM = { "1": "maestros", "2": "secundaria", "3": "fp_especialistas", "4": "idiomas", "5": "catedraticos_musica", "6": "musica", "7": "artes_plasticas", "8": "taller_artes" };
const famDe = c => FAM[String(c || "")[0]] || "";
const buildEspU = () => { const m = new Map(); ESPS.forEach(e => { if (!m.has(e.codigo) && famDe(e.codigo)) m.set(e.codigo, { codigo: e.codigo, nombre: e.nombre, cuerpo: famDe(e.codigo) }); }); ESPU = [...m.values()].sort((a, b) => a.codigo.localeCompare(b.codigo)); };
let ADMIN = false, sb = null, RECOVERY = false, READY = false, AUTH_MODE = "login", USER = null;

async function api(path, extra = {}) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, ...extra } });
  if (!r.ok) throw new Error("Error " + r.status + " al consultar la base de datos");
  return r;
}
const getJ = async p => (await api(p)).json();
/* Contador de visitas anónimo (solo suma 1 al día por origen: ni IP, ni cookies, ni identificadores). Origen: ?o=telegram, ?o=instagram...; "app" si se abre desde la app instalada */
/* Redes sociales: si cambia un enlace, se cambia aquí. Si un enlace está vacío, su botón no se muestra. */
const REDES = { telegram: "https://t.me/DocentsCV", instagram: "https://www.instagram.com/docentscv/" };
(function () {
  const ps = [["red-tg", "telegram", "📢 Telegram"], ["red-ig", "instagram", "📸 Instagram"]];
  const pie = document.getElementById("ft-redes");
  ps.forEach(([id, k, txt]) => {
    const u = REDES[k], el = document.getElementById(id); if (!u) return;
    if (el) { el.href = u; el.hidden = false; }
    if (pie) pie.insertAdjacentHTML("beforeend", ` · <a href="${u}" target="_blank" rel="noopener">${txt}</a>`);
  });
  const sec = document.querySelector(".redes"); if (sec && !Object.values(REDES).some(Boolean)) sec.hidden = true;
})();
(function () {
  try { if (sessionStorage.getItem("dcv_v")) return; sessionStorage.setItem("dcv_v", "1"); } catch (e) {}
  let o = ""; try { o = new URLSearchParams(location.search).get("o") || ""; } catch (e) {}
  try { if (!o && window.matchMedia && matchMedia("(display-mode: standalone)").matches) o = "app"; } catch (e) {}
  /* Sistema del dispositivo (solo un recuento anónimo): ios, android o pc */
  let pl = "pc"; try { const ua = navigator.userAgent || ""; pl = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/i.test(ua) ? "android" : "pc"; } catch (e) {}
  fetch(SUPABASE_URL + "/rest/v1/rpc/contar_visita", { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_origen: o, p_plataforma: pl }) }).catch(() => {});
})();
/* Tarjetas de "cómo conseguir la app": en el móvil, cada quien ve solo la suya (iPhone o Android);
   en ordenador (o cualquier otro caso) se ven las dos, para poder compartir cualquiera de las dos. */
const ES_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "") || (/Macintosh/i.test(navigator.userAgent || "") && navigator.maxTouchPoints > 1);
const ES_ANDROID = /Android/i.test(navigator.userAgent || "");
const ES_STANDALONE = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
/* Apple/iPhone: no hay app nativa — se instala como PWA desde Safari */
(function () {
  const card = $("ios-card"); if (!card) return;
  let descartada = false; try { descartada = !!localStorage.getItem("dcv_ios_x"); } catch (e) {}
  if (ES_ANDROID || ES_STANDALONE || descartada) return;
  card.hidden = false;
  const x = $("ios-card-x"); if (x) x.onclick = () => { card.hidden = true; try { localStorage.setItem("dcv_ios_x", "1"); } catch (e) {} };
})();
/* Enlace de descarga en Android. Mientras no esté publicada en Google Play, se descarga directamente
   el .apk desde aquí mismo (súbelo a la raíz del repositorio, junto a este index.html).
   Cuando ya esté publicada en Play, cambia esto por el enlace normal de la Play Store. Vacío = no se muestra. */
const ANDROID_URL = "docentscv.apk";
/* Paso 1, solo mientras NO haya descarga directa (ANDROID_GRUPO_URL vacío = no sale este paso extra).
   Si en el futuro vuelves a necesitar pedir acceso por email antes de descargar, pon aquí de nuevo el
   enlace mailto:. Por ahora, con el .apk descargable directamente, no hace falta este paso. */
const ANDROID_GRUPO_URL = "";
(function () {
  const card = $("android-card"); if (!card || !ANDROID_URL) return;
  if (ES_IOS || ES_STANDALONE) return;   // en iPhone sale su propia tarjeta; dentro de la app ya instalada no hace falta
  $("android-card-go").href = ANDROID_URL;
  if (ANDROID_GRUPO_URL) { const g = $("android-card-grupo"); g.href = ANDROID_GRUPO_URL; g.hidden = false; }
  card.hidden = false;
})();

/* ---------- navegación ---------- */
function show(v) {
  document.querySelectorAll(".view").forEach(s => s.hidden = s.id !== "v-" + v);
  window.scrollTo(0, 0);
  const tb = $("tabbar"); tb.hidden = false;
  const tab = v === "consulta" ? "consulta" : v === "home" ? "home" : "apartado";
  tb.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  if (v === "consulta") { consultaInit(); if (!$("rows").children.length) load(true); }
  if (v === "apartado") renderApartado();
  if (v === "admin") { if (!ADMIN) return show("home"); adminSistema(); adminLista(); adminUsuarios(); adminCaducadas(); adminMensajes(); adminEmbudo(); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) { try { navigator.vibrate && navigator.vibrate(8); } catch (_) {} show(b.dataset.go); } });

/* ---------- bienvenida (solo la primera vez) y «tirar para actualizar» ---------- */
function onbInit() {
  let visto = null; try { visto = localStorage.getItem("dcv_onb"); } catch (_) {}
  if (visto) return;
  const sl = $("onb-sl"), dots = [...$("onb-dots").children], n = dots.length; $("onb").hidden = false;
  const idx = () => Math.round(sl.scrollLeft / sl.clientWidth);
  const fin = () => { $("onb").hidden = true; try { localStorage.setItem("dcv_onb", "1"); } catch (_) {} };
  sl.addEventListener("scroll", () => { const i = idx(); dots.forEach((d, k) => d.classList.toggle("on", k === i)); $("onb-next").textContent = i === n - 1 ? "Empezar" : "Siguiente"; });
  $("onb-next").onclick = () => { const i = idx(); if (i >= n - 1) fin(); else sl.scrollTo({ left: (i + 1) * sl.clientWidth, behavior: "smooth" }); };
  $("onb-skip").onclick = fin;
}
(function () {
  const app = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  if (!app) return;                                   // solo dentro de la app instalada
  let y0 = null, d = 0; const p = $("ptr");
  addEventListener("touchstart", e => { y0 = window.scrollY <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null; d = 0; }, { passive: true });
  addEventListener("touchmove", e => { if (y0 === null) return; d = Math.max(0, e.touches[0].clientY - y0); const t = Math.min(d, 110) * .6; p.style.setProperty("--ty", t + "px"); p.style.opacity = Math.min(1, d / 80); p.style.transform = `translateY(${t}px) rotate(${d * 3}deg)`; }, { passive: true });
  addEventListener("touchend", () => { if (y0 === null) return; if (d > 90) { p.classList.add("go"); p.style.opacity = 1; setTimeout(() => location.reload(), 250); } else { p.style.opacity = 0; p.style.transform = ""; } y0 = null; });
})();
/* menú de usuario */
(function () {
  const b = $("av-btn"), m = $("menu-us");
  const cerrar = () => { m.hidden = true; b.setAttribute("aria-expanded", "false"); };
  b.onclick = e => { e.stopPropagation(); m.hidden = !m.hidden; b.setAttribute("aria-expanded", String(!m.hidden)); };
  document.addEventListener("click", e => { if (!m.hidden && !m.contains(e.target)) cerrar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrar(); });
  m.addEventListener("click", cerrar);
})();
/* Inicio: «Hoy en las listas» */
async function homeHoy() {
  const [o, d] = await Promise.all([cargarOfertas(), cargarDif()]);
  const ult = ultFechaContinua(), t = [];
  const m = (INST || []).filter(i => i.tipo === "continua" && i.fecha === ult);
  if (o.fecha) t.push(`<button class="o" data-go="consulta"><div class="n">${o.rows.length}</div><div class="t"><b>Plazas ofertadas</b><small>${ofertaVigente() ? "Próxima adjudicación" : "Adjudicación"} · ${fmtF(o.fecha)}</small></div></button>`);
  if (d.fecha) t.push(`<button class="d" data-go="consulta"><div class="n">${d.rows.length}</div><div class="t"><b>Difícil cobertura</b><small>Publicadas el ${fmtF(d.fecha)}</small></div></button>`);
  $("home-hoy").innerHTML = t.length ? t.join("") : '<p class="note" style="margin:0">Aún no hay plazas ofertadas publicadas.</p>';
}
/* ---------- notificaciones push (solo si la persona las activa en este dispositivo) ---------- */
const b64u = b => { const p = "=".repeat((4 - b.length % 4) % 4), r = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
async function pushInit() {
  const txt = $("push-txt"), btn = $("push-btn"); if (!txt) return;
  const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!ok) { txt.textContent = /iPhone|iPad/i.test(navigator.userAgent) ? "En iPhone, añade primero la web a tu pantalla de inicio (Compartir → «Añadir a pantalla de inicio») y ábrela desde allí." : "Este navegador no admite notificaciones."; return; }
  if (Notification.permission === "denied") { txt.textContent = "Las notificaciones están bloqueadas en este navegador. Permítelas en los ajustes del sitio para poder activarlas."; return; }
  let reg, sub = null, activo = false;
  try { reg = await navigator.serviceWorker.ready; sub = await reg.pushManager.getSubscription(); if (sub) activo = !!(await sb.rpc("push_activo", { p_endpoint: sub.endpoint })).data; } catch (e) { txt.textContent = "No se pudo comprobar el estado de las notificaciones."; return; }
  const pintar = () => { txt.textContent = activo ? "Activadas: te avisaremos en este dispositivo cuando se publiquen plazas ofertadas en tus bolsas." : "Recibe un aviso en este dispositivo cuando se publiquen plazas ofertadas en tus bolsas. Es opcional y puedes desactivarlo cuando quieras."; btn.textContent = activo ? "Desactivar notificaciones" : "Activar notificaciones"; btn.hidden = false; };
  pintar();
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      if (activo) {
        const s = await reg.pushManager.getSubscription(); if (s) { await sb.rpc("quitar_push", { p_endpoint: s.endpoint }); await s.unsubscribe(); } activo = false;
      } else {
        if ((await Notification.requestPermission()) !== "granted") { txt.textContent = "No has dado permiso. Puedes volver a intentarlo cuando quieras."; btn.disabled = false; return; }
        const k = (await sb.rpc("vapid_publica")).data; if (!k) { txt.textContent = "Las notificaciones aún no están disponibles. Inténtalo más tarde."; btn.disabled = false; return; }
        let s; try { s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(k) }); }
        catch (e1) { try { const v = await reg.pushManager.getSubscription(); if (v) await v.unsubscribe(); } catch (e2) {} await new Promise(r => setTimeout(r, 1500)); s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(k) }); }
        const j = s.toJSON();
        const r = await sb.rpc("guardar_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }); if (r.error || !r.data) throw new Error("no guardado");
        activo = true;
      }
      pintar();
    } catch (e) { const m = e && e.message ? e.message : "error"; txt.textContent = /push service|AbortError|registration failed/i.test(m + (e && e.name || "")) ? "Tu móvil no ha podido registrarse en el servicio de notificaciones de Google. Comprueba que tienes internet, que Google Play Services está actualizado y que no hay ahorro de batería o datos que bloquee la app; luego pulsa de nuevo. Si sigue igual, prueba a abrir esta web desde Chrome." : "No se pudo completar: " + m; }
    btn.disabled = false;
  };
}
/* ---------- arranque ---------- */
async function init() {
  if (SUPABASE_URL.startsWith("PEGA") || SUPABASE_KEY.startsWith("PEGA")) { $("cfgerr").hidden = false; return; }
  try {
    [CURSOS, ESPS, CUERPOS, LIST] = await Promise.all([getJ("cursos?select=*&order=id.desc"), getJ("especialidades?select=*&order=codigo&limit=1000"), getJ("cuerpos?select=*"), getJ("listados?select=*")]);
    buildEspU(); $("cuerpo").innerHTML = cuerpoOptions("maestros"); fillConsulta();
  } catch (e) { $("cfgerr").hidden = false; $("cfgerr").textContent = e.message + ". Revisa la conexión con la base de datos."; }
}
const cuerpoOptions = sel => CUERPOS.map(c => `<option value="${esc(c.slug)}"${c.slug === sel ? " selected" : ""}>${esc(c.nombre)}</option>`).join("");
const espOptions = (cuerpo, sel) => ESPU.filter(e => e.cuerpo === cuerpo).map(e => `<option value="${esc(e.codigo)}"${e.codigo === sel ? " selected" : ""}>${esc(e.codigo)} · ${esc(e.nombre)}</option>`).join("");
const okCursos = cuerpo => new Set(LIST.filter(l => l.cuerpo === cuerpo && l.usar_en_estimaciones).map(l => l.curso_id));
function fillConsulta() {
  const cu = $("cuerpo").value, flag = new Map(LIST.filter(l => l.cuerpo === cu).map(l => [l.curso_id, l.usar_en_estimaciones]));
  $("curso").innerHTML = CURSOS.map(c => `<option value="${c.id}">${esc(c.curso)}${flag.get(c.id) === false ? " (datos por verificar)" : ""}</option>`).join("");
  $("esp").innerHTML = espOptions(cu, cu === "maestros" ? "128" : "");
}
const t0 = Date.now();
initAuth();
init().finally(() => setTimeout(() => { consultaInit(); READY = true; if (RECOVERY) { show("auth"); authMode("nueva"); } else { show("home"); onbInit(); comprobarPagoURL(); } $("splash").classList.add("out"); }, Math.max(0, 1300 - (Date.now() - t0))));

/* ---------- estimación común ---------- */
async function estimateHTML(cuerpo, esp, my) {
  const rows = await getJ(`v_corte_especialidad?select=curso_id,curso,provincia,adjudicaciones,pos_max&cuerpo=eq.${enc(cuerpo)}&lista_codigo=eq.${enc(esp)}`);
  const ok = okCursos(cuerpo), by = {};
  rows.filter(r => ok.has(r.curso_id)).forEach(r => (by[r.curso] ||= []).push(r));
  return Object.keys(by).sort().reverse().map(c => {
    const tot = by[c].reduce((s, r) => s + r.adjudicaciones, 0), max = Math.max(...by[c].map(r => r.pos_max));
    const prov = by[c].map(r => `${esc(r.provincia)}: hasta ${r.pos_max}`).join(" · ");
    const rel = my ? (my <= max ? " Tu posición queda dentro de ese rango." : " Tu posición queda por encima de ese rango.") : "";
    return `<li><strong>${esc(c)}</strong>: ${tot} adjudicaciones, la última en la posición ${max}. ${prov}.${rel}</li>`;
  }).join("");
}

/* ---------- CONSULTA ---------- */
async function load(reset) {
  if (reset) { offset = 0; $("rows").innerHTML = ""; }
  const prov = $("prov").value, q = $("q").value.trim().replace(/[*,()]/g, " "), my = parseInt($("mypos").value, 10) || 0;
  let p = `adjudicaciones?select=posicion,tipo,horas,especialidad_codigo,centros!inner(nombre,localidad,provincia)&curso_id=eq.${$("curso").value}&cuerpo=eq.${enc($("cuerpo").value)}&lista_codigo=eq.${enc($("esp").value)}&order=posicion.asc&limit=${PAGE}&offset=${offset}`;
  if (prov) p += `&centros.provincia=eq.${enc(prov)}`;
  if (q) p += `&centros.or=(nombre.ilike.*${enc(q)}*,localidad.ilike.*${enc(q)}*)`;
  try {
    const r = await api(p, { Prefer: "count=exact" });
    const total = parseInt((r.headers.get("Content-Range") || "").split("/")[1], 10);
    const data = await r.json();
    $("rows").insertAdjacentHTML("beforeend", data.map(a => {
      const reach = my && a.posicion >= my;
      return `<tr class="${reach ? "reach" : ""}"><td>${esc(a.centros.localidad)}</td><td>${esc(a.centros.nombre)}</td><td>${esc(a.especialidad_codigo)}</td><td>${a.tipo === "vacante" ? "Vacante" : "Sustitución"}</td><td class="n">${a.posicion}${reach ? ' <span class="tag">a tu alcance</span>' : ""}</td></tr>`;
    }).join(""));
    offset += data.length;
    $("more").hidden = !(offset < total);
    $("msg").textContent = total ? `Mostrando ${offset} de ${total} adjudicaciones.` : "Sin resultados. Prueba con otra provincia o borra el texto del filtro.";
    if (reset) { try { $("est").innerHTML = await estimateHTML($("cuerpo").value, $("esp").value, my); $("estpanel").hidden = !$("est").innerHTML; } catch (e) { $("estpanel").hidden = true; } }
  } catch (e) { $("msg").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
}
["curso", "esp", "prov"].forEach(id => $(id).addEventListener("change", () => load(true)));
$("cuerpo").addEventListener("change", () => { fillConsulta(); load(true); });
["q", "mypos"].forEach(id => $(id).addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => load(true), 400); }));
$("more").addEventListener("click", () => load(false));

/* ---------- CONSULTA: últimas adjudicaciones y buscador ---------- */
let INST = [], LISTAS = {}, CEN = {}, ULT = {}, ULT_SHOWN = 0;
const UL_PAGE = 25;
const espNom = (cuerpo, cod) => { const e = ESPU.find(x => x.codigo === cod); return e ? cod + " · " + e.nombre : (cod || ""); };
async function cargarCentros(codes) {
  const need = [...new Set(codes.filter(c => c && !CEN[c]))];
  for (let i = 0; i < need.length; i += 150) {
    const ids = need.slice(i, i + 150).map(enc).join(",");
    let r; try { r = await getJ(`centros?select=codigo,nombre,localidad,provincia,lat,lon,direccion,cp&codigo=in.(${ids})&limit=1000`); }
    catch (e) { try { r = await getJ(`centros?select=codigo,nombre,localidad,provincia,lat,lon&codigo=in.(${ids})&limit=1000`); }
      catch (e2) { r = await getJ(`centros?select=codigo,nombre,localidad,provincia&codigo=in.(${ids})&limit=1000`); } }
    r.forEach(c => CEN[c.codigo] = c);
  }
}
/* ---------- distancia a los centros: solo para quien tiene cuenta y ha indicado su domicilio ---------- */
let GEO = null, DOM = null, LAST_DIST = null, ACC = null, CONS_Y = 0;      // GEO: coordenadas de las localidades (respaldo) · DOM: ubicación aproximada del usuario
function kmRecto(a, b) { const R = 6371, t = x => x * Math.PI / 180, dl = t(b.lat - a.lat), dn = t(b.lon - a.lon), h = Math.sin(dl / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
async function geoCargar() {
  DOM = null;
  try {
    if (!sb) return; const { data: { session } } = await sb.auth.getSession(); if (!session) return;
    const { data } = await sb.rpc("mi_domicilio"); DOM = data && data.lat != null ? data : null;
    if (DOM && !GEO) { const rows = await getJ("localidades_geo?select=localidad,provincia,lat,lon&lat=not.is.null&limit=2000"); GEO = new Map(rows.map(g => [g.localidad + "|" + g.provincia, g])); }
  } catch (e) {}
}
function distInfo(cod) {
  if (!DOM) return null;
  const c = CEN[cod] || {}, b = (c.lat != null && c.lon != null) ? c : (GEO && GEO.get((c.localidad || "") + "|" + (c.provincia || "")));
  if (!b || b.lat == null) return null;
  const km = kmRecto(DOM, b) * 1.3, v = km < 20 ? 45 : km < 60 ? 65 : 80, min = Math.max(5, Math.round(km / v * 60 / 5) * 5);   // carretera ≈ 1,3 × línea recta
  const hm = min >= 60 ? Math.floor(min / 60) + " h" + (min % 60 ? " " + (min % 60) + " min" : "") : min + " min";
  return { km, min, txt: km < 1 ? "A menos de 1 km" : "≈ " + Math.round(km) + " km · " + hm };
}
function mapsUrl(cod) {      // ruta en Google Maps desde tu domicilio (ubicación aproximada) hasta el centro, buscado por nombre y dirección
  const c = CEN[cod] || {}; if (!DOM) return "";
  const dest = [c.nombre, c.direccion, ((c.cp || "") + " " + (c.localidad || "")).trim(), "España"].filter(Boolean).join(", ");
  return "https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=" + encodeURIComponent(DOM.lat + "," + DOM.lon) + "&destination=" + encodeURIComponent(dest);
}
const mapsLink = cod => mapsUrl(cod) ? `<a href="${mapsUrl(cod)}" target="_blank" rel="noopener" class="btn" style="text-decoration:none;display:inline-block;margin:.2rem .4rem .2rem 0">🗺️ Ver ruta en Google Maps</a>` : "";
const distTxt = cod => { const d = distInfo(cod); return d ? " · 📍 " + d.txt : ""; };
const distLinea = cod => { const d = distInfo(cod); return d ? `<p style="margin:.2rem 0 .5rem"><span class="dist" title="Distancia aproximada por carretera desde tu domicilio">📍 ${d.txt}</span> <a href="${mapsUrl(cod)}" target="_blank" rel="noopener" style="font-size:.85rem;white-space:nowrap">🗺️ Ver ruta en Maps</a></p>` : ""; };
const distCmp = (a, b) => { if (DOM) { const x = distInfo(a[0]), y = distInfo(b[0]); const d = (x ? x.km : 1e9) - (y ? y.km : 1e9); if (d) return d; } return (a[1].l + a[1].n).localeCompare(b[1].l + b[1].n); };
/* En Consulta solo se ve el icono: al pulsarlo hay que tener cuenta (y domicilio) para ver el resultado */
const distBtn = r => r.centro_codigo ? `<br><button type="button" class="dbtn" data-c="${esc(r.centro_codigo)}" title="Ver la distancia desde tu domicilio">📍 Distancia</button>` : "";
async function distPulsar(cod) {
  if (!sb) return;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { show("auth"); authMode("registro"); authAviso("Crea tu cuenta gratis para ver la distancia y el tiempo hasta cada centro."); return; }
  LAST_DIST = cod; CONS_Y = window.scrollY; show("apartado");      // la distancia se ve en Mi apartado (con acceso); sin acceso, ahí mismo se ofrece pagar o invitar
}
document.addEventListener("click", ev => { const b = ev.target.closest(".dbtn[data-c]"); if (b) distPulsar(b.dataset.c); });

/* ---------- avisos breves ---------- */
function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 4200); }

/* ---------- favoritos: centros que sigo y plazas de difícil cobertura que sigo ---------- */
let FAV = new Set(), SEG = new Set();
const segKey = r => r.especialidad_codigo + "|" + r.codigo_plaza;
async function favCargar() {
  FAV = new Set(); SEG = new Set();
  try {
    if (!sb) return; const { data: { session } } = await sb.auth.getSession(); if (!session) return;
    const [a, b] = await Promise.all([sb.rpc("mis_favoritos"), sb.rpc("mis_dificil_seguidas")]);
    (a.data || []).forEach(c => FAV.add(c)); (b.data || []).forEach(x => SEG.add(x.especialidad_codigo + "|" + x.codigo_plaza));
  } catch (e) {}
}
const favBtn = r => r.centro_codigo ? `<button type="button" class="fbtn${FAV.has(r.centro_codigo) ? " on" : ""}" data-fc="${esc(r.centro_codigo)}" title="Avisarme cuando salgan plazas en este centro">${FAV.has(r.centro_codigo) ? "⭐ Favorito" : "☆ Favorito"}</button>` : "";
const segBtn = r => r.codigo_plaza ? `<button type="button" class="fbtn${SEG.has(segKey(r)) ? " on" : ""}" data-sp="${esc(segKey(r))}" data-sc="${esc(r.centro_codigo || "")}" data-sb="${esc(r.cuerpo || "")}" title="Seguir esta plaza">${SEG.has(segKey(r)) ? "📌 Sigo esta plaza" : "📌 Seguir"}</button>` : "";
function favRepintar() {
  document.querySelectorAll(".fbtn[data-fc]").forEach(b => { const on = FAV.has(b.dataset.fc); b.classList.toggle("on", on); b.textContent = on ? "⭐ Favorito" : "☆ Favorito"; });
  document.querySelectorAll(".fbtn[data-sp]").forEach(b => { const on = SEG.has(b.dataset.sp); b.classList.toggle("on", on); b.textContent = on ? "📌 Sigo esta plaza" : "📌 Seguir"; });
}
const FAV_ERR = { limite: "Has llegado al máximo de favoritos.", no_existe: "No encontramos ese centro.", sin_acceso: "" };
async function favPulsar(b) {
  if (!sb) return;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { show("auth"); authMode("registro"); authAviso("🔒 Para acceder al mapa y a los favoritos tienes que registrarte. Es gratis y solo te llevará un minuto."); return; }
  const esFav = b.dataset.fc != null, on = !b.classList.contains("on");
  const rpc = esFav ? await sb.rpc("fav_centro", { p_centro: b.dataset.fc, p_on: on })
    : await sb.rpc("seguir_dificil", { p_esp: b.dataset.sp.split("|")[0], p_plaza: b.dataset.sp.split("|").slice(1).join("|"), p_centro: b.dataset.sc, p_cuerpo: b.dataset.sb, p_on: on });
  if (rpc.data === "sin_acceso") { LAST_DIST = null; show("apartado"); return; }     // ahí se ofrece pagar o invitar
  if (rpc.error || rpc.data !== "ok") { toast(FAV_ERR[rpc.data] || "No se pudo guardar. Inténtalo de nuevo."); return; }
  if (esFav) on ? FAV.add(b.dataset.fc) : FAV.delete(b.dataset.fc); else on ? SEG.add(b.dataset.sp) : SEG.delete(b.dataset.sp);
  favRepintar();
  toast(on ? (esFav ? "Centro favorito guardado. Te avisaremos cuando salgan plazas ahí (activa las notificaciones en Mi apartado → Ajustes)." : "Plaza guardada en «Mi apartado».") : "Quitado.");
  if (!$("v-apartado").hidden) { const q = $("fav-q") ? $("fav-q").value : ""; await favCard(ACC); if (q && $("fav-q")) { $("fav-q").value = q; $("fav-q").dispatchEvent(new Event("input")); } }
}
document.addEventListener("click", ev => { const b = ev.target.closest(".fbtn"); if (b) favPulsar(b); });

/* Tarjeta de Mi apartado: mis centros favoritos (con lo que hay ahora) y las plazas de difícil cobertura que sigo */
async function favCard(ac) {
  const box = $("fav-card"); if (!box) return;
  if (!ac || !ac.activo) { box.innerHTML = ""; return; }
  await favCargar(); await Promise.all([cargarOfertas(), cargarDif()]); await geoCargar();
  let seg = []; try { seg = (await sb.rpc("mis_dificil_seguidas")).data || []; } catch (e) {}
  await cargarCentros([...FAV, ...seg.map(x => x.centro_codigo)]);
  const of = (OFER && OFER.rows) || [], dc = (DIF && DIF.rows) || [];
  const cuenta = (rows, cod) => { const r = rows.filter(x => x.centro_codigo === cod); const m = new Map(); r.forEach(x => m.set(x.especialidad_codigo, (m.get(x.especialidad_codigo) || 0) + 1)); return { n: r.length, txt: [...m].map(([e, n]) => esc(espNom("", e)) + (n > 1 ? " ×" + n : "")).join(", ") }; };
  const lista = [...FAV].sort((a, b) => ((CEN[a] || {}).nombre || a).localeCompare((CEN[b] || {}).nombre || b)).map(cod => {
    const c = CEN[cod] || {}, o = cuenta(of, cod), d = cuenta(dc, cod);
    const hay = [o.n ? `<b>${o.n}</b> ofertada${o.n === 1 ? "" : "s"} (${fmtF(OFER.fecha)}): ${o.txt}` : "", d.n ? `<b>${d.n}</b> de difícil cobertura (${fmtF(DIF.fecha)}): ${d.txt}` : ""].filter(Boolean).join("<br>");
    return `<div class="it"><div class="a"><b>${esc(c.nombre || cod)}</b><small>${esc(c.localidad || "")}${distTxt(cod)}<br>${hay || "Sin plazas en las últimas publicaciones."}</small></div><div class="z"><button type="button" class="fbtn on" data-fc="${esc(cod)}">⭐ Quitar</button></div></div>`;
  }).join("");
  const adj = DIF && DIF.adj ? DIF.adj : new Map(), vivas = new Set(dc.map(segKey));
  const segl = seg.map(x => {
    const c = CEN[x.centro_codigo] || {}, k = x.especialidad_codigo + "|" + x.codigo_plaza;
    const st = adj.has(k) ? `<span style="color:var(--ok)">✔ Adjudicada (${fmtF(DIF.fecha)})</span>` : vivas.has(k) ? `Sigue publicada (${fmtF(DIF.fecha)})` : `Ya no figura en la última publicación`;
    return `<div class="it"><div class="a"><b>${esc(c.nombre || x.centro_codigo || "Centro")}</b><small>${esc(c.localidad || "")} · ${esc(espNom("", x.especialidad_codigo))} · plaza ${esc(x.codigo_plaza)}<br>${st}</small></div><div class="z"><button type="button" class="fbtn on" data-sp="${esc(k)}" data-sc="${esc(x.centro_codigo || "")}" data-sb="${esc(x.cuerpo || "")}">📌 Quitar</button></div></div>`;
  }).join("");
  box.innerHTML = `<div class="panel" style="margin-top:1rem"><h2 style="margin-top:0">⭐ Mis centros favoritos</h2>
    <p class="note" style="margin:0 0 .5rem">Te avisamos por notificación cuando salgan plazas ofertadas o de difícil cobertura en estos centros. <a href="#" id="fav-notif">Activar notificaciones</a></p>
    <div id="fav-lista">${lista || '<p class="note" style="margin:.3rem 0">Todavía no tienes ninguno. Búscalos aquí o pulsa «☆ Favorito» en las plazas de Consulta.</p>'}</div>
    <div class="filters" style="margin-top:.6rem"><label>Añadir un centro <input id="fav-q" type="search" placeholder="Nombre o localidad" style="min-width:min(16rem,70vw)"></label></div><div id="fav-res"></div>
    ${segl ? `<h2 style="margin:1rem 0 .2rem">📌 Plazas de difícil cobertura que sigo</h2><div>${segl}</div>` : ""}</div>`;
  $("fav-notif").onclick = ev => { ev.preventDefault(); $("mn-aj").click(); };
  let t = null; $("fav-q").addEventListener("input", () => {
    clearTimeout(t); t = setTimeout(async () => {
      const q = $("fav-q").value.trim().replace(/[*,()]/g, " ").trim(), out = $("fav-res");
      if (q.length < 3) { out.innerHTML = ""; return; }
      try {
        const cs = await getJ(`centros?select=codigo,nombre,localidad,provincia,lat,lon&or=(nombre.ilike.*${enc(q)}*,localidad.ilike.*${enc(q)}*)&order=localidad.asc&limit=12`);
        cs.forEach(c => { if (!CEN[c.codigo]) CEN[c.codigo] = c; });
        out.innerHTML = cs.length ? cs.map(c => `<div class="it"><div class="a"><b>${esc(c.nombre)}</b><small>${esc(c.localidad || "")}</small></div><div class="z"><button type="button" class="fbtn${FAV.has(c.codigo) ? " on" : ""}" data-fc="${esc(c.codigo)}">${FAV.has(c.codigo) ? "⭐ Favorito" : "☆ Favorito"}</button></div></div>`).join("") : '<p class="note">No encontramos ningún centro.</p>';
      } catch (e) { out.innerHTML = '<p class="note">No se pudo buscar.</p>'; }
    }, 350);
  });
}

/* ---------- mapa de plazas (OpenStreetMap con Leaflet; se carga solo al pedirlo) ---------- */
const MAPAS = {};
function leafletCargar() {
  if (window.L) return Promise.resolve();
  return new Promise((ok, ko) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"; document.head.appendChild(l);
    const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"; sc.onload = ok; sc.onerror = ko; document.head.appendChild(sc);
  });
}
async function geoLocs() {
  if (GEO) return;
  try { const rows = await getJ("localidades_geo?select=localidad,provincia,lat,lon&lat=not.is.null&limit=2000"); GEO = new Map(rows.map(g => [g.localidad + "|" + g.provincia, g])); } catch (e) { GEO = new Map(); }
}
const posCentro = cod => { const c = CEN[cod] || {}; if (c.lat != null && c.lon != null) return [c.lat, c.lon]; const g = GEO && GEO.get((c.localidad || "") + "|" + (c.provincia || "")); return g && g.lat != null ? [g.lat, g.lon] : null; };
async function mapaRefrescar(pre) {
  const el = $(pre + "-map"); if (!el || el.hidden) return;
  const rows = (pre === "of" ? window.__ofFil : pre === "ua" ? window.__uaFil : window.__dcFil) || [];
  try { await Promise.all([leafletCargar(), geoLocs()]); } catch (e) { el.outerHTML = '<p class="note" id="' + pre + '-map">No se pudo cargar el mapa.</p>'; return; }
  let m = MAPAS[pre]; if (!m) { m = MAPAS[pre] = { map: L.map(el).setView([39.2, -0.6], 7), capa: L.layerGroup() }; L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(m.map); m.capa.addTo(m.map); }
  m.capa.clearLayers();
  const por = new Map(); rows.forEach(r => { if (!por.has(r.centro_codigo)) por.set(r.centro_codigo, []); por.get(r.centro_codigo).push(r); });
  const pts = [];
  por.forEach((rs, cod) => {
    const pos = posCentro(cod); if (!pos) return; pts.push(pos);
    const c = CEN[cod] || {}, ge = new Map(); rs.forEach(r => ge.set(r.especialidad_codigo, (ge.get(r.especialidad_codigo) || 0) + 1));
    const html = `<b>${esc(c.nombre || cod)}</b><br>${esc(c.localidad || "")}<br>${rs.length} plaza${rs.length === 1 ? "" : "s"}: ${[...ge].map(([e, n]) => esc(espNom("", e)) + (n > 1 ? " ×" + n : "")).join(", ")}<br>`;
    const mk = L.circleMarker(pos, { radius: 6 + Math.min(rs.length, 8), color: "#0F7B8A", weight: 2, fillColor: "#0F7B8A", fillOpacity: .55 }).addTo(m.capa);
    mk.bindPopup(() => {
      const d = document.createElement("div"); d.innerHTML = html + `<button type="button" class="dbtn" data-c="${esc(cod)}">📍 Distancia</button>${favBtn({ centro_codigo: cod })} ${fichaBtn({ centro_codigo: cod })}`;
      d.querySelector(".dbtn").onclick = ev => { ev.stopPropagation(); distPulsar(cod); };
      const f = d.querySelector(".fbtn"); if (f) f.onclick = ev => { ev.stopPropagation(); favPulsar(f); };
      return d;
    });
  });
  setTimeout(() => { m.map.invalidateSize(); if (pts.length) m.map.fitBounds(L.latLngBounds(pts).pad(.15), { maxZoom: 12 }); }, 80);
}
["of", "dc", "ua"].forEach(pre => document.addEventListener("click", async ev => {
  const b = ev.target.closest("#" + pre + "-mapbtn"); if (!b) return;
  const el = $(pre + "-map");
  if (el.hidden) {      // el mapa es solo para personas con cuenta
    let ses = null; try { ses = sb ? (await sb.auth.getSession()).data.session : null; } catch (e) {}
    if (!ses) { show("auth"); authMode("registro"); authAviso("🔒 Para acceder al mapa y a los favoritos tienes que registrarte. Es gratis y solo te llevará un minuto."); return; }
  } el.hidden = !el.hidden; b.textContent = el.hidden ? "🗺️ Ver en el mapa" : "🗺️ Ocultar mapa";
  mapaRefrescar(pre);
}));
/* Domicilio: se convierte una sola vez en coordenadas (OpenStreetMap) y solo se guarda la ubicación aproximada, nunca la dirección escrita */
async function geocodificarDom(calle, cp, loc) {
  const qs = []; if (calle) qs.push([`${calle}, ${cp} ${loc}, España`, true]); qs.push([`${cp} ${loc}, España`, false]);
  for (const [q, exacta] of qs) {
    try {
      const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&accept-language=es&viewbox=-1.6,40.9,0.8,37.7&bounded=1&q=" + encodeURIComponent(q)), j = await r.json();
      if (j && j[0]) return { lat: +j[0].lat, lon: +j[0].lon, exacta };
    } catch (e) {}
  }
  return null;
}
async function guardarDom(calle, cp, loc) {
  calle = (calle || "").trim(); cp = (cp || "").trim(); loc = (loc || "").trim();
  if (!/^\d{5}$/.test(cp) || loc.length < 2) return { ok: false, msg: "Escribe el código postal (5 cifras) y la localidad." };
  const p = await geocodificarDom(calle, cp, loc);
  if (!p) return { ok: false, msg: "No hemos encontrado esa dirección. Prueba solo con el código postal y la localidad." };
  const { data, error } = await sb.rpc("guardar_domicilio", { p_lat: p.lat, p_lon: p.lon, p_cp: cp, p_localidad: loc });
  if (error || data !== "ok") return { ok: false, msg: data === "fuera_de_zona" ? "Esa ubicación está fuera de la Comunitat Valenciana." : "No se pudo guardar el domicilio." };
  DOM = { lat: p.lat, lon: p.lon, cp, localidad: loc, aviso_km: DOM ? DOM.aviso_km : null };
  return { ok: true, exacta: p.exacta, msg: p.exacta ? "Domicilio guardado." : "Hemos localizado tu código postal (no la calle exacta): las distancias serán algo más aproximadas." };
}
const ultimaInst = g => INST.filter(i => i.tipo === "continua" && i.grupo === g).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
async function ultRows(g) {
  if (ULT[g]) return ULT[g];
  const ins = ultimaInst(g); if (!ins) return (ULT[g] = { ins: null, rows: [] });
  const rows = await getJ(`adjudicaciones_continuas?select=posicion,tipo,especialidad_codigo,centro_codigo,lista_id&instantanea_id=eq.${ins.id}&order=posicion.asc&limit=1000`);
  await cargarCentros(rows.map(r => r.centro_codigo));
  return (ULT[g] = { ins, rows });
}
async function consultaInit() {
  if (consultaInit.hecho) return; consultaInit.hecho = true;
  try {
    const [ins, lis] = await Promise.all([getJ("instantaneas?select=id,fecha,tipo,grupo&order=fecha.desc&limit=500"), getJ("listas?select=*&limit=500")]);
    INST = ins; lis.forEach(l => LISTAS[l.id] = l);
    $("bs-cuerpo").innerHTML = cuerpoOptions("maestros"); bsEsp();
    const [m, o] = await Promise.all([ultRows("maestros"), ultRows("otros")]);
    const fechas = INST.filter(i => i.tipo === "continua").map(i => i.fecha), ult = fechas.sort().pop(), tandas = new Set(fechas).size + (ult ? 1 : 0) - (ult ? 1 : 0);
    const tandasN = new Set(INST.filter(i => i.tipo === "continua").map(i => i.fecha)).size;
    const enUlt = (x) => x.ins && x.ins.fecha === ult ? x.rows.length : 0;
    $("hero").innerHTML = `<div class="k">Adjudicaciones continuas</div><div class="h">Última tanda: ${fmtF(ult)}</div>
      <div class="g"><div><b>${enUlt(m) + enUlt(o)}</b><small>plazas adjudicadas en la última tanda</small></div><div><b>${m.rows.length}</b><small>Maestros (última lista, ${m.ins ? fmtF(m.ins.fecha) : "—"})</small></div><div><b>${o.rows.length}</b><small>Secundaria y otros (última lista, ${o.ins ? fmtF(o.ins.fecha) : "—"})</small></div><div><b>${tandasN}</b><small>fechas con adjudicaciones este curso</small></div></div>`;
    $("home-stats").innerHTML = `<div><b>${enUlt(m) + enUlt(o)}</b><small>plazas adjudicadas en la última tanda</small></div><div><b>${fmtF(ult).slice(0, 5)}</b><small>última tanda (${fmtF(ult).slice(6)})</small></div><div><b>${tandasN}</b><small>fechas con adjudicaciones este curso</small></div>`;
    ultimas(); ofertasInit(); difInit(); homeHoy();
  } catch (e) { $("hero").innerHTML = `<div class="h">No se pudieron cargar las adjudicaciones</div><div>${esc(e.message)}</div>`; }
}
async function ultimas() {
  const g = $("ul-grupo").value, { ins, rows } = await ultRows(g), q = $("ul-q").value.trim().toLowerCase();
  const lista = rows.filter(r => { if (!q) return true; const c = CEN[r.centro_codigo] || {}; return ((c.nombre || "") + " " + (c.localidad || "")).toLowerCase().includes(q); });
  window.__ulLista = lista; ULT_SHOWN = 0; $("ul-rows").innerHTML = "";
  $("ul-fecha").innerHTML = ins ? `Lista del <strong>${fmtF(ins.fecha)}</strong>: ${rows.length} plaza${rows.length === 1 ? "" : "s"} adjudicada${rows.length === 1 ? "" : "s"}.` : "Todavía no hay adjudicaciones de esta lista.";
  ultMas();
}
function ultMas() {
  const lista = window.__ulLista || [], trozo = lista.slice(ULT_SHOWN, ULT_SHOWN + UL_PAGE);
  $("ul-rows").insertAdjacentHTML("beforeend", trozo.map(r => {
    const c = CEN[r.centro_codigo] || {}, l = LISTAS[r.lista_id] || {}, cu = l.cuerpo || "maestros";
    return `<div class="it"><div class="a"><b>${esc(c.nombre || r.centro_codigo || "")}</b><small>${esc(c.localidad || "")} · ${esc(espNom(cu, r.especialidad_codigo))}${cu !== "maestros" ? " (" + esc(cuerpoNombre(cu)) + ")" : ""}</small></div><div class="z"><span class="pos-b">${r.posicion}</span><small>${r.tipo === "vacante" ? "Vacante" : "Sustitución"}</small></div></div>`;
  }).join(""));
  ULT_SHOWN += trozo.length;
  $("ul-more").hidden = ULT_SHOWN >= lista.length;
  $("ul-msg").textContent = lista.length ? `Mostrando ${ULT_SHOWN} de ${lista.length}.` : "Sin resultados.";
}
function bsEsp() { const cu = $("bs-cuerpo").value; $("bs-esp").innerHTML = '<option value="">Todas las especialidades</option>' + espOptions(cu, ""); }
async function bsBuscar() {
  const cu = $("bs-cuerpo").value, esp = $("bs-esp").value, q = $("bs-q").value.trim().replace(/[*,()]/g, " ").trim(), out = $("bs-body");
  if (!esp && q.length < 3) { out.innerHTML = '<p class="note">Elige una especialidad o escribe al menos 3 letras de un centro o localidad.</p>'; return; }
  out.innerHTML = '<p class="note">Buscando…</p>';
  try {
    const ids = Object.values(LISTAS).filter(l => l.cuerpo === cu).map(l => l.id);
    if (!ids.length) { out.innerHTML = '<p class="note">Todavía no hay adjudicaciones continuas de este cuerpo.</p>'; return; }
    let filtroC = "";
    if (q) {
      const cs = await getJ(`centros?select=codigo,nombre,localidad,provincia&or=(nombre.ilike.*${enc(q)}*,localidad.ilike.*${enc(q)}*)&limit=300`);
      if (!cs.length) { out.innerHTML = '<p class="note">No encontramos ningún centro o localidad con ese texto.</p>'; return; }
      cs.forEach(c => CEN[c.codigo] = c); filtroC = `&centro_codigo=in.(${cs.map(c => enc(c.codigo)).join(",")})`;
    }
    const rows = await getJ(`adjudicaciones_continuas?select=instantanea_id,posicion,tipo,centro_codigo,especialidad_codigo&lista_id=in.(${ids.join(",")})${esp ? `&especialidad_codigo=eq.${enc(esp)}` : ""}${filtroC}&order=instantanea_id.desc&limit=1000`);
    if (!rows.length) { out.innerHTML = '<p class="note">No ha habido adjudicaciones con esos filtros en lo que va de curso.</p>'; return; }
    const fch = new Map(INST.map(i => [i.id, i.fecha]));
    rows.forEach(r => r.f = fch.get(r.instantanea_id) || "");
    rows.sort((a, b) => b.f.localeCompare(a.f) || b.posicion - a.posicion);
    await cargarCentros(rows.map(r => r.centro_codigo));
    const por = new Map();
    rows.forEach(r => { let x = por.get(r.centro_codigo); if (!x) por.set(r.centro_codigo, x = { f: r.f, pos: [], tipos: new Set(), n: 0 }); x.n++; if (r.f === x.f) { x.pos.push(r.posicion); x.tipos.add(r.tipo); } });
    const lista = [...por].sort((a, b) => b[1].f.localeCompare(a[1].f));
    const tope = rows.reduce((m, r) => r.f > m.f || (r.f === m.f && r.posicion > m.p) ? { f: r.f, p: r.posicion } : m, { f: "", p: 0 });
    const maxTot = Math.max(...rows.map(r => r.posicion));
    out.innerHTML = `<div class="op-b" style="--c:var(--blu);--cb:var(--blu-bg)"><div class="k">📌 ${esp ? esc(espNom(cu, esp)) : "Resultado de tu búsqueda"}</div><div class="h">Última adjudicación: ${fmtF(rows[0].f)}</div><span class="n">${Math.max(...rows.filter(r => r.f === rows[0].f).map(r => r.posicion))}</span> posición más alta ese día · se ha llegado hasta la <strong>${maxTot}</strong> en lo que va de curso.</div>
      <div>${lista.slice(0, 60).map(([k, x]) => { const c = CEN[k] || {}; return `<div class="it"><div class="a"><b>${esc(c.nombre || k)}</b><small>${esc(c.localidad || "")} · última: ${fmtF(x.f)} · ${[...x.tipos].map(t => t === "vacante" ? "Vacante" : "Sustitución").join(" / ")} · ${x.n} ${x.n === 1 ? "adjudicación" : "adjudicaciones"} este curso</small></div><div class="z"><span class="pos-b">${Math.max(...x.pos)}</span><small>${x.pos.length > 1 ? "más alta (" + x.pos.length + " plazas)" : "posición"}</small></div></div>`; }).join("")}</div>
      <p class="note">${lista.length} centro${lista.length === 1 ? "" : "s"}${lista.length > 60 ? " (mostrando los 60 más recientes)" : ""}. Orientativo: la posición cambia en cada lista.</p>`;
  } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}
$("ul-grupo").addEventListener("change", ultimas);
$("ul-q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(ultimas, 300); });
$("ul-more").addEventListener("click", ultMas);
$("bs-cuerpo").addEventListener("change", () => { bsEsp(); bsBuscar(); });
$("bs-esp").addEventListener("change", bsBuscar);
$("bs-q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(bsBuscar, 450); });

/* ---------- Plazas ofertadas por la Conselleria ---------- */
let OFER = null;
async function cargarOfertas() {
  if (OFER) return OFER;
  try {
    const f = await getJ("plazas_ofertadas?select=fecha,version&order=fecha.desc&limit=1");
    if (!f.length) return (OFER = { fecha: null, rows: [] });
    const rows = await getJ(`plazas_ofertadas?select=cuerpo,especialidad_codigo,provincia,localidad,centro_codigo,centro,tipo,detalle,codigo_plaza,req_ling,observ,horas,iti&fecha=eq.${f[0].fecha}&order=especialidad_codigo.asc&limit=1000`);
    await cargarCentros(rows.map(r => r.centro_codigo));
    rows.forEach(r => { const c = CEN[r.centro_codigo]; if (c) { r.centro = c.nombre || r.centro; r.localidad = c.localidad || r.localidad; r.provincia = c.provincia || r.provincia; } });
    return (OFER = { fecha: f[0].fecha, version: f[0].version, rows });
  } catch (e) { return (OFER = { fecha: null, rows: [] }); }
}
const ultFechaContinua = () => INST.filter(i => i.tipo === "continua").map(i => i.fecha).sort().pop() || "";
const ofertaVigente = () => !!(OFER && OFER.fecha && OFER.fecha > ultFechaContinua());
const alcanceUlt = esp => { const g = famDe(esp) === "maestros" ? "maestros" : "otros", u = ULT[g]; if (!u || !u.ins) return null; const ps = u.rows.filter(r => r.especialidad_codigo === esp).map(r => r.posicion); return ps.length ? { f: u.ins.fecha, p: Math.max(...ps) } : { f: u.ins.fecha, p: null }; };
async function ofertasInit() {
  const o = await cargarOfertas();
  if (!o.fecha) { $("of-panel").hidden = true; $("of-hero").hidden = true; return; }
  $("of-panel").hidden = false;
  ofResumen(o);
  const vig = ofertaVigente();
  $("of-sum").textContent = (vig ? "Plazas que se ofertan en la próxima adjudicación" : "Plazas ofertadas") + " · " + fmtF(o.fecha);
  const cus = [...new Set(o.rows.map(r => r.cuerpo))];
  $("of-cuerpo").innerHTML = '<option value="">Todos los cuerpos</option>' + cus.map(c => `<option value="${esc(c)}">${esc(cuerpoNombre(c))}</option>`).join("");
  ofEsp(); ofPintar();
}
function ofResumen(o) {
  const R = o.rows, n = R.length, nm = R.filter(r => r.cuerpo === "maestros").length, nv = R.filter(r => r.tipo === "vacante").length;
  const cen = new Set(R.map(r => r.centro_codigo)).size, esp = new Set(R.map(r => r.especialidad_codigo)).size;
  const pv = {}; R.forEach(r => { const p = r.provincia || "—"; pv[p] = (pv[p] || 0) + 1; });
  const pvt = Object.entries(pv).sort((a, b) => b[1] - a[1]).map(([p, c]) => `${esc(p)}: <b>${c}</b>`).join(" · ");
  const t = (b, s) => `<div><b>${b}</b><small>${s}</small></div>`;
  $("of-hero").innerHTML = `<div class="k">${ofertaVigente() ? "Próxima adjudicación" : "Última oferta de plazas"} · ${fmtF(o.fecha)}</div><div class="h">${n} plaza${n === 1 ? "" : "s"} ofertada${n === 1 ? "" : "s"}</div><div class="g">${t(nm, "Maestros")}${t(n - nm, "Secundaria y otros")}${t(nv, "vacantes")}${t(n - nv, "sustituciones")}${t(cen, "centros")}${t(esp, "especialidades")}</div><p class="pv">Por provincia — ${pvt}</p>`;
  $("of-hero").hidden = false;
}
/* ---------- Plazas de difícil cobertura ---------- */
let DIF = null;
async function cargarDif() {
  if (DIF) return DIF;
  try {
    const f = await getJ("plazas_dificil?select=fecha&order=fecha.desc&limit=1");
    if (!f.length) return (DIF = { fecha: null, rows: [] });
    const rows = await getJ(`plazas_dificil?select=cuerpo,especialidad_codigo,provincia,localidad,centro_codigo,centro,tipo,detalle,codigo_plaza,req_ling,observ,horas,iti&fecha=eq.${f[0].fecha}&order=especialidad_codigo.asc&limit=1000`);
    await cargarCentros(rows.map(r => r.centro_codigo));
    rows.forEach(r => { const c = CEN[r.centro_codigo]; if (c) { r.centro = c.nombre || r.centro; r.localidad = c.localidad || r.localidad; r.provincia = c.provincia || r.provincia; } });
    const hmx = {}; rows.forEach(r => { if (r.horas != null) hmx[r.cuerpo] = Math.max(hmx[r.cuerpo] || 0, +r.horas); }); rows.forEach(r => { r.hmax = hmx[r.cuerpo]; });      // en difícil cobertura siempre figuran las horas: la jornada completa es la mayor de su cuerpo
    const adj = new Map(); let adjN = 0, adjB = 0;
    try { (await getJ(`v_dificil_adj?select=especialidad_codigo,codigo_plaza,peticion,en_bolsa&fecha=eq.${f[0].fecha}&limit=1000`)).forEach(a => { adj.set(a.especialidad_codigo + "|" + a.codigo_plaza, a); adjN++; if (a.en_bolsa) adjB++; }); } catch (e) {}
    return (DIF = { fecha: f[0].fecha, rows, adj, adjN, adjB });
  } catch (e) { return (DIF = { fecha: null, rows: [] }); }
}
const plazaTipo = r => r.tipo === "vacante" ? "Vacante" : /indeterm/i.test(r.detalle || "") ? "Sustitución indeterminada" : /determ/i.test(r.detalle || "") ? "Sustitución determinada" : "Sustitución";
const lingOk = (r, lg) => { if (!lg) return true; const l = (r.req_ling || "").trim(); return lg === "no" ? !l : lg === "ing" ? /^ING/i.test(l) : !!l && !/^ING/i.test(l); };
const plazaIng = r => { const l = (r.req_ling || "").replace(/\.$/, "").trim(); if (!l) return "No es en inglés"; const m = /^ING[-\s]?([ABC][12])/i.exec(l); return m ? "En inglés (" + m[1].toUpperCase() + ")" : "Req. " + l; };
const reducida = r => r.horas != null && (r.hmax != null ? +r.horas < r.hmax : true) && !r.iti;
const sitios = r => { const o = [], re = /(\d{8}):\s*(.+?)\s+(\d+(?:,\d+)?)\s*hores/g; let m; while ((m = re.exec(r.observ || ""))) o.push({ nom: m[2], h: m[3] }); return o; };
const obsTxt = r => {
  if (!r.observ) return "";
  const st = sitios(r);
  if (r.iti && st.length) return " · Centros: " + st.map(x => esc(x.nom) + " (" + x.h + " h)").join(" + ");
  return " · " + esc(r.observ);
};
/* Jornada del centro (completa/partida) y web: datos de centros_info.json. La jornada solo se muestra en plazas de Maestros. */
let JINFO = {};
fetch("centros_info.json").then(r => r.ok ? r.json() : {}).then(j => { JINFO = j || {}; }).catch(() => {});
const jornadaTag = r => {
  const j = JINFO[r.centro_codigo]; if (!j) return "";
  const mae = String(r.especialidad_codigo || "")[0] === "1";
  return (mae && j[0] ? `<span class="tag" title="Horario del centro: ${j[0] === "C" ? "jornada completa (continua)" : "jornada partida"}">${j[0] === "C" ? "🕘 Jornada completa" : "🕑 Jornada partida"}</span>` : "")
    + (/^https?:\/\//.test(j[1] || "") ? `<a class="tag" href="${esc(j[1])}" target="_blank" rel="noopener" title="Web del centro">🌐 Web del centro</a>` : "");
};
const fichaBtn = r => r.centro_codigo ? `<button type="button" class="tag" data-ficha="${esc(r.centro_codigo)}" style="border:0;cursor:pointer;background:var(--blu-bg);color:var(--blu)" title="Ver la ficha del centro">🏫 Ficha</button>` : "";
const plazaTags = r => `<span class="tag">${plazaTipo(r)}</span>${fichaBtn(r)}${jornadaTag(r)}${r.iti ? `<span class="tag itin">🚗 Itinerante${sitios(r).length > 1 ? " · " + sitios(r).length + " centros" : ""}</span>` : ""}${reducida(r) ? `<span class="tag red">⏱ Jornada reducida · ${fmtH(r.horas)} h</span>` : ""}${r.req_ling ? `<span class="tag ing">${esc(plazaIng(r))}</span>` : ""}`;
const reqOtra = r => r.req_ling && !/^ING/i.test(r.req_ling.trim()) ? " · req. " + esc(r.req_ling.replace(/\.$/, "")) : "";
const difItem = r => `<div class="it"><div class="a"><b>${esc(r.centro || r.centro_codigo)}</b><small>${esc(r.localidad || "")}${reqOtra(r)}${obsTxt(r)}${distBtn(r)}${favBtn(r)}${segBtn(r)}</small></div><div class="z tg">${DIF && DIF.adj && DIF.adj.has(r.especialidad_codigo + "|" + r.codigo_plaza) ? '<span class="tag" style="background:var(--ok-bg);color:var(--ok)">✔ Adjudicada</span> ' : ""}${plazaTags(r)}</div></div>`;
async function difInit() {
  const o = await cargarDif();
  if (!o.fecha) { $("dc-panel").hidden = true; return; }
  $("dc-panel").hidden = false; $("dc-sum").textContent = "Plazas de difícil cobertura · " + fmtF(o.fecha);
  const cus = [...new Set(o.rows.map(r => r.cuerpo))];
  $("dc-cuerpo").innerHTML = '<option value="">Todos los cuerpos</option>' + cus.map(c => `<option value="${esc(c)}">${esc(cuerpoNombre(c))}</option>`).join("");
  difEsp(); difPintar();
}
function difEsp() {
  const cu = $("dc-cuerpo").value, es = new Map();
  DIF.rows.filter(r => !cu || r.cuerpo === cu).forEach(r => es.set(r.especialidad_codigo, 1));
  $("dc-esp").innerHTML = '<option value="">Todas las especialidades</option>' + [...es.keys()].sort().map(c => `<option value="${esc(c)}">${esc(espNom("", c))}</option>`).join("");
}
function difPintar() {
  const cu = $("dc-cuerpo").value, es = $("dc-esp").value, pv = $("dc-prov").value, q = $("dc-q").value.trim().toLowerCase(); const lg = $("dc-ling").value;
  const fil = DIF.rows.filter(r => (!cu || r.cuerpo === cu) && (!es || r.especialidad_codigo === es) && (!pv || r.provincia === pv) && lingOk(r, lg) && (!q || ((r.centro || "") + " " + (r.localidad || "")).toLowerCase().includes(q)));
  const nv = fil.filter(r => r.tipo === "vacante").length;
  $("dc-info").innerHTML = `<strong>${fil.length}</strong> plaza${fil.length === 1 ? "" : "s"} (${nv} vacante${nv === 1 ? "" : "s"}, ${fil.length - nv} sustitucion${fil.length - nv === 1 ? "" : "es"}).`;
  if (DIF.adjN) $("dc-info").innerHTML += ` <span style="color:var(--ok)">✔ ${fil.filter(r => DIF.adj.has(r.especialidad_codigo + "|" + r.codigo_plaza)).length} ya adjudicada${fil.filter(r => DIF.adj.has(r.especialidad_codigo + "|" + r.codigo_plaza)).length === 1 ? "" : "s"}.</span>`;
  const gr = new Map(); fil.forEach(r => { if (!gr.has(r.especialidad_codigo)) gr.set(r.especialidad_codigo, []); gr.get(r.especialidad_codigo).push(r); });
  window.__dcFil = fil; mapaRefrescar("dc");
  $("dc-body").innerHTML = fil.length ? [...gr].map(([e, rs]) => `<div class="note" style="margin:.9rem 0 .2rem"><strong>${esc(espNom("", e))}</strong> — ${rs.length} plaza${rs.length === 1 ? "" : "s"}</div>` + rs.map(difItem).join("")).join("") : '<p class="note">No hay plazas con esos filtros.</p>';
}
$("dc-cuerpo").addEventListener("change", () => { difEsp(); difPintar(); });
["dc-esp", "dc-prov", "dc-ling"].forEach(id => $(id).addEventListener("change", difPintar));
$("dc-q").addEventListener("input", () => { clearTimeout(window.__dcT); window.__dcT = setTimeout(difPintar, 300); });
async function difMias(pan, espMia) {
  const o = await cargarDif();
  if (!o.fecha) { $("dc-mi").hidden = true; return; }
  const bol = new Set(pan.filter(r => r.cuerpo !== "maestros").map(r => r.cuerpo + "|" + r.bolsa));
  const mias = o.rows.filter(r => r.cuerpo === "maestros" ? (espMia || []).includes(r.especialidad_codigo) : bol.has(r.cuerpo + "|" + r.especialidad_codigo));
  $("dc-mi").hidden = false;
  $("dc-mi-adj").innerHTML = "";
  try {
    const r = (await sb.rpc("mi_dificil_adj")).data || [];
    if (r.length) $("dc-mi-adj").innerHTML = r.slice(0, 1).map(a => `<div class="op-b go" style="--c:var(--ok);--cb:var(--ok-bg);margin:0 0 .8rem" role="status"><div class="k">🎉 Difícil cobertura</div><div class="h">Obtuviste plaza el ${fmtF(a.fecha)}</div><span>${esc(a.centro || a.centro_codigo)} · ${esc(espNom("", a.especialidad_codigo))} · con tu petición nº ${a.peticion}. La adjudicación está a la espera de comprobar requisitos.</span></div>`).join("");
  } catch (e) {}
  if (!mias.length) { $("dc-mi-body").innerHTML = `<p class="note" style="margin:0">En la última publicación (${fmtF(o.fecha)}) no hay plazas de difícil cobertura en tus bolsas.</p>`; return; }
  const gr = new Map(); mias.forEach(r => { if (!gr.has(r.especialidad_codigo)) gr.set(r.especialidad_codigo, []); gr.get(r.especialidad_codigo).push(r); });
  $("dc-mi-body").innerHTML = `<p class="note" style="margin:0 0 .4rem">Publicadas el ${fmtF(o.fecha)}. Son plazas que nadie cogió en la adjudicación continua; también pueden pedirlas quienes no están en la bolsa.</p>`
    + [...gr].map(([e, rs]) => `<div class="note" style="margin:.8rem 0 .2rem"><strong>${esc(espNom("", e))}</strong> — ${rs.length} plaza${rs.length === 1 ? "" : "s"}</div>` + rs.map(difItem).join("")).join("");
}
function ofEsp() {
  const cu = $("of-cuerpo").value, es = new Map();
  OFER.rows.filter(r => !cu || r.cuerpo === cu).forEach(r => es.set(r.especialidad_codigo, 1));
  $("of-esp").innerHTML = '<option value="">Todas las especialidades</option>' + [...es.keys()].sort().map(c => `<option value="${esc(c)}">${esc(espNom("", c))}</option>`).join("");
}
function ofPintar() {
  const cu = $("of-cuerpo").value, es = $("of-esp").value, pv = $("of-prov").value, q = $("of-q").value.trim().toLowerCase(); const lg = $("of-ling").value;
  const fil = OFER.rows.filter(r => (!cu || r.cuerpo === cu) && (!es || r.especialidad_codigo === es) && (!pv || r.provincia === pv) && lingOk(r, lg) && (!q || ((r.centro || "") + " " + (r.localidad || "")).toLowerCase().includes(q)));
  const nv = fil.filter(r => r.tipo === "vacante").length;
  $("of-info").innerHTML = `<strong>${fil.length}</strong> plaza${fil.length === 1 ? "" : "s"} (${nv} vacante${nv === 1 ? "" : "s"}, ${fil.length - nv} sustitucion${fil.length - nv === 1 ? "" : "es"}). ${ofertaVigente() ? "Se adjudican el " + fmtF(OFER.fecha) + "." : "Adjudicación del " + fmtF(OFER.fecha) + "."}${OFER.version === "prov" ? " Lista provisional." : ""}`;
  const gr = new Map(); fil.forEach(r => { if (!gr.has(r.especialidad_codigo)) gr.set(r.especialidad_codigo, []); gr.get(r.especialidad_codigo).push(r); });
  window.__ofFil = fil; mapaRefrescar("of");
  $("of-body").innerHTML = fil.length ? [...gr].map(([e, rs]) => {
    const a = alcanceUlt(e), ctx = a ? (a.p ? ` · en la última tanda (${fmtF(a.f)}) se llegó hasta la posición <strong>${a.p}</strong>` : ` · sin adjudicaciones en la última tanda (${fmtF(a.f)})`) : "";
    return `<div class="note" style="margin:.9rem 0 .2rem"><strong>${esc(espNom("", e))}</strong> — ${rs.length} plaza${rs.length === 1 ? "" : "s"}${ctx}</div>` + rs.map(r => `<div class="it"><div class="a"><b>${esc(r.centro || r.centro_codigo)}</b><small>${esc(r.localidad || "")}${reqOtra(r)}${obsTxt(r)}${distBtn(r)}${favBtn(r)}</small></div><div class="z tg">${plazaTags(r)}</div></div>`).join("");
  }).join("") : '<p class="note">No hay plazas con esos filtros.</p>';
}
$("of-cuerpo").addEventListener("change", () => { ofEsp(); ofPintar(); });
["of-esp", "of-prov", "of-ling"].forEach(id => $(id).addEventListener("change", ofPintar));
$("of-q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(ofPintar, 300); });

/* ---------- Mi apartado: última adjudicación ordenada por distancia al domicilio ---------- */
let UA_N = 100;
async function uaCard(ac) {
  const pan = $("ua-panel"); if (!pan) return;
  if (!ac || !ac.activo) { pan.hidden = true; return; }
  const o = await cargarOfertas(); if (!o.fecha) { pan.hidden = true; return; }
  pan.hidden = false; $("ua-sum").textContent = "Última adjudicación · " + fmtF(o.fecha);
  const cus = [...new Set(o.rows.map(r => r.cuerpo))], cv = $("ua-cuerpo").value;
  $("ua-cuerpo").innerHTML = '<option value="">Todos los cuerpos</option>' + cus.map(c => `<option value="${esc(c)}">${esc(cuerpoNombre(c))}</option>`).join(""); $("ua-cuerpo").value = cv;
  uaEsp(); uaPintar();
}
function uaEsp() {
  const cu = $("ua-cuerpo").value, ev = $("ua-esp").value, es = new Map();
  OFER.rows.filter(r => !cu || r.cuerpo === cu).forEach(r => es.set(r.especialidad_codigo, 1));
  $("ua-esp").innerHTML = '<option value="">Todas las especialidades</option>' + [...es.keys()].sort().map(c => `<option value="${esc(c)}">${esc(espNom("", c))}</option>`).join(""); $("ua-esp").value = es.has(ev) ? ev : "";
}
function uaPintar() {
  if (!OFER || !OFER.fecha) return;
  const cu = $("ua-cuerpo").value, es = $("ua-esp").value, pv = $("ua-prov").value, q = $("ua-q").value.trim().toLowerCase(); const lg = $("ua-ling").value;
  const fil = OFER.rows.filter(r => (!cu || r.cuerpo === cu) && (!es || r.especialidad_codigo === es) && (!pv || r.provincia === pv) && lingOk(r, lg) && (!q || ((r.centro || "") + " " + (r.localidad || "")).toLowerCase().includes(q)));
  const km = r => { const d = distInfo(r.centro_codigo); return d ? d.km : 1e9; };
  fil.sort((a, b) => (DOM ? km(a) - km(b) : 0) || (a.localidad || "").localeCompare(b.localidad || "") || (a.centro || "").localeCompare(b.centro || ""));
  window.__uaFil = fil; mapaRefrescar("ua");
  $("ua-dom").innerHTML = DOM ? "Ordenadas de la más cercana a la más lejana desde tu domicilio (distancia aproximada por carretera)." : 'Para ordenarlas por distancia, <button type="button" class="link" id="ua-adddom">añade tu domicilio</button>. Mientras tanto se ordenan por localidad.';
  if ($("ua-adddom")) $("ua-adddom").onclick = () => cfgAbrir("ajustes");
  const nv = fil.filter(r => r.tipo === "vacante").length, cen = new Set(fil.map(r => r.centro_codigo)).size;
  $("ua-info").innerHTML = `<strong>${fil.length}</strong> plaza${fil.length === 1 ? "" : "s"} en ${cen} centro${cen === 1 ? "" : "s"} (${nv} vacante${nv === 1 ? "" : "s"}, ${fil.length - nv} sustitucion${fil.length - nv === 1 ? "" : "es"}).`;
  const it = r => { const d = distInfo(r.centro_codigo); return `<div class="it"><div class="a"><b>${esc(r.centro || r.centro_codigo)}</b><small>${esc(r.localidad || "")} · ${esc(espNom("", r.especialidad_codigo))}${reqOtra(r)}${obsTxt(r)}${d ? `<br><span class="dist">📍 ${d.txt}</span> <a href="${mapsUrl(r.centro_codigo)}" target="_blank" rel="noopener" style="font-size:.85rem;white-space:nowrap">🗺️ Ruta</a>` : ""}<br>${favBtn(r)}</small></div><div class="z tg">${plazaTags(r)}</div></div>`; };
  $("ua-body").innerHTML = fil.length ? fil.slice(0, UA_N).map(it).join("") + (fil.length > UA_N ? `<p style="text-align:center"><button type="button" class="btn" id="ua-mas">Ver más (${fil.length - UA_N} restantes)</button></p>` : "") : '<p class="note">No hay plazas con esos filtros.</p>';
  if ($("ua-mas")) $("ua-mas").onclick = () => { UA_N += 100; uaPintar(); };
}
$("ua-cuerpo").addEventListener("change", () => { UA_N = 100; uaEsp(); uaPintar(); });
["ua-esp", "ua-prov", "ua-ling"].forEach(id => $(id).addEventListener("change", () => { UA_N = 100; uaPintar(); }));
$("ua-q").addEventListener("input", () => { clearTimeout(window.__uaT); window.__uaT = setTimeout(() => { UA_N = 100; uaPintar(); }, 300); });
/* ---------- CUENTAS (Supabase Auth) ---------- */
function initAuth() {
  if (!window.supabase) return;
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const mb = /^#baja=([0-9a-f-]{36})$/i.exec(location.hash);
  if (mb) sb.rpc("baja_avisos", { p_token: mb[1] }).then(({ data, error }) => {
    const d = document.createElement("div"); d.className = "panel"; d.setAttribute("role", "status"); d.style.cssText = "margin:.8rem auto;max-width:60rem";
    d.textContent = error || !data ? "No hemos podido dar de baja los avisos con este enlace. Puedes desactivarlos en Mi apartado." : "Listo: ya no recibirás avisos por email. Puedes volver a activarlos en Mi apartado.";
    document.body.prepend(d); history.replaceState(null, "", location.pathname + location.search);
  });
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_IN" || ev === "INITIAL_SESSION") setTimeout(() => favCargar().then(favRepintar), 0); if (ev === "SIGNED_OUT") { FAV = new Set(); SEG = new Set(); favRepintar(); } });
  sb.auth.onAuthStateChange(ev => { if (ev === "PASSWORD_RECOVERY") { RECOVERY = true; if (READY) { show("auth"); authMode("nueva"); } } });
}
const AU = { login: ["Entrar", "Entrar", "Crear cuenta", "registro"], registro: ["Crear cuenta", "Crear cuenta", "Ya tengo cuenta", "login"], olvido: ["Recuperar contraseña", "Enviar enlace", "Volver", "login"], nueva: ["Nueva contraseña", "Guardar contraseña", "", "login"] };
function authAviso(t) { const g = $("au-gate"); g.textContent = t; g.hidden = false; }
function authMode(m) {
  AUTH_MODE = m; const a = AU[m];
  $("au-title").textContent = a[0]; $("au-go").textContent = a[1];
  $("au-alt").textContent = a[2]; $("au-alt").hidden = !a[2]; $("au-alt").dataset.m = a[3];
  $("au-l-mail").hidden = m === "nueva"; $("au-l-ok").hidden = m !== "registro"; $("au-l-pass").hidden = m === "olvido";
  $("au-forgot").hidden = m !== "login"; $("au-msg").textContent = ""; $("au-gate").hidden = true;
  $("au-pass").autocomplete = m === "login" ? "current-password" : "new-password";
}
const errEs = e => /invalid login/i.test(e.message) ? "Correo o contraseña incorrectos." : /not confirmed/i.test(e.message) ? "Aún no has confirmado tu correo. Revisa tu bandeja de entrada." : /rate limit|too many/i.test(e.message) ? "Demasiados intentos. Espera unos minutos." : e.message;
$("au-alt").onclick = () => authMode($("au-alt").dataset.m);
$("au-forgot").onclick = () => authMode("olvido");
$("au-go").onclick = async () => {
  const mail = $("au-mail").value.trim(), pass = $("au-pass").value, msg = s => { $("au-msg").textContent = s; };
  if (!sb) return msg("No se pudo cargar el sistema de cuentas. Revisa tu conexión y recarga la página.");
  const back = location.origin + location.pathname;
  if (AUTH_MODE !== "nueva" && !/^\S+@\S+\.\S+$/.test(mail)) return msg("Escribe un correo válido.");
  if (AUTH_MODE !== "olvido" && pass.length < 8) return msg("La contraseña debe tener al menos 8 caracteres.");
  if (AUTH_MODE === "registro" && !$("au-ok").checked) return msg("Para crear la cuenta debes aceptar la política de privacidad y las condiciones.");
  msg("Un momento…");
  try {
    if (AUTH_MODE === "login") { const { error } = await sb.auth.signInWithPassword({ email: mail, password: pass }); if (error) throw error; show("apartado"); }
    else if (AUTH_MODE === "registro") { const { data, error } = await sb.auth.signUp({ email: mail, password: pass, options: { emailRedirectTo: back, data: { acepta_privacidad: new Date().toISOString(), version_privacidad: "2026-11" } } }); if (error) throw error; if (data.session) show("apartado"); else msg("Te hemos enviado un correo. Pulsa el enlace para confirmar tu cuenta y después entra."); }
    else if (AUTH_MODE === "olvido") { const { error } = await sb.auth.resetPasswordForEmail(mail, { redirectTo: back }); if (error) throw error; msg("Si el correo existe, recibirás un enlace para crear una nueva contraseña."); }
    else { const { error } = await sb.auth.updateUser({ password: pass }); if (error) throw error; RECOVERY = false; show("apartado"); }
  } catch (e) { msg("No se pudo completar: " + errEs(e)); }
};
$("del-ok").onclick = async () => {
  const msg = t => { $("del-msg").textContent = t; };
  if ($("del-txt").value.trim().toUpperCase() !== "ELIMINAR") return msg("Escribe ELIMINAR para confirmar.");
  msg("Eliminando…");
  const { data, error } = await sb.rpc("eliminar_mi_cuenta");
  if (error) return msg("No se pudo eliminar: " + error.message);
  if (data === "es_admin") return msg("Esta cuenta es de administrador y no se puede eliminar desde aquí.");
  if (data !== "ok") return msg("No se pudo eliminar la cuenta.");
  try { await sb.auth.signOut(); } catch (e) {}
  USER = null; DOM = null; ADMIN = false; $("del-txt").value = ""; show("home");
  alert("Tu cuenta se ha eliminado correctamente.");
};
$("logout").onclick = async () => { if (sb) await sb.auth.signOut(); USER = null; DOM = null; show("home"); };

/* ---------- MI APARTADO ---------- */
// ---- Acceso: prueba gratuita y pago (el cierre real lo hace la base de datos)
let SIM = null;   // solo administradores: simula "prueba" o "fin" para ver cómo queda
async function accesoInfo() {
  if (ADMIN && SIM === "fin") return { cobro_activo: true, activo: false, precio: "4.99", fin_curso: "2027-06-30" };
  if (ADMIN && SIM === "prueba") return { cobro_activo: true, activo: true, en_prueba: true, dias_restantes: 5, precio: "4.99", fin_curso: "2027-06-30" };
  try { const { data, error } = await sb.rpc("mi_acceso"); if (!error && data) return data; } catch (e) {}
  return { cobro_activo: false, activo: true };
}
async function valorPrueba() {
  const box = $("acc-valor"); if (!box || !sb) return;
  try {
    const { data: v, error } = await sb.rpc("mi_valor_prueba"); if (error || !v) return;
    const p = [];
    if (v.plazas) p.push(`<strong>${v.plazas}</strong> plaza${v.plazas === 1 ? "" : "s"} ofertada${v.plazas === 1 ? "" : "s"} en tus bolsas`);
    if (v.cerca) p.push(`<strong>${v.cerca}</strong> de ellas a menos de ${v.km} km de casa`);
    if (v.listas) p.push(`<strong>${v.listas}</strong> lista${v.listas === 1 ? "" : "s"} de adjudicación analizada${v.listas === 1 ? "" : "s"} para ti`);
    if (!p.length) return;
    box.innerHTML = `<p style="margin:.6rem 1rem;padding:.6rem .8rem;border-radius:.6rem;background:var(--paper)">📈 <strong>Desde el ${fmtF(v.desde)}</strong>, DocentsCV ha seguido por ti: ${p.join(" · ")}.</p>`;
  } catch (e) {}
}
function pintarAcceso(ac) {
  const box = $("acc-box"), pr = String(ac.precio || "4.99").replace(".", ","), fin = ac.fin_curso ? fmtF(ac.fin_curso) : "";
  if (ac.gratis_referidos) { box.innerHTML = `<div class="sc" style="--c:var(--ok);--cb:var(--ok-bg);margin-top:1rem"><div class="sc-st"><i>🎉</i><div>Tienes la app gratis este curso<small>Gracias por invitar a 3 personas${fin ? ". Acceso hasta el " + fin : ""}.</small></div></div></div>`; return; }
  if (!ac.cobro_activo || (ac.activo && !ac.en_prueba)) { box.innerHTML = ""; return; }
  if (ac.activo) {
    const n = ac.dias_restantes;
    box.innerHTML = `<div class="sc" style="--c:var(--amb);--cb:var(--amb-bg);margin-top:1rem"><div class="sc-st"><i>🎁</i><div>Prueba gratuita: te ${n === 1 ? "queda 1 día" : "quedan " + n + " días"}<small>Después, ${pr} € por todo el curso${fin ? " (hasta el " + fin + ")" : ""}. Pago único, sin renovación automática.</small></div></div><div class="sc-b"><button class="btn" id="pagar" style="padding:.5rem 1rem">¿No quieres esperar? Paga ya los ${pr} €</button><p class="note" id="pagar-msg" role="status" style="margin:.4rem 0 0"></p>${pr === "4,99" ? `<p class="note" style="margin:.3rem 0 0;font-size:.8rem">El precio de 4,99 € es especial por incorporarte este curso. El curso 2027-28 será de 7,49 €.</p>` : ""}</div><div id="acc-valor"></div></div>`;
    $("pagar").onclick = () => pagar();
    restaurarCompra(true); valorPrueba(); return;
  }
  box.innerHTML = `<div class="sc" style="--c:var(--blu);--cb:var(--blu-bg);margin-top:1rem"><div class="sc-h"><b>Tu prueba gratuita ha terminado</b><span>Sigue viendo tu situación en las bolsas</span></div>
    <div class="sc-b"><div id="acc-valor"></div><ul class="l" style="margin:.4rem 0"><li>Tu puesto y cómo evoluciona en cada bolsa</li><li>Probabilidad de conseguir plaza</li><li>Oportunidades por centro y últimas adjudicaciones</li><li>Hasta dónde se llegó otros años</li></ul>
    <div class="sc-p" style="--pc:var(--blu);--pb:var(--blu-bg)"><div class="t">Todo el curso</div><div class="v">${pr} €</div><div class="d">${pr === "4,99" ? "Precio especial por incorporarte a mitad de curso. " : ""}Pago único${fin ? ", con acceso hasta el " + fin : ""}. Sin renovación automática.</div></div>
    <p style="margin:1rem 0 .3rem"><button class="btn" id="pagar" style="font-size:1.1rem;padding:.7rem 1.4rem">Pagar ${pr} €</button></p>
    <p class="note" id="pagar-msg" role="status"></p>${pr === "4,99" ? `<p class="note" style="margin:.3rem 0 0;font-size:.8rem">El precio de 4,99 € es especial por incorporarte este curso. El curso 2027-28 será de 7,49 €.</p>` : ""}</div></div>`;
  $("pagar").onclick = () => pagar();
  restaurarCompra(true); valorPrueba();
}

/* ---------- Pago: Google Play dentro de la app Android, o tarjeta (Stripe) desde la web ---------- */
const PLAY_PRODUCTO = "curso_2026_27", PLAY_URL = "https://play.google.com/store/apps/details?id=io.github.docentscv.app";
async function servicioPlay() {
  if (!("getDigitalGoodsService" in window)) return null;
  try { return await window.getDigitalGoodsService("https://play.google.com/billing"); } catch (e) { return null; }
}
async function verificarCompra(token) {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return { ok: false, error: "no_autenticado" };
  const r = await fetch(SUPABASE_URL + "/functions/v1/verificar_compra", { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }, body: JSON.stringify({ token, productId: PLAY_PRODUCTO }) });
  return await r.json().catch(() => ({ ok: false, error: "error_interno" }));
}
const PAGO_ERR = { pendiente: "Tu pago está pendiente de confirmación. Cuando Google lo confirme se activará el acceso.", anulada: "Google indica que esa compra está anulada o reembolsada.", recibo_de_otra_cuenta: "Esa compra pertenece a otra cuenta de DocentsCV.", recibo_no_valido: "Google no ha reconocido la compra. Si te han cobrado, escríbenos y lo resolvemos." };
/* Decide con cuál de los dos pagar: Google Play si estamos dentro de la app Android, si no, tarjeta (Stripe) */
async function pagar() { const srv = await servicioPlay(); if (srv) return pagarPlay(false, srv); return pagarStripe(); }
async function pagarPlay(auto, srvCache) {
  const msg = $("pagar-msg"), btn = $("pagar"); if (!msg) return;
  const srv = srvCache || await servicioPlay();
  if (!srv) return pagarStripe();
  btn.disabled = true; msg.textContent = "Abriendo Google Play…";
  try {
    const det = await srv.getDetails([PLAY_PRODUCTO]);
    if (!det || !det.length) { msg.textContent = "El producto todavía no está disponible en Google Play. Inténtalo más tarde."; btn.disabled = false; return; }
    const p = det[0], req = new PaymentRequest([{ supportedMethods: "https://play.google.com/billing", data: { sku: PLAY_PRODUCTO } }], { total: { label: "DocentsCV · curso completo", amount: { currency: p.price.currency, value: p.price.value } } });
    const r = await req.show(); msg.textContent = "Comprobando el pago…";
    const v = await verificarCompra(r.details.purchaseToken);
    await r.complete(v.ok ? "success" : "fail");
    if (v.ok) { msg.textContent = "¡Pago correcto! Ya tienes acceso."; setTimeout(() => renderApartado(), 800); }
    else { msg.textContent = PAGO_ERR[v.error] || "No hemos podido confirmar el pago. Inténtalo de nuevo o escríbenos."; btn.disabled = false; }
  } catch (e) {
    msg.textContent = (e && e.name === "AbortError") ? "Pago cancelado." : "No se pudo completar el pago. Inténtalo de nuevo."; btn.disabled = false;
  }
}
/* Si ya pagó (otro móvil, reinstalación…) se recupera solo, sin pagar otra vez */
async function restaurarCompra(silencioso) {
  const srv = await servicioPlay(); if (!srv) return;
  try {
    const lista = await srv.listPurchases();
    for (const c of lista || []) { if (c.itemId === PLAY_PRODUCTO) { const v = await verificarCompra(c.purchaseToken); if (v.ok) { renderApartado(); return; } } }
  } catch (e) {}
}
/* Pago con tarjeta desde la web (iPhone, navegador sin la app, etc.): abre Stripe Checkout */
async function pagarStripe() {
  const msg = $("pagar-msg"), btn = $("pagar"); if (!msg) return;
  btn.disabled = true; msg.textContent = "Abriendo el pago seguro…";
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { msg.textContent = "Vuelve a iniciar sesión e inténtalo de nuevo."; btn.disabled = false; return; }
    const r = await fetch(SUPABASE_URL + "/functions/v1/crear_pago_stripe", { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }, body: "{}" });
    const j = await r.json().catch(() => ({ ok: false }));
    if (!j.ok || !j.url) { msg.textContent = j.error === "stripe_no_configurado" ? "El pago con tarjeta todavía no está activado. Prueba más tarde." : "No se pudo abrir el pago. Inténtalo de nuevo."; btn.disabled = false; return; }
    location.href = j.url;
  } catch (e) { msg.textContent = "No se pudo abrir el pago. Inténtalo de nuevo."; btn.disabled = false; }
}
/* Al volver de Stripe (pago hecho o cancelado) */
async function comprobarPagoURL() {
  let pago = ""; try { pago = new URLSearchParams(location.search).get("pago") || ""; } catch (e) {}
  if (!pago) return;
  history.replaceState(null, "", location.pathname);
  show("apartado");
  if (pago === "cancelado") { setTimeout(() => { const m = $("pagar-msg"); if (m) m.textContent = "Pago cancelado."; }, 400); return; }
  if (pago !== "ok") return;
  let intentos = 0;
  const comprobar = async () => {
    const ac = await accesoInfo();
    if (!ac.cobro_activo || (ac.activo && !ac.en_prueba)) {
      const box = $("acc-box");   // puede que el botón de pago ya no exista (el pago se confirmó muy rápido): el aviso va directo en la caja
      if (box) box.innerHTML = `<div class="sc" style="--c:var(--ok);--cb:var(--ok-bg);margin-top:1rem"><div class="sc-st"><i>✅</i><div>¡Pago correcto!<small>Ya tienes acceso a todo el curso.</small></div></div></div>`;
      setTimeout(() => renderApartado(), 2500);
      return;
    }
    const m = $("pagar-msg");
    intentos++;
    if (m) m.textContent = "Confirmando tu pago…";
    if (intentos < 10) setTimeout(comprobar, 1500);
    else if (m) m.textContent = "Tu pago se está procesando. Si tarda más de un minuto, actualiza la página.";
  };
  setTimeout(comprobar, 600);
}

function domInit() {
  const pint = () => { $("dom-txt").textContent = DOM ? `Tienes guardada tu ubicación (${DOM.cp || ""} ${DOM.localidad || ""}). Si te mudas, escribe la nueva dirección y pulsa Guardar.` : "Todavía no has indicado tu domicilio: sin él no podemos calcular distancias."; $("dom-del").hidden = !DOM; };
  pint();
  const KM_ERR = { sin_domicilio: "Guarda primero tu domicilio.", sin_acceso: "Necesitas tener el acceso activo.", valor: "Valor no válido.", no_autenticado: "Vuelve a iniciar sesión." };
  const kmPint = async () => {
    const sel = $("km-sel"); sel.disabled = !DOM; sel.value = String((DOM && DOM.aviso_km) || 0); if (sel.value === "") sel.value = "0";
    const base = !DOM ? "Guarda primero tu domicilio para poder activarlo." : (DOM.aviso_km ? `Activado: te avisamos de las plazas a menos de ${DOM.aviso_km} km.` : "Ahora mismo no te avisamos por distancia.");
    $("km-msg").textContent = base;
    if (!DOM || !DOM.aviso_km) return;
    let push = true;   // si no se puede comprobar en 1,5 s, no se muestra la advertencia
    try { push = await Promise.race([navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(x => !!x), new Promise(r => setTimeout(() => r(true), 1500))]); } catch (e) {}
    if (!push && DOM && DOM.aviso_km) $("km-msg").textContent = base + " Ojo: en este dispositivo no tienes activadas las notificaciones; actívalas en este mismo apartado para recibir el aviso.";
  };
  kmPint();
  $("km-sel").onchange = async () => {
    const km = +$("km-sel").value;
    const { data, error } = await sb.rpc("guardar_aviso_km", { p_km: km });
    if (error || data !== "ok") { $("km-msg").textContent = error ? "No se pudo guardar (¿has ejecutado alertas_distancia.sql en Supabase?)." : (KM_ERR[data] || "No se pudo guardar."); $("km-sel").value = String((DOM && DOM.aviso_km) || 0); return; }
    DOM.aviso_km = km || null; kmPint();
  };
  $("dom-ok").onclick = async () => {
    $("dom-msg").textContent = "Buscando tu dirección…";
    const r = await guardarDom($("dom-calle").value, $("dom-cp").value, $("dom-loc").value);
    $("dom-msg").textContent = r.msg; if (r.ok) { $("dom-calle").value = ""; pint(); kmPint(); situacion(); distCard(ACC); }
  };
  $("dom-del").onclick = async () => { await sb.rpc("borrar_domicilio"); DOM = null; $("dom-msg").textContent = "Domicilio borrado."; pint(); kmPint(); situacion(); };
}
const REF_ERR = { no_existe: "Ese código no existe. Revísalo.", propio: "No puedes usar tu propio código.", ya_usado: "Ya has usado un código de invitación.", circular: "Esa persona se registró con tu código, así que no puede contar.", caducado: "El código solo se puede usar durante los primeros 30 días de tu cuenta." };
const REFWEB = "https://docentscv.github.io/";
function refLinks(cod) {
  const txt = `Estoy usando DocentsCV para seguir las adjudicaciones de interinos de la Comunitat Valenciana. Entra en ${REFWEB}, crea tu cuenta y pon mi código de invitación: ${cod}`;
  return { txt, wa: "https://wa.me/?text=" + encodeURIComponent(txt), tg: "https://t.me/share/url?url=" + encodeURIComponent(REFWEB) + "&text=" + encodeURIComponent(txt.replace(REFWEB, "").replace(/\s+/g, " ").trim()) };
}
/* Tarjeta destacada en Mi apartado (junto al nombre y a los días de prueba) */
async function distCard(ac) {
  const box = $("dist-card"); if (!box) return; box.innerHTML = "";
  const cod = LAST_DIST; if (!cod || !ac) return;
  try { await cargarCentros([cod]); } catch (e) {}
  const c = CEN[cod] || {}, nom = esc((c.localidad ? c.localidad + " · " : "") + (c.nombre || cod)), d = ac.activo ? distInfo(cod) : null;
  let tit, sub, cuerpo = "";
  if (!ac.activo) { tit = "Para ver la distancia necesitas acceso"; sub = nom; cuerpo = '<p style="margin:.2rem 0 0">Tu prueba ha terminado. Más abajo puedes <b>pagar</b> o <b>conseguir la app gratis invitando a tus compañeros</b>.</p>'; }
  else if (!DOM) { tit = "Añade tu domicilio para ver la distancia"; sub = nom; cuerpo = '<p style="margin:.2rem 0 .5rem">Así calculamos los kilómetros y el tiempo hasta este centro. Guardamos solo una ubicación aproximada.</p><button class="btn" id="dc-dom">Añadir mi domicilio</button>'; }
  else if (d) { tit = d.txt; sub = nom + " · desde tu domicilio"; }
  else { tit = "Sin datos de ubicación de este centro"; sub = nom; }
  box.innerHTML = `<div class="sc" style="--c:var(--blu);--cb:var(--blu-bg);margin-top:1rem"><div class="sc-st"><i>📍</i><div>${esc(tit)}<small>${sub}</small></div></div><div class="sc-b">${cuerpo}<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.3rem;margin-top:.5rem"><button class="btn" id="dc-back" style="white-space:nowrap;padding:.4rem .6rem;font-size:.9rem">← Consulta</button>${d ? `<a href="${mapsUrl(cod)}" target="_blank" rel="noopener" class="btn" style="text-decoration:none;white-space:nowrap;padding:.4rem .6rem;font-size:.9rem">🗺️ Ruta en Maps</a>` : ""}<button class="link" id="dc-x" title="Cerrar" aria-label="Cerrar" style="white-space:nowrap;font-size:1.2rem;padding:.2rem .3rem">✕</button></div></div></div>`;
  $("dc-back").onclick = () => { show("consulta"); setTimeout(() => window.scrollTo(0, CONS_Y), 250); };
  $("dc-x").onclick = () => { LAST_DIST = null; box.innerHTML = ""; };
  if ($("dc-dom")) $("dc-dom").onclick = () => cfgAbrir("ajustes");
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function refTop(ac) {
  const boxTop = $("ref-top"); if (boxTop) boxTop.innerHTML = "";
  const slot = $("rt-slot"); if (slot) slot.innerHTML = "";
  let data; try { data = (await sb.rpc("mi_referidos")).data; } catch (e) {} if (!data || data.gratis) return;
  const l = refLinks(data.codigo);
  const pagado = ac && ac.cobro_activo && ac.activo && !ac.en_prueba;   // ya pagado del todo: no tiene sentido ofrecer "consíguela gratis"
  if (pagado) {
    const box = slot || boxTop; if (!box) return;
    box.innerHTML = `<p class="note" style="margin:0;text-align:right"><button class="link" id="rt-compartir">📣 Recomienda DocentsCV a tus compañeros</button></p>`;
    $("rt-compartir").onclick = async () => {
      if (navigator.share) { try { await navigator.share({ title: "DocentsCV", text: l.txt, url: REFWEB }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
      box.innerHTML = `<div class="note" style="margin:0;text-align:right"><div class="filters" style="justify-content:flex-end"><a class="btn" href="${l.wa}" target="_blank" rel="noopener" style="text-decoration:none;background:#1f9d55">WhatsApp</a><a class="btn" href="${l.tg}" target="_blank" rel="noopener" style="text-decoration:none;background:#2a8fd4">Telegram</a></div></div>`;
    };
    return;
  }
  if (!boxTop) return;
  const n = ac && ac.cobro_activo && ac.en_prueba ? ac.dias_restantes : null;
  boxTop.innerHTML = `<div class="sc" style="--c:var(--ok);--cb:var(--ok-bg);margin-top:1rem"><div class="sc-st"><i>🎁</i><div>${n != null ? "Te " + (n === 1 ? "queda 1 día" : "quedan " + n + " días") + " de prueba: ¡invita a tus compañeros!" : (ac && ac.cobro_activo && !ac.activo) ? "Tu prueba ha terminado, pero aún puedes conseguir la app gratis" : "Invita a tus compañeros y consigue la app gratis"}<small>Si 3 personas se registran con tu código y pagan, tu curso es gratis. Llevas <b>${data.pagados} de ${data.necesarios}</b>.</small></div></div>
    <div class="sc-b"><div class="filters"><a class="btn" href="${l.wa}" target="_blank" rel="noopener" style="text-decoration:none;background:#1f9d55">WhatsApp</a><a class="btn" href="${l.tg}" target="_blank" rel="noopener" style="text-decoration:none;background:#2a8fd4">Telegram</a><button class="link" id="rt-mas">Ver mi código</button></div></div></div>`;
  $("rt-mas").onclick = () => cfgAbrir("ajustes");
}
$("ref-cons-go").onclick = async () => {
  if (!sb) return; const { data: { session } } = await sb.auth.getSession();
  if (!session) { show("auth"); authMode("registro"); authAviso("Crea tu cuenta gratis: tendrás " + DIAS_PRUEBA + " días de prueba y tu código para invitar."); return; }
  show("apartado"); setTimeout(() => cfgAbrir("ajustes"), 1200);
};
async function refInit() {
  const body = $("ref-body"); if (!body) return;
  const { data, error } = await sb.rpc("mi_referidos");
  if (error || !data) { body.textContent = "No disponible en este momento."; return; }
  const { txt } = refLinks(data.codigo);
  body.innerHTML = `<div style="font:800 1.4rem var(--display);letter-spacing:.04em;margin:.2rem 0">${esc(data.codigo)}</div>
    <p style="margin:.2rem 0 .5rem">Invitados: <b>${data.invitados}</b> · han pagado: <b>${data.pagados} de ${data.necesarios}</b>${data.gratis ? " · 🎉 ¡Conseguido! Tienes la app gratis este curso." : ""}</p>
    <div class="filters"><a class="btn" id="ref-wa" target="_blank" rel="noopener" style="text-decoration:none;background:#1f9d55">WhatsApp</a><a class="btn" id="ref-tg" target="_blank" rel="noopener" style="text-decoration:none;background:#2a8fd4">Telegram</a><button class="btn" id="ref-share" hidden>Otras apps…</button><button class="link" id="ref-copy">Copiar mensaje</button></div>
    ${data.usado ? "" : '<div class="filters" style="margin-top:.6rem"><label>¿Te invitó alguien? Su código <input id="ref-in" type="text" placeholder="DCV-XXXXX" maxlength="12" style="text-transform:uppercase;width:9rem"></label><button class="btn" id="ref-use">Usar código</button></div>'}`;
  const lk = refLinks(data.codigo); $("ref-wa").href = lk.wa; $("ref-tg").href = lk.tg;
  if (navigator.share) { $("ref-share").hidden = false; $("ref-share").onclick = async () => { try { await navigator.share({ text: txt }); } catch (e) {} }; }
  $("ref-copy").onclick = async () => { try { await navigator.clipboard.writeText(txt); $("ref-msg").textContent = "Mensaje copiado: pégalo donde quieras."; } catch (e) { $("ref-msg").textContent = txt; } };
  if ($("ref-use")) $("ref-use").onclick = async () => {
    const { data: r } = await sb.rpc("usar_codigo", { p_codigo: $("ref-in").value });
    $("ref-msg").textContent = r === "ok" ? "¡Código aplicado! Gracias." : (REF_ERR[r] || "No se pudo aplicar el código."); if (r === "ok") refInit();
  };
}
async function renderApartado() {
  if (!sb) { show("auth"); authMode("login"); $("au-msg").textContent = "No se pudo cargar el sistema de cuentas. Recarga la página."; return; }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { show("auth"); authMode("login"); return; }
  USER = session.user; $("who").textContent = USER.email; $("av-btn").textContent = (USER.email || "?")[0].toUpperCase();
  if (!$("s-cards").children.length) $("s-cards").innerHTML = '<div class="skel sk-card"></div><div class="skel sk-card"></div>';
  await adminInit(); adminAviso();
  let idn = null;
  try { idn = (await sb.rpc("mi_nombre")).data; } catch (e) {}
  if (!idn) {
    $("analisis").hidden = true; $("acc-box").innerHTML = ""; $("ajustes").hidden = true; $("perfil").innerHTML = "";
    let pend = null; try { pend = (await sb.rpc("mi_nombre_pendiente")).data; } catch (e) {}
    const datosExtra = () => `
      <p class="note" style="margin:.9rem 0 .3rem"><b>📍 Tu domicilio</b> (opcional): lo usamos solo para calcular la distancia y el tiempo hasta cada centro. Guardamos una ubicación aproximada, no la dirección. Puedes cambiarlo o borrarlo después en Ajustes.</p>
      <div class="filters"><label>Calle y número <input id="n-calle" type="text" autocomplete="street-address" style="min-width:min(16rem,70vw)"></label><label>C. postal <input id="n-cp" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" style="width:6.5rem"></label><label>Localidad <input id="n-loc" type="text" autocomplete="address-level2"></label></div>
      <div class="filters"><label>¿Te invitó alguien? Su código (opcional) <input id="n-ref" type="text" placeholder="DCV-XXXXX" maxlength="12" style="text-transform:uppercase;width:9rem"></label></div>
      <label class="chk"><input type="checkbox" id="n-av"><span>Quiero recibir por email un aviso cuando salgan plazas ofertadas en mis bolsas (opcional; puedes cambiarlo cuando quieras).</span></label>`;
    const aplicarExtras = async msg => {
      if ($("n-av") && $("n-av").checked) { try { await sb.from("perfiles").upsert({ id: USER.id, avisos: true }); } catch (e) {} }
      if ($("n-cp") && ($("n-cp").value.trim() || $("n-calle").value.trim())) { msg("Guardando tu domicilio…"); try { const r = await guardarDom($("n-calle").value, $("n-cp").value, $("n-loc").value); if (!r.ok) alert(r.msg + "\nPodrás indicarlo más tarde en Ajustes."); } catch (e) {} }
      if ($("n-ref") && $("n-ref").value.trim()) { try { const { data: rr } = await sb.rpc("usar_codigo", { p_codigo: $("n-ref").value }); if (rr !== "ok") alert(REF_ERR[rr] || "No se pudo aplicar el código de invitación."); } catch (e) {} }
    };
    if (pend) {
      $("perfil").innerHTML = `<h2>Todavía no apareces en ninguna lista</h2>
        <p style="margin:0 0 .5rem">Dejaste guardado el nombre <strong>«${esc(pend)}»</strong>. En cuanto aparezcas en una lista oficial de la Comunitat Valenciana, te vincularemos la cuenta automáticamente y te avisaremos por email — no tienes que hacer nada más.</p>
        <p class="note" style="margin:0 0 .75rem">Mientras tanto, de momento no podemos mostrarte tu puesto ni las bolsas, porque todavía no sabemos cuáles son. En cuanto te revisemos y veas que el nombre está mal escrito, puedes corregirlo aquí:</p>
        <div class="filters"><label>Tu nombre <input id="n-nom" type="text" autocomplete="off" value="${esc(pend)}" placeholder="APELLIDO1 APELLIDO2, NOMBRE" style="min-width:min(22rem,80vw)"></label></div>
        <p style="margin:.8rem 0 .3rem"><button class="btn" id="n-corr">Corregir nombre</button></p><p class="note" id="n-msg" role="status"></p>`;
      $("n-corr").onclick = async () => {
        const nom = $("n-nom").value.trim(), msg = s => { $("n-msg").textContent = s; };
        if (nom.length < 6) return msg("Escribe tu nombre completo: apellidos, una coma y el nombre.");
        msg("Guardando…");
        const { data, error } = await sb.rpc("guardar_nombre_pendiente", { p_nombre: nom });
        if (error) return msg("No se pudo guardar: " + error.message);
        msg(data === "ok" ? "Guardado. Te avisaremos cuando aparezcas en una lista." : data === "corto" ? "Escribe tu nombre completo." : "No se pudo guardar.");
      };
      return;
    }
    $("perfil").innerHTML = `<h2>Identifícate</h2><p style="margin:0 0 .75rem">Escribe tu nombre exactamente como sale en las listas oficiales: apellidos, una coma y el nombre.</p>
      <div class="filters"><label>Tu nombre <input id="n-nom" type="text" autocomplete="off" placeholder="APELLIDO1 APELLIDO2, NOMBRE" style="min-width:min(22rem,80vw)"></label></div>
      <p style="margin:.8rem 0 .3rem"><button class="btn" id="n-buscar">Buscar</button></p><p class="note" id="n-msg" role="status"></p><div id="n-conf"></div>`;
    $("n-buscar").onclick = async () => {
      const nom = $("n-nom").value.trim(), msg = s => { $("n-msg").textContent = s; }; $("n-conf").innerHTML = "";
      if (nom.length < 6) return msg("Escribe tu nombre completo: apellidos, una coma y el nombre.");
      msg("Buscando en las listas…");
      const { data: r, error } = await sb.rpc("comprobar_nombre", { p_nombre: nom });
      if (error) return msg("No se pudo comprobar: " + error.message);
      const estado = r && r.estado;
      if (estado === "exacto" || estado === "orden") {
        msg("");
        $("n-conf").innerHTML = `<p class="note" style="margin:0 0 .5rem">Hemos encontrado: <strong>${esc(r.nombre)}</strong>${datosExtra()}</p><p style="margin:.6rem 0 .3rem"><button class="btn" id="n-ok">Sí, soy yo — confirmar</button> <button class="link" id="n-no" type="button">No soy yo</button></p>`;
        $("n-no").onclick = () => { $("n-conf").innerHTML = ""; };
        $("n-ok").onclick = async () => {
          if (!confirm("Vas a registrar «" + r.nombre + "». No se podrá cambiar después. ¿Es correcto?")) return;
          msg("Guardando…");
          const { data: rr, error: e2 } = await sb.rpc("reclamar_nombre", { p_nombre: r.nombre });
          if (e2) return msg("No se pudo registrar: " + e2.message);
          if (rr === "ok" || rr === "ya_tiene") { await aplicarExtras(msg); return pedirEsp(); }
          msg(rr === "ambiguo" ? "Hay más de una persona con ese nombre y todavía no podemos distinguirte. Escríbenos y lo resolvemos." : "No se pudo registrar. Vuelve a entrar con tu cuenta.");
        };
        return;
      }
      if (estado === "ambiguo") return msg("Hay más de una persona con ese nombre y todavía no podemos distinguirte. Escríbenos (Sugerencias y reclamaciones) y lo resolvemos a mano.");
      if (estado === "parecido") return msg("Ese nombre no coincide exactamente con ninguna de las listas. Revisa que esté escrito igual que en el PDF oficial (apellidos, coma, nombre, sin abreviar) y vuelve a intentarlo.");
      // no_encontrado: puede que aún no hayas salido en ninguna lista
      $("n-conf").innerHTML = `<p class="note" style="margin:0 0 .5rem">No encontramos ese nombre en las listas de momento. Si sabes que participas en algún proceso y crees que es un error de escritura, revísalo y prueba otra vez.${datosExtra()}</p>
        <p style="margin:.6rem 0 .3rem"><button class="btn" id="n-pend">Aún no aparezco: avisadme cuando aparezca</button></p>`;
      $("n-pend").onclick = async () => {
        msg("Guardando…");
        const { data: rr, error: e2 } = await sb.rpc("guardar_nombre_pendiente", { p_nombre: nom });
        if (e2) return msg("No se pudo guardar: " + e2.message);
        if (rr === "ok") { await aplicarExtras(msg); location.reload(); return; }
        msg(rr === "ya_tiene" ? "Tu cuenta ya está vinculada: vuelve a entrar." : rr === "corto" ? "Escribe tu nombre completo." : "No se pudo guardar.");
      };
    };
    return;
  }
  if (!window.__espAsked) { window.__espAsked = true; let ya = null; try { ya = (await sb.from("perfiles").select("esp_maestros").eq("id", USER.id).maybeSingle()).data; } catch (e) {} if (!ya || !ya.esp_maestros || !ya.esp_maestros.length) return pedirEsp(); }
  let espMia = [], profMan = [];
  try { const d0 = (await sb.from("perfiles").select("esp_maestros").eq("id", USER.id).maybeSingle()).data || {}; espMia = d0.esp_maestros || []; } catch (e) {}
  try { const d1 = await sb.from("perfiles").select("esp_profesor").eq("id", USER.id).maybeSingle(); if (!d1.error) profMan = (d1.data || {}).esp_profesor || []; } catch (e) {}
  const espTxt = espMia.map(c => { const e = ESPU.find(x => x.codigo === c); return `<span class="tag" style="margin:.15rem .25rem 0 0">${esc(c)} · ${esc(e ? e.nombre : "")}</span>`; }).join("");
  let bolTxt = "", profMia = []; try { const bl = ((await sb.rpc("mi_panorama")).data || []).filter(r => r.cuerpo !== "maestros"); profMia = [...new Set(bl.map(r => r.bolsa))]; bolTxt = [...new Map(bl.map(r => [r.bolsa, r])).values()].map(r => `<span class="tag" style="margin:.15rem .25rem 0 0">${esc(r.bolsa)} · ${esc(r.bolsa_nombre)}</span>`).join(""); } catch (e) {}
  const profExtra = profMan.filter(c => !profMia.includes(c));
  bolTxt += profExtra.map(c => { const e = ESPU.find(x => x.codigo === c); return `<span class="tag" style="margin:.15rem .25rem 0 0" title="Añadida por administración: cuenta para los avisos; tu puesto saldrá cuando aparezcas en una lista">${esc(c)} · ${esc(e ? e.nombre : "")} ✍️</span>`; }).join("");
  profMia = [...new Set([...profMia, ...profMan])];
  const pn = (idn.split(",")[1] || idn).trim().toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  $("perfil").innerHTML = `<div class="h">Hola, ${esc(pn)} 👋</div><div class="nm">${esc(idn)}</div>${espTxt || bolTxt ? `<div class="espfila"><div>${espTxt}${bolTxt}</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem" id="esp-pedir-col"><div id="rt-slot"></div><button class="link" id="esp-pedir" type="button">✏️ Pedir cambio de especialidad</button></div></div>` : ""}`;
  if ($("esp-pedir")) $("esp-pedir").onclick = () => espPedir(espMia, profMia);
  $("ajustes").hidden = false; await geoCargar();
  $("ajustes-body").innerHTML = `<p class="note" style="margin:0 0 .4rem">Si hay un error en tu nombre o especialidades, escríbenos para corregirlo.</p>
    <label class="chk"><input type="checkbox" id="av-chk" disabled><span>Avisarme por email cuando salgan plazas ofertadas en mis bolsas</span></label><p class="note" id="av-msg" role="status" style="margin:.2rem 0 0"></p>
    <label class="chk"><input type="checkbox" id="rs-chk" disabled><span>📊 Mandarme un resumen semanal (domingo por la tarde): cómo ha cambiado mi puesto y cuántas plazas han salido en mis bolsas</span></label><p class="note" id="rs-msg" role="status" style="margin:.2rem 0 0"></p>
    <div class="panel" id="push-box" style="margin:.8rem 0 0"><b>🔔 Avisos en este dispositivo</b><p class="note" id="push-txt" style="margin:.3rem 0 .5rem">Comprobando…</p><button class="btn" id="push-btn" hidden>Activar notificaciones</button></div>
    <div class="panel" id="dom-box" style="margin:.8rem 0 0"><b>📍 Mi domicilio</b>
      <p class="note" style="margin:.3rem 0 .5rem">Sirve para calcular la distancia y el tiempo hasta cada centro. Solo guardamos una ubicación aproximada (coordenadas), <strong>no la dirección escrita</strong>. Puedes borrarla cuando quieras.</p>
      <p class="note" id="dom-txt" style="margin:0 0 .5rem"></p>
      <div class="filters"><label>Calle y número <input id="dom-calle" type="text" autocomplete="street-address" placeholder="Opcional, mejora la precisión" style="min-width:min(16rem,70vw)"></label>
        <label>C. postal <input id="dom-cp" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" style="width:6.5rem"></label>
        <label>Localidad <input id="dom-loc" type="text" autocomplete="address-level2"></label>
        <button class="btn" id="dom-ok">Guardar</button><button class="link" id="dom-del" hidden>Borrar mi domicilio</button></div>
      <p class="note" id="dom-msg" role="status" style="margin:.4rem 0 0"></p>
      <div id="km-box" style="margin:.8rem 0 0;padding-top:.7rem;border-top:1px solid var(--line)"><b>🔔 Avísame de plazas cerca de casa</b>
        <p class="note" style="margin:.3rem 0 .5rem">Te mandamos una notificación cuando salga una plaza de tus bolsas (ofertada o de difícil cobertura) a menos de los kilómetros que elijas. Distancia aproximada por carretera.</p>
        <div class="filters"><label>Distancia <select id="km-sel"><option value="0">No avisarme</option><option value="10">10 km</option><option value="20">20 km</option><option value="30">30 km</option><option value="50">50 km</option><option value="75">75 km</option><option value="100">100 km</option><option value="150">150 km</option></select></label></div>
        <p class="note" id="km-msg" role="status" style="margin:.4rem 0 0"></p></div></div>
    <div class="panel" id="ref-box" style="margin:.8rem 0 0"><b>🎁 Invita y consigue la app gratis</b>
      <p class="note" style="margin:.3rem 0 .5rem">Si <strong>3 personas</strong> se registran con tu código <strong>y pagan</strong> la app, tu curso es gratis.</p>
      <div id="ref-body" class="note">Cargando…</div><p class="note" id="ref-msg" role="status" style="margin:.4rem 0 0"></p></div>`
    + (ADMIN ? `<button class="btn" id="adesp" style="margin-top:.4rem">Administrador: cambiar mis especialidades</button>` : "")
    + (ADMIN ? `<details style="margin-top:.6rem"><summary class="note" style="cursor:pointer">Administrador: ver la web como otra persona</summary>
      <div class="filters" style="margin-top:.5rem"><label>Nombre en las listas <input id="adn-nom" type="text" autocomplete="off" placeholder="APELLIDO1 APELLIDO2, NOMBRE" style="min-width:min(22rem,80vw)"></label><button class="btn" id="adn-ok">Cambiar</button></div>
      <p class="note" style="margin:.6rem 0 .2rem">Ver cómo lo ve un usuario con el cobro activado:</p><div class="filters"><button class="btn" id="sim-p">Prueba (5 días)</button><button class="btn" id="sim-f">Prueba terminada</button><button class="btn" id="sim-n">Quitar simulación</button></div><p class="note" id="adn-msg" role="status"></p></details>` : "");  try {
    const pf = (await sb.from("perfiles").select("avisos").eq("id", USER.id).maybeSingle()).data;
    const chk = $("av-chk"); chk.checked = !!(pf && pf.avisos === true); chk.disabled = false;
    chk.onchange = async () => { const { error } = await sb.from("perfiles").upsert({ id: USER.id, avisos: chk.checked }); $("av-msg").textContent = error ? "No se pudo guardar: " + error.message : (chk.checked ? "Avisos activados." : "Avisos desactivados."); };
  } catch (e) {}
  try {
    const rs = $("rs-chk"), r0 = await sb.rpc("mi_resumen_activo");
    if (!r0.error) {
      rs.checked = r0.data !== false; rs.disabled = false;
      rs.onchange = async () => { const { data, error } = await sb.rpc("guardar_resumen", { p_on: rs.checked }); $("rs-msg").textContent = error || data !== "ok" ? "No se pudo guardar." : (rs.checked ? "Resumen semanal activado. Te llega por notificación (si la tienes activa) y por email (si tienes marcados los avisos por email)." : "Resumen semanal desactivado."); };
    } else $("rs-msg").textContent = "Disponible en breve.";
  } catch (e) {}
  pushInit(); domInit(); refInit();
  if (ADMIN && $("adesp")) $("adesp").onclick = () => pedirEsp(true);
  if (ADMIN) { $("sim-p").onclick = () => { SIM = "prueba"; renderApartado(); }; $("sim-f").onclick = () => { SIM = "fin"; renderApartado(); }; $("sim-n").onclick = () => { SIM = null; renderApartado(); }; }
  if (ADMIN) $("adn-ok").onclick = async () => {
    const nom = $("adn-nom").value.trim(); if (nom.length < 6) { $("adn-msg").textContent = "Escribe apellidos, coma y nombre."; return; }
    const { data, error } = await sb.rpc("admin_cambiar_nombre", { p_nombre: nom });
    if (error) { $("adn-msg").textContent = "No se pudo cambiar: " + error.message; return; }
    if (data === "ok") return renderApartado();
    $("adn-msg").textContent = data === "no_encontrado" ? "No encontramos ese nombre en las listas." : "No tienes permiso.";
  };
  const ac = await accesoInfo(); pintarAcceso(ac); ACC = ac; refTop(ac); distCard(ac); favCard(ac); uaCard(ac);
  if (!ac.activo) { $("analisis").hidden = true; return; }
  $("analisis").hidden = false;
  situacion();
}

/* ---------- ADMINISTRACIÓN: subir PDF ---------- */
async function adminInit() {
  ADMIN = false; $("ad-go").hidden = true;
  try {
    const { data, error } = await sb.from("admins").select("user_id").eq("user_id", USER.id).maybeSingle();
    if (error) { console.warn("DocentsCV admin:", error.message); return; }
    if (!data) { console.info("DocentsCV: esta cuenta no está en la tabla admins"); return; }
  } catch (e) { return; }
  ADMIN = true; $("ad-go").hidden = false;
}
$("ad-go").onclick = () => show("admin");
async function adminSistema() {
  const sum = $("sis-sum"), res = $("sis-res"), er = $("sis-err");
  const e = await sb.rpc("admin_estado_sistema");
  if (e.error) { res.innerHTML = `<span class="err">${esc(e.error.message)}</span> (¿has ejecutado antes_de_lanzar.sql en Supabase?)`; er.textContent = ""; return; }
  const d = e.data || {}, h = d.procesador_ok ? (Date.now() - new Date(d.procesador_ok)) / 36e5 : null, mal = h === null || h > 3;
  sum.innerHTML = `Estado del sistema ${mal ? '<span class="tag" style="background:var(--red-bg);color:var(--red)">⚠️ Procesador parado</span>' : '<span class="tag" style="background:var(--ok-bg);color:var(--ok)">✅ Todo en marcha</span>'}${d.errores_24h ? ` <span class="tag" style="background:var(--amb-bg);color:var(--amb)">🐞 ${d.errores_24h} error${d.errores_24h === 1 ? "" : "es"} en 24 h</span>` : ""}`;
  res.innerHTML = h === null ? "Todavía no hay marca de vida del procesador: sube la versión nueva de <code>procesar_pdfs.py</code> y <code>avisos.py</code>, y en cuanto se ejecute una vez este aviso desaparecerá solo."
    : `Última pasada correcta del procesador: <strong>${haceTxt(d.procesador_ok)}</strong> (${new Date(d.procesador_ok).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}).`
      + (mal ? ' <strong style="color:var(--red)">Lleva más de 3 horas sin terminar bien: mira GitHub → docentscv-procesador → Actions.</strong>' : "");
  const r = await sb.rpc("admin_errores", { p_dias: 7 });
  if (r.error) { er.innerHTML = `<span class="err">${esc(r.error.message)}</span>`; return; }
  const L = r.data || [];
  er.innerHTML = L.length ? `<div class="scroll"><table><thead><tr><th>Error</th><th class="n">Veces</th><th>Dónde</th><th>Último</th></tr></thead><tbody>${L.map(x => `<tr><td style="max-width:28rem;word-break:break-word">${esc(x.msg)}${x.linea ? `<br><small class="note">línea ${x.linea}${x.fuente ? " · " + esc(x.fuente.replace(/^https?:\/\/[^/]+/, "")) : ""}</small>` : ""}</td><td class="n">${x.n}</td><td><small>${esc(x.pagina || "")}<br>${esc(x.disp || "")}</small></td><td><small>${haceTxt(x.ultimo)}</small></td></tr>`).join("")}</tbody></table></div>`
    : "Ningún error en los últimos 7 días. 👍";
}
$("sis-borrar").onclick = async () => { if (!confirm("¿Vaciar la lista de errores? (Hazlo cuando los hayas revisado o arreglado.)")) return; await sb.rpc("admin_borrar_errores"); adminSistema(); };
const MSG_TN = { sugerencia: "💡 Sugerencia", reclamacion: "📣 Reclamación", error: "🐞 Error / avería", otro: "Mensaje", especialidad: "✏️ Cambio de especialidad" };
function adminBadge(n) { const b = $("av-btn"); if (!b) return; b.classList.toggle("pend", n > 0); b.dataset.n = n > 99 ? "99+" : String(n); b.setAttribute("aria-label", "Menú de usuario" + (n ? " (" + n + " mensajes pendientes)" : "")); $("ad-go").textContent = "Administración" + (n ? " · " + n + " pendiente" + (n === 1 ? "" : "s") : ""); }
async function adminAviso() {
  if (!ADMIN) { adminBadge(0); return; }
  let L = []; try { L = (await sb.rpc("admin_mensajes")).data || []; } catch (e) { return; }
  const pend = L.filter(m => !m.resuelto); adminBadge(pend.length);
  if (!pend.length) return;
  try { if (sessionStorage.getItem("dcv_adm_aviso")) return; sessionStorage.setItem("dcv_adm_aviso", "1"); } catch (e) {}
  $("adm-dlg-t").textContent = "📬 " + (pend.length === 1 ? "Tienes 1 mensaje pendiente" : "Tienes " + pend.length + " mensajes pendientes");
  $("adm-dlg-s").textContent = pend.length > 5 ? "Estos son los 5 más recientes." : "Sugerencias, averías o peticiones de usuarios.";
  $("adm-dlg-l").innerHTML = pend.slice(0, 5).map(m => `<div class="it"><div class="a"><b>${MSG_TN[m.tipo] || "Mensaje"} · ${esc(new Date(m.creado).toLocaleString("es-ES", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }))}</b><small style="white-space:pre-wrap">${esc(m.texto.replace(/\n?\[(ESP|PROF):[0-9A-Z,]+\]/g, "").slice(0, 160))}</small></div></div>`).join("");
  if (!$("adm-dlg").open) $("adm-dlg").showModal();
}
$("adm-dlg-x").onclick = () => $("adm-dlg").close();
$("adm-dlg-go").onclick = () => { $("adm-dlg").close(); show("admin"); setTimeout(() => { const d = $("adm-msg"); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 600); };
function cfgAbrir(id) { $("cfg").hidden = false; ["ajustes", "del-panel"].forEach(x => { $(x).open = (x === id); }); const t = $(id).hidden ? $("del-panel") : $(id); t.open = true; t.scrollIntoView({ behavior: "smooth", block: "start" }); }
$("mn-aj").onclick = () => cfgAbrir("ajustes");
async function msgAbrir() {
  $("msg-ok").hidden = true; $("msg-form").hidden = false; $("msg-txt").value = ""; $("msg-st").textContent = ""; $("msg-send").disabled = false;
  let em = ""; try { const { data: { session } } = await sb.auth.getSession(); em = session ? session.user.email || "" : ""; } catch (e) {}
  $("msg-mail").value = em; if (!$("msg-dlg").open) $("msg-dlg").showModal();
}
$("mn-msg").onclick = () => { $("menu-us").hidden = true; msgAbrir(); };
$("ft-msg").onclick = ev => { ev.preventDefault(); msgAbrir(); };
$("msg-x").onclick = $("msg-cerrar").onclick = () => $("msg-dlg").close();
$("msg-send").onclick = async () => {
  const t = $("msg-txt").value.trim(), mail = $("msg-mail").value.trim(), st = $("msg-st");
  if (t.length < 5) { st.textContent = "Escribe un mensaje un poco más largo."; return; }
  if (mail && !/^\S+@\S+\.\S+$/.test(mail)) { st.textContent = "El correo no parece válido."; return; }
  if (!sb) { st.textContent = "No se pudo conectar. Recarga la página."; return; }
  $("msg-send").disabled = true; st.textContent = "Enviando…";
  const { data, error } = await sb.rpc("enviar_mensaje", { p_tipo: $("msg-tipo").value, p_texto: t, p_email: mail || null });
  if (!error && data === "ok") { $("msg-form").hidden = true; $("msg-ok").hidden = false; return; }
  st.textContent = data === "limite" ? "Has enviado muchos mensajes seguidos. Inténtalo más tarde." : data === "corto" ? "Escribe un mensaje un poco más largo." : "No se pudo enviar. Inténtalo de nuevo."; $("msg-send").disabled = false;
};
$("mn-del").onclick = () => cfgAbrir("del-panel");
$("cfg-x").onclick = () => { $("cfg").hidden = true; };
let AD_N = 10;
async function adminLista() {
  const { data, error } = await sb.from("importaciones").select("nombre_original,tipo,cuerpo,estado,mensaje,creado").order("creado", { ascending: false }).limit(AD_N);
  $("ad-rows").innerHTML = error ? `<tr><td colspan="5" class="err">${esc(error.message)}</td></tr>`
    : data.map(i => `<tr><td>${esc(i.nombre_original)}</td><td>${esc(i.tipo)}</td><td>${esc(i.cuerpo)}</td><td>${esc(i.estado)}${i.mensaje ? " · " + esc(i.mensaje) : ""}</td><td>${esc(new Date(i.creado).toLocaleString("es-ES"))}</td></tr>`).join("");
  $("ad-mas").hidden = !!error || data.length < AD_N;
  adminEstado();
}
$("ad-mas").onclick = () => { AD_N += 10; adminLista(); };
async function adminEstado() {
  const { data, error } = await sb.rpc("admin_estado_descarga"), box = $("ad-estado");
  if (error || !data) { box.textContent = ""; return; }
  const f = d => d ? new Date(d).toLocaleString("es-ES", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "ninguna todavía";
  const hace = d => { if (!d) return "nunca"; const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 90 ? "hace " + m + " min" : m < 2880 ? "hace " + Math.round(m / 60) + " h" : "hace " + Math.round(m / 1440) + " días"; };
  const lin = (t, x) => `<li>${t}: ${x ? `<b>${esc(x.nombre)}</b> (cargada el ${f(x.creado)})` : "ninguna todavía"}</li>`;
  box.innerHTML = `<b>Descarga automática</b> · última búsqueda en la web de la Conselleria: <b>${hace(data.ultima_busqueda)}</b> (solo busca de lunes a viernes, de 7 a 22 h)<ul style="margin:.3rem 0 0 1.1rem;padding:0">${lin("Adjudicación continua · Maestros", data.continua_maestros)}${lin("Adjudicación continua · Secundaria y otros", data.continua_otros)}${lin("Plazas ofertadas", data.ofertas)}</ul>`;
}
const EST_US = { regalo: "🎁 Acceso gratuito", pagado: "Pagado", en_prueba: "En prueba", prueba_terminada: "Prueba terminada", pago_caducado: "Pago caducado", registrado: "Registrado", sin_identificar: "Sin identificar" };
let USU = [];
async function adminUsuarios() {
  const { data, error } = await sb.rpc("admin_usuarios");
  if (error) { $("us-res").innerHTML = `<span class="err">${esc(error.message)}</span>`; return; }
  USU = data || []; const n = e => USU.filter(u => u.estado === e).length;
  $("us-res").innerHTML = `<b>${USU.length}</b> altas · <b>${USU.filter(u => u.estado === "pagado" && u.origen !== "regalo").length}</b> pagado${USU.filter(u => u.estado === "pagado" && u.origen !== "regalo").length === 1 ? "" : "s"} · <b>${USU.filter(u => u.origen === "regalo" && u.estado === "pagado").length}</b> de regalo · <b>${n("en_prueba")}</b> en prueba · <b>${n("prueba_terminada") + n("pago_caducado")}</b> sin pagar tras la prueba · <b>${n("registrado")}</b> registrados (sin cobro activo) · <b>${n("sin_identificar")}</b> sin identificar${USU.some(u => u.confirmado === false) ? ` · <b style="color:var(--amb)">${USU.filter(u => u.confirmado === false).length}</b> sin confirmar el correo` : ""}`;
  usuPintar();
}
function usuPintar() {
  const q = $("us-q").value.trim().toLowerCase(), es = $("us-est").value, f = d => d ? new Date(d).toLocaleDateString("es-ES") : "—";
  const fdt = d => d ? new Date(d).toLocaleString("es-ES", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "nunca";
  const fil = USU.filter(u => (!es || (es === "regalo" ? u.origen === "regalo" && u.estado === "pagado" : es === "sin_confirmar" ? u.confirmado === false : u.estado === es)) && (!q || ((u.email || "") + " " + (u.nombre || "")).toLowerCase().includes(q)));
  $("us-rows").innerHTML = fil.length ? fil.slice(0, 500).map((u, i) => {
    const esp = u.esp_maestros ? [(u.esp_maestros || []).length ? "Maestros " + u.esp_maestros.join(", ") : "", [...new Set([...(u.bolsas_listas || []), ...(u.esp_profesor || [])])].length ? "Profesorado " + [...new Set([...(u.bolsas_listas || []), ...(u.esp_profesor || [])])].join(", ") : ""].filter(Boolean).join(" · ") || "ninguna" : null;
    return `<tr class="us-main"><td><button class="link" data-tog="${i}" aria-expanded="false" style="font-size:1rem">▾</button></td><td>${esc(u.email)}</td><td>${f(u.alta)}</td><td>${u.estado === "pagado" || u.estado === "pago_caducado" ? f(u.pagado_el) : "—"}</td><td>${u.pagado_hasta ? fmtF(u.pagado_hasta) : "—"}</td></tr>
    <tr class="us-det" data-det="${i}" hidden><td></td><td colspan="4">
      <p class="note" style="margin:.1rem 0"><strong>Nombre:</strong> ${esc(u.nombre || "—")} · <strong>Estado:</strong> ${esc(u.origen === "regalo" && u.estado === "pagado" ? EST_US.regalo : EST_US[u.estado] || u.estado)}</p>
      <p class="note" style="margin:.1rem 0"><strong>Última conexión:</strong> ${esc(fdt(u.ultimo_acceso))}</p>
      ${esp !== null ? `<p class="note" style="margin:.1rem 0">✏️ Especialidades: ${esc(esp)} <button class="link" data-ue="${esc(u.email)}" data-uesp="${esc((u.esp_maestros || []).join(","))}" data-uprof="${esc((u.esp_profesor || []).join(","))}" data-ulis="${esc((u.bolsas_listas || []).join(","))}" title="Cambiar sus especialidades">Cambiar</button></p>` : ""}
      ${u.confirmado === false ? `<p class="note" style="margin:.1rem 0"><span class="tag" style="background:var(--amb-bg);color:var(--amb)">✉️ Sin confirmar el correo</span> <button class="link" data-cf="${esc(u.email)}">Confirmar</button></p>` : ""}
      <p style="margin:.3rem 0 0">${u.origen === "regalo" && u.estado === "pagado" ? `<button class="link" data-rg="0" data-m="${esc(u.email)}">Quitar regalo</button>` : u.estado === "pagado" ? "" : `<button class="link" data-rg="1" data-m="${esc(u.email)}">🎁 Dar acceso gratis</button>`}</p>
    </td></tr>`;
  }).join("") : '<tr><td colspan="4">Sin resultados.</td></tr>';
  $("us-rows").querySelectorAll("button[data-tog]").forEach(b => b.onclick = () => {
    const det = $("us-rows").querySelector(`tr.us-det[data-det="${b.dataset.tog}"]`);
    if (!det) return;
    det.hidden = !det.hidden; b.textContent = det.hidden ? "▾" : "▴"; b.setAttribute("aria-expanded", String(!det.hidden));
  });
  $("us-rows").querySelectorAll("button[data-rg]").forEach(b => b.onclick = () => regalo(b.dataset.m, b.dataset.rg === "1"));
  $("us-rows").querySelectorAll("button[data-cf]").forEach(b => b.onclick = () => confirmarEmail(b.dataset.cf));
  $("us-rows").querySelectorAll("button[data-ue]").forEach(b => b.onclick = () => espPedir(b.dataset.uesp.split(",").filter(Boolean), (b.dataset.uprof || "").split(",").filter(Boolean), b.dataset.ue, (b.dataset.ulis || "").split(",").filter(Boolean)));
}
async function confirmarEmail(mail) {
  if (!confirm("¿Confirmar a mano el correo de " + mail + "? Podrá entrar con la contraseña que eligió, sin el email de confirmación.")) return;
  const { data, error } = await sb.rpc("admin_confirmar_email", { p_email: mail });
  const M = { ok: "✅ Correo confirmado: " + mail + " ya puede entrar con su contraseña.", ya_confirmado: "Ese correo ya estaba confirmado.", no_existe: "No hay ninguna cuenta con ese correo.", no_autorizado: "No tienes permiso." };
  alert(error ? "No se pudo (¿has ejecutado confirmacion_email.sql en Supabase?): " + error.message : (M[data] || data));
  if (!error && data === "ok") adminUsuarios();
}
const RG_MSG = { ok: "Listo.", no_existe: "No hay ninguna cuenta con ese correo. La persona tiene que registrarse primero.", ya_pago: "Esa persona ya ha pagado: no hace falta darle acceso.", no_es_regalo: "Esa persona no tiene un acceso gratuito.", no_autorizado: "No tienes permiso." };
async function regalo(mail, on) {
  mail = (mail || "").trim(); const box = $("rg-msg");
  if (!mail) { box.textContent = "Escribe el correo de la persona."; return; }
  if (on && !confirm("¿Dar acceso gratuito a " + mail + " hasta fin de curso?")) return;
  const { data, error } = await sb.rpc("admin_dar_acceso", { p_email: mail, p_on: on });
  box.textContent = error ? "No se pudo: " + error.message : data === "ok" ? (on ? "🎁 Listo: " + mail + " tiene acceso gratuito hasta fin de curso." : "Acceso gratuito quitado a " + mail + ".") : (RG_MSG[data] || data);
  if (!error && data === "ok") { $("rg-mail").value = ""; adminUsuarios(); }
}
$("rg-dar").onclick = () => regalo($("rg-mail").value, true);
$("rg-quitar").onclick = () => regalo($("rg-mail").value, false);
const RB_MSG = { ok: "Listo.", no_existe: "No hay ninguna cuenta con ese correo.", no_autorizado: "No tienes permiso." };
async function quitarPorReembolso(mail) {
  mail = (mail || "").trim(); const box = $("rb-msg");
  if (!mail) { box.textContent = "Escribe el correo de la persona."; return; }
  if (!confirm("¿Quitar el acceso de pago a " + mail + "? Úsalo solo si le has hecho un reembolso.")) return;
  const { data, error } = await sb.rpc("admin_quitar_acceso", { p_email: mail });
  box.textContent = error ? "No se pudo: " + error.message : data === "ok" ? "Acceso quitado a " + mail + "." : (RB_MSG[data] || data);
  if (!error && data === "ok") { $("rb-mail").value = ""; adminUsuarios(); }
}
$("rb-quitar").onclick = () => quitarPorReembolso($("rb-mail").value);
async function adminEmbudo() {
  const box = $("emb-res"); if (!box) return;
  const { data, error } = await sb.rpc("admin_embudo", { p_dias: +$("emb-dias").value });
  if (error) { box.innerHTML = `<span class="err">${esc(error.message)}</span> (¿has ejecutado lanzamiento.sql en Supabase?)`; return; }
  const T = (data || []).find(r => r.origen === "TOTAL"); if (!T) { box.textContent = "Sin datos."; return; }
  const pasos = [["Visitas", +T.visitas], ["Registros", +T.registros], ["Se identifican con su nombre", +T.identificados], ["Empiezan la prueba", +T.pruebas], ["Pagan", +T.pagos]];
  const pc = (a, b) => b > 0 ? Math.round(a / b * 100) + " %" : "—";
  box.innerHTML = `<div class="scroll"><table><thead><tr><th>Paso</th><th class="n">Personas</th><th class="n">% del paso anterior</th></tr></thead><tbody>${pasos.map((x, i) => `<tr><td>${x[0]}</td><td class="n"><b>${x[1]}</b></td><td class="n">${i ? pc(x[1], pasos[i - 1][1]) : ""}</td></tr>`).join("")}</tbody></table></div>
    <p class="note" style="margin:.5rem 0">Visitas = aperturas de la web en un navegador (no personas distintas). «Empiezan la prueba» y «Pagan» solo se rellenan cuando el cobro está activado.</p>
    <h3 style="margin:.8rem 0 .3rem;font:600 1rem var(--body)">Visitas por origen</h3>
    <div class="scroll"><table><thead><tr><th>Origen</th><th class="n">Visitas</th></tr></thead><tbody>${(data || []).filter(r => r.origen !== "TOTAL").map(r => `<tr><td>${esc(r.origen)}</td><td class="n">${r.visitas}</td></tr>`).join("") || '<tr><td colspan="2">Todavía sin visitas.</td></tr>'}</tbody></table></div>
    <h3 style="margin:.8rem 0 .3rem;font:600 1rem var(--body)">Visitas por dispositivo</h3>
    <div id="emb-plat" class="note">Cargando…</div>
    <p class="note">Para saber de dónde viene la gente, pon <b>?o=telegram</b>, <b>?o=instagram</b>… al final del enlace que compartes (por ejemplo https://docentscv.github.io/?o=telegram). «app» es la app instalada y «directo» los que entran sin origen.</p>`;  adminPlataformas();
}
async function adminPlataformas() {
  const box = $("emb-plat"); if (!box) return;
  const { data, error } = await sb.rpc("admin_plataformas", { p_dias: +$("emb-dias").value });
  if (error) { box.innerHTML = `<span class="err">${esc(error.message)}</span> (¿has ejecutado plataformas.sql en Supabase?)`; return; }
  const N = { ios: "🍎 iPhone / iPad", android: "🤖 Android", pc: "💻 Ordenador", otro: "Sin dato" }, L = data || [], tot = L.reduce((a, r) => a + +r.visitas, 0);
  box.innerHTML = tot ? `<div class="scroll"><table><thead><tr><th>Dispositivo</th><th class="n">Visitas</th><th class="n">%</th></tr></thead><tbody>${L.map(r => `<tr><td>${N[r.plataforma] || esc(r.plataforma)}</td><td class="n">${r.visitas}</td><td class="n">${Math.round(r.visitas / tot * 100)} %</td></tr>`).join("")}</tbody></table></div>` : "Todavía sin datos (se cuenta desde que subas esta versión).";
}
$("emb-dias").addEventListener("change", adminEmbudo);
let CAD = [];
const nomPila = n => ((n || "").split(",")[1] || n || "").trim().toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
function cadPintar() {
  const f = d => d ? new Date(d).toLocaleDateString("es-ES") : "—";
  $("cad-res").innerHTML = CAD.length ? `<b>${CAD.length}</b> persona${CAD.length === 1 ? "" : "s"} · <b>${CAD.filter(u => !u.avisado).length}</b> sin avisar` : "Nadie por ahora. (Solo se rellena cuando el cobro está activado.)";
  $("cad-rows").innerHTML = CAD.map((u, i) => `<tr><td>${esc(u.email)}</td><td>${esc(u.nombre || "—")}</td><td class="n">${u.dias}</td><td>${f(u.avisado)}</td><td><button class="btn" data-i="${i}" style="padding:.2rem .7rem">✉️ Enviar recordatorio</button></td></tr>`).join("");
  $("cad-rows").querySelectorAll("button").forEach(b => b.onclick = async () => {
    const u = CAD[+b.dataset.i];
    const asunto = "Tu prueba de DocentsCV ha terminado";
    const cuerpo = `Hola${nomPila(u.nombre) ? ", " + nomPila(u.nombre) : ""}:\n\nProbaste DocentsCV durante los ${DIAS_PRUEBA} días de prueba y quería recordarte que puedes seguir viendo tu situación en las bolsas, tu probabilidad de plaza y las últimas adjudicaciones por solo 4,99 € por todo el curso 2026/27 (pago único, sin renovación automática).\n\nY si prefieres conseguirla gratis: en Mi apartado → Ajustes encontrarás tu código personal. Si 3 personas se registran con él y pagan, tu curso es gratis.\n\nGracias por usar DocentsCV.\nFede`;
    location.href = "mailto:" + encodeURIComponent(u.email).replace(/%40/g, "@") + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
    try { await sb.rpc("admin_marcar_descuento", { p_email: u.email }); } catch (e) {}
    adminCaducadas();
  });
}
async function adminMensajes() {
  const r = await sb.rpc("admin_mensajes"); if (r.error) { $("msg-res").innerHTML = `<span class="err">${esc(r.error.message)}</span>`; return; }
  const L = r.data || [], pend = L.filter(m => !m.resuelto).length, TN = { sugerencia: "💡 Sugerencia", reclamacion: "📣 Reclamación", error: "🐞 Error", otro: "Mensaje", especialidad: "✏️ Cambio de especialidad" };
  $("adm-msg-sum").textContent = "Sugerencias y reclamaciones" + (pend ? " (" + pend + " sin resolver)" : ""); adminBadge(pend);
  $("msg-res").textContent = L.length ? (pend ? pend + " sin resolver." : "No hay mensajes pendientes. 🎉") + (L.length - pend ? " Las resueltas están en el desplegable de abajo." : "") : "Todavía no hay mensajes.";
  const fila = m => `<div class="it" style="${m.resuelto ? "opacity:.55" : ""}"><div class="a"><b>${TN[m.tipo] || "Mensaje"} · ${esc(new Date(m.creado).toLocaleString("es-ES", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }))}</b><small style="white-space:pre-wrap;color:var(--ink,inherit)">${esc(m.texto.replace(/\n?\[(ESP|PROF):[0-9A-Z,]+\]/g, ""))}</small><small>${m.email ? `<a href="mailto:${esc(m.email)}?subject=${encodeURIComponent("Sobre tu mensaje en DocentsCV")}">${esc(m.email)}</a>` : "Sin correo"}</small></div><div class="z">${m.tipo === "especialidad" && !m.resuelto && /\[ESP:([0-9,]*)\]/.test(m.texto) && m.email ? (e => `<button type="button" class="btn" data-ap="${m.id}" data-em="${esc(m.email)}" data-esp="${esc(e)}">${e ? "✅ Aplicar cambio (Maestros)" : "✅ Quitar sus especialidades de Maestros"}</button> `)(m.texto.match(/\[ESP:([0-9,]*)\]/)[1]) : ""}${m.tipo === "especialidad" && !m.resuelto && /\[PROF:([0-9A-Z,]*)\]/.test(m.texto) && m.email ? `<button type="button" class="btn" data-apr="${m.id}" data-em="${esc(m.email)}" data-esp="${esc(m.texto.match(/\[PROF:([0-9A-Z,]*)\]/)[1])}">✅ Aplicar cambio (Profesorado)</button> ` : ""}<button type="button" class="dbtn" data-mid="${m.id}" data-r="${m.resuelto ? 0 : 1}">${m.resuelto ? "Reabrir" : "✔ Resuelto"}</button></div></div>`;
  const hecho = L.filter(m => m.resuelto), abierto = !!(document.querySelector("#msg-lista details[open]"));
  $("msg-lista").innerHTML = L.filter(m => !m.resuelto).map(fila).join("") + (hecho.length ? `<details style="margin-top:.8rem"${abierto ? " open" : ""}><summary class="note" style="cursor:pointer">Resueltas (${hecho.length})</summary>${hecho.map(fila).join("")}</details>` : "");
}
document.addEventListener("click", async ev => { const b = ev.target.closest("[data-mid]"); if (!b) return; await sb.rpc("admin_mensaje_resuelto", { p_id: +b.dataset.mid, p_resuelto: b.dataset.r === "1" }); adminMensajes(); });
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-ap]"); if (!b) return;
  const em = b.dataset.em, esp = b.dataset.esp.split(",").filter(Boolean);
  if (!confirm(esp.length ? "¿Cambiar las especialidades de Maestros de " + em + " a " + esp.join(", ") + "?" : "¿Quitar todas las especialidades de Maestros de " + em + "?")) return;
  b.disabled = true;
  const { data, error } = await sb.rpc("admin_set_esp_maestros", { p_email: em, p_esp: esp });
  if (error || data !== "ok") { $("msg-res").innerHTML = `<span class="err">${esc(error ? error.message : data === "no_existe" ? "No hay ninguna cuenta con ese correo." : data)}</span>`; b.disabled = false; return; }
  const otro = (b.closest(".it") || document).querySelector("[data-apr]:not([disabled])");
  if (!otro) { await sb.rpc("admin_mensaje_resuelto", { p_id: +b.dataset.ap, p_resuelto: true }); await adminMensajes(); } else b.remove();
  $("msg-res").textContent = "✅ Especialidades de Maestros cambiadas para " + em + "." + (otro ? " Falta aplicar la parte de Profesorado." : "");
});
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-apr]"); if (!b) return;
  const em = b.dataset.em, esp = b.dataset.esp.split(",").filter(Boolean);
  if (!confirm("¿Añadir a mano estas especialidades de profesorado a " + em + ": " + (esp.join(", ") || "ninguna") + "?\n(Cuentan para sus avisos; su puesto sale solo de las listas oficiales.)")) return;
  b.disabled = true;
  const { data, error } = await sb.rpc("admin_set_esp_profesor", { p_email: em, p_esp: esp });
  if (error || data !== "ok") { $("msg-res").innerHTML = `<span class="err">${esc(error ? error.message : data === "no_existe" ? "No hay ninguna cuenta con ese correo." : data)}</span>`; b.disabled = false; return; }
  const otro = (b.closest(".it") || document).querySelector("[data-ap]:not([disabled])");
  if (!otro) { await sb.rpc("admin_mensaje_resuelto", { p_id: +b.dataset.apr, p_resuelto: true }); await adminMensajes(); } else b.remove(); $("msg-res").textContent = "✅ Especialidades de profesorado guardadas para " + em + ".";
});
async function adminCaducadas() {
  const a = await sb.rpc("admin_pruebas_caducadas"), r = await sb.rpc("admin_referidos");
  if (a.error) { $("cad-res").innerHTML = `<span class="err">${esc(a.error.message)}</span>`; return; }
  CAD = a.data || []; cadPintar();
  $("ref-rows").innerHTML = (r.data || []).length ? r.data.map(x => `<tr><td>${esc(x.anfitrion)}</td><td>${esc(x.codigo)}</td><td class="n">${x.invitados}</td><td class="n">${x.pagados}</td></tr>`).join("") : '<tr><td colspan="4">Todavía no hay referidos.</td></tr>';
}
$("cad-copiar").onclick = async () => { const t = CAD.map(u => u.email).join(", "); try { await navigator.clipboard.writeText(t); $("cad-res").textContent = "Correos copiados (" + CAD.length + ")."; } catch (e) { $("cad-res").textContent = t; } };
$("us-q").addEventListener("input", usuPintar); $("us-est").addEventListener("change", usuPintar);
function subirPdf(tipo, fileId, msgId, cuerpoFn) {
  return async () => {
    const f = $(fileId).files[0], msg = s => { $(msgId).textContent = s; };
    if (!f) return msg("Elige un archivo PDF.");
    if (!/\.pdf$/i.test(f.name)) return msg("El archivo debe ser un PDF.");
    msg("Subiendo… puede tardar si el archivo es grande.");
    const path = "pendientes/" + Date.now() + "_" + f.name.replace(/[^\w.\-]/g, "_");
    try {
      const up = await sb.storage.from("pdfs").upload(path, f, { contentType: "application/pdf" }); if (up.error) throw up.error;
      const ins = await sb.from("importaciones").insert({ archivo: path, nombre_original: f.name, tipo, cuerpo: cuerpoFn(), creado_por: USER.id }); if (ins.error) throw ins.error;
      msg("PDF subido. Se procesará automáticamente en la próxima revisión (normalmente en menos de una hora). Si lo necesitas ya: GitHub → docentscv-procesador → Actions → Procesar PDF pendientes → Run workflow. Recarga esta lista para ver el resultado."); $(fileId).value = ""; adminLista();
    } catch (e) { msg("No se pudo subir: " + e.message); }
  };
}
$("of-up").onclick = subirPdf("ofertas", "of-file", "of-msg", () => "todos");
$("df-up").onclick = subirPdf("dificil", "df-file", "df-msg", () => "todos");
$("da-up").onclick = subirPdf("dificil_adj", "da-file", "da-msg", () => "todos");
$("ad-up").onclick = subirPdf("continua", "ad-file", "ad-msg", () => /_lis_mae\.pdf$/i.test($("ad-file").files[0]?.name || "") ? "maestros" : "otros");

const EST_TXT = {
  1: "Adjudicado: tienes plaza",
  2: "No adjudicado: pediste alguna plaza ofertada y no la conseguiste",
  3: "Has participado: ninguna de tus peticiones estaba entre las plazas ofertadas",
  4: "No has participado: no confirmaste a tiempo",
  5: "Desactivado"
};
const fmtF = f => f ? String(f).split("-").reverse().join("/") : "";
const pct = p => p < 0.01 ? "menos del 1 %" : Math.round(p * 100) + " %";
const acum = (p, n) => 1 - Math.pow(1 - p, n);
/* «¿Cuándo me tocará?»: con la probabilidad por tanda (p1) y el ritmo de tandas, fecha en la que la probabilidad acumulada llega al 50 % y al 80 %. */
let FREQ = {};   // días entre tandas por grupo (se calcula en situacion())
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const quincena = d => `${d.getDate() <= 15 ? "1.ª" : "2.ª"} quincena de ${MESES[d.getMonth()]}`;
function cuandoTxt(r, p1) {
  if (!(p1 > 0)) return `<p class="note" style="margin:.5rem 0 0"><strong>¿Cuándo me tocará?</strong> Con el ritmo actual de tu bolsa no se puede hacer una previsión: en las últimas tandas no ha habido plazas que te alcancen.</p>`;
  const dias = FREQ[r.grupo] || 7, base = new Date((r.ult_tanda || r.fecha) + "T12:00:00");
  const y = base.getMonth() >= 8 ? base.getFullYear() + 1 : base.getFullYear(), fin = new Date(y + "-06-30T12:00:00");
  const n = q => Math.max(1, Math.ceil(Math.log(1 - q) / Math.log(1 - Math.min(p1, 0.999))));
  const fecha = k => new Date(base.getTime() + k * dias * 864e5);
  const f50 = fecha(n(0.5)), f80 = fecha(n(0.8));
  let txt;
  if (f50 > fin) txt = "Con el ritmo actual, <strong>es poco probable que te llegue plaza antes de final de curso</strong>, aunque puede cambiar si salen más plazas o se mueve la lista.";
  else if (n(0.5) === 1) txt = `Hay más de un 50 % de probabilidad de que te llegue <strong>ya en la próxima tanda</strong>${f80 <= fin ? `, y un 80 % de que te llegue <strong>antes de la ${quincena(f80)}</strong>` : ""}.`;
  else txt = `Con el ritmo actual, hay un 50 % de probabilidad de que te llegue <strong>antes de la ${quincena(f50)}</strong>${f80 <= fin ? `, y un 80 % de que te llegue <strong>antes de la ${quincena(f80)}</strong>` : "; no es seguro que llegue antes de final de curso"}.`;
  return `<p class="note" style="margin:.5rem 0 0"><strong>¿Cuándo me tocará?</strong> ${txt} <em>Es una probabilidad, no una certeza:</em> depende de las plazas que salgan, de lo que pidan quienes van por delante y de que el ritmo de las tandas se mantenga.</p>`;
}
const nivel = p3 => p3 < 0.05 ? "Muy baja" : p3 < 0.15 ? "Baja" : p3 < 0.30 ? "Media" : p3 < 0.50 ? "Alta" : "Muy alta";
const cuerpoNombre = slug => (CUERPOS.find(c => c.slug === slug) || {}).nombre || slug;
const tituloLista = r => r.cuerpo === "maestros" ? "Maestros · lista única" : r.bolsa + " · " + r.bolsa_nombre;

// Gráfico de evolución: la línea sube cuando mejora tu puesto (número más bajo)
function chart(h, key, lab) {
  const pts = h.slice().reverse().filter(r => r[key] != null).map(r => ({ t: Date.parse(r.fecha), y: r[key], f: r.fecha, e: r.estado }));
  if (pts.length < 2) return "";
  const W = 340, H = 120, pl = 38, pr = 10, pt = 12, pb = 24;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t, ys = pts.map(p => p.y), lo = Math.min(...ys), hi = Math.max(...ys);
  const X = t => pl + (t - t0) / ((t1 - t0) || 1) * (W - pl - pr), Y = v => pt + (v - lo) / ((hi - lo) || 1) * (H - pt - pb);
  const line = pts.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ");
  const col = v => { const f = (v - lo) / ((hi - lo) || 1); return f < 0.34 ? "var(--ok)" : f < 0.67 ? "var(--amb)" : "var(--red)"; }, gid = "gr" + key;
  const dots = pts.map(p => {
    const cx = X(p.t), cy = Y(p.y), txt = `${fmtF(p.f)} · ${lab}: ${p.y}`, bw = txt.length * 5.6 + 14, bx = Math.min(Math.max(cx - bw / 2, 2), W - bw - 2), by = cy < 40 ? cy + 12 : cy - 34;
    return `<g class="pt" tabindex="0"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" fill="transparent"/><circle class="d" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.4" fill="${col(p.y)}"/><g class="tip" pointer-events="none"><rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="22" rx="5" fill="var(--ink)"/><text x="${(bx + bw / 2).toFixed(1)}" y="${(by + 15).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--paper)">${txt}</text></g></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución: de ${pts[0].y} el ${fmtF(pts[0].f)} a ${pts[pts.length - 1].y} el ${fmtF(pts[pts.length - 1].f)}" style="width:100%;max-width:34rem;height:auto;display:block;margin:.5rem 0">
    <line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="var(--line)"/><line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" stroke="var(--line)"/>
    <defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="${pt}" x2="0" y2="${H - pb}"><stop offset="0" stop-color="var(--ok)"/><stop offset="0.5" stop-color="var(--amb)"/><stop offset="1" stop-color="var(--red)"/></linearGradient></defs>
    <path d="${line}" fill="none" stroke="url(#${gid})" stroke-width="2.4" stroke-linejoin="round"/>${dots}
    <g font-size="10" fill="var(--muted)"><text x="${pl - 4}" y="${pt + 3}" text-anchor="end">${lo}</text><text x="${pl - 4}" y="${H - pb}" text-anchor="end">${hi}</text>
    <text x="${pl}" y="${H - 8}">${fmtF(pts[0].f)}</text><text x="${W - pr}" y="${H - 8}" text-anchor="end">${fmtF(pts[pts.length - 1].f)}</text></g></svg>`;
}

function charts(h) {
  const ult = h.length ? h.reduce((m, r) => r.fecha > m ? r.fecha : m, "") : "";
  let h2 = h;
  if (ult) { const d = new Date(ult); d.setMonth(d.getMonth() - 2); const lim = d.toISOString().slice(0, 10); h2 = h.filter(r => r.fecha >= lim); }
  const a = chart(h2, "posicion", "Tu puesto"), b = chart(h2, "x", "Competidores por delante");
  const ttl = '<div class="note" style="margin:.9rem 0 0"><strong>Evolución de los últimos 2 meses</strong></div>';
  if (!a && !b) return ttl + '<p class="note" style="margin:.2rem 0 0">Todavía no hay suficientes datos en los últimos 2 meses para dibujar la gráfica.</p>';
  return ttl + (a ? `<div class="note" style="margin:.4rem 0 0"><strong>Tu puesto en la lista</strong> (más arriba = mejor)</div>${a}` : "")
       + (b ? `<div class="note" style="margin:.4rem 0 0"><strong>Competidores por delante</strong> (más arriba = menos competidores)</div>${b}` : "");
}
const fmtH = h => h == null ? "Completa" : String(+h).replace(".", ",");
function tarjeta(r, hist, alc, ua) {
  const ini = hist.find(x => x.tipo === "inicio_curso"), d = r.delante || {}, mae = r.cuerpo === "maestros";
  const TEMA = { 1: ["ok", "ok", "🎉", "¡Tienes plaza!"], 2: ["amb", "amb", "⏳", "Sigues compitiendo"], 3: ["blu", "blu", "📋", "Sigues en la lista"], 4: ["red", "red", "⚠️", "No confirmaste a tiempo"], 5: ["gry", "gry", "⏸️", "Desactivado en esta bolsa"] };
  const [cv, , ico, titulo] = TEMA[r.estado] || TEMA[3];
  const vars = `--c:var(--${cv});--cb:var(--${cv}-bg)`;
  const cab = `<div class="sc-h"><b>${esc(tituloLista(r))}</b><span>${esc(cuerpoNombre(r.cuerpo))} · lista del ${fmtF(r.fecha)}</span></div>`;
  const st = (sub) => `<div class="sc-st"><i>${ico}</i><div>${titulo}<small>${esc(sub)}</small></div></div>`;
  if (r.estado === 1) {
    const a = hist[0] || {};
    return `<div class="sc" style="${vars}">${cab}${st(EST_TXT[1])}<div class="sc-b"><p style="margin:.2rem 0;font-size:1.05rem">${a.centro ? `<strong>${esc(a.centro)}</strong> (${esc(a.localidad || "")})` : "Plaza adjudicada"}${a.plaza_tipo ? " · " + (a.plaza_tipo === "vacante" ? "Vacante" : "Sustitución") : ""}</p>${charts(hist)}</div></div>`;
  }
  if (r.estado === 5) return `<div class="sc" style="${vars}">${cab}${st("Estás desactivado en esta bolsa")}<div class="sc-b"><p class="note">Tu puesto en la lista sigue siendo el <strong>${r.posicion}</strong>, aunque al estar desactivado no participas en la adjudicación.</p>${charts(hist)}</div></div>`;
  const cambio = ini && ini.posicion !== r.posicion ? ini.posicion - r.posicion : null;
  const otras = [[d["1"], "ya adjudicados"], [d["3"], "no pidieron estas plazas"], [d["4"], "no confirmaron a tiempo"]].filter(x => x[0]).map(x => `${x[0]} ${x[1]}`).join(" · ");
  const ausente = r.fecha < r.ult_tanda ? `<p class="note">Tu bolsa no aparece en las listas posteriores al ${fmtF(r.fecha)}: no hubo plazas ofertadas en ella (o ya tienes plaza en otra bolsa).</p>` : "";
  const k = `<div class="sc-k">
    <div><small>Tu puesto</small><b>${r.posicion}</b>${r.sub ? `<span class="note" style="margin:0">${r.sub} entre quienes participan</span>` : ""}</div>
    ${ini ? `<div><small>Inicio de curso</small><b>${ini.posicion}</b>${cambio !== null ? `<em class="${cambio > 0 ? "" : "dn"}">${cambio > 0 ? "↑ subes " + cambio : "↓ bajas " + (-cambio)} puestos</em>` : ""}</div>` : ""}
    <div><small>Competidores por delante</small><b>${r.x}</b></div></div>`;
  let prob = "";
  if (!mae && r.p_tanda !== null && r.p_tanda !== undefined) {
    const p1 = Number(r.p_tanda), p3 = acum(p1, 3), nv = nivel(p3);
    const pc = p3 < 0.15 ? "red" : p3 < 0.30 ? "amb" : "ok";
    prob = `<div class="sc-p" style="--pc:var(--${pc});--pb:var(--${pc}-bg)"><div class="t">Probabilidad de conseguir plaza</div><div class="v">${nv} · ${pct(p3)}</div><div class="bar"><i style="width:${Math.max(3, Math.round(p3 * 100))}%"></i></div><div class="d">En las <strong>3 próximas tandas</strong> (${pct(p1)} en la próxima).</div>${cuandoTxt(r, p1)}</div>`;
  }
  const act = mae
    ? `La lista de Maestros ha adjudicado ${r.adj_total} plazas en ${r.tandas} tandas (todas las especialidades).`
    : `Tu bolsa ha ofrecido ${r.adj_total} plaza${r.adj_total === 1 ? "" : "s"} en ${r.tandas_con_adj} de ${r.tandas} tandas (media de ${(r.adj_total / (r.tandas || 1)).toFixed(1)} por tanda; ${r.act} en las 3 últimas).`;
  const nReal = 1 + Object.values(d).reduce((t, v) => t + (+v || 0), 0);
  const uaTxt = ua && !mae && ua.pos_ult ? ` Último adjudicado de tu bolsa (${fmtF(ua.fecha)}): puesto <strong>${ua.pos_ult}</strong>. ${r.posicion > ua.pos_ult ? `Te separan <strong>${r.posicion - ua.pos_ult}</strong> puesto${r.posicion - ua.pos_ult === 1 ? "" : "s"}.` : "Tu puesto ya entra en la zona donde se está adjudicando."}` : "";
  const real = `<p class="note">Tu puesto en la bolsa es el <strong>${r.posicion}</strong>. Sin contar a los desactivados, eres el <strong>${nReal}º</strong> de los disponibles en esta lista.${uaTxt}</p>`;
  let al = "";
  if (mae) {
    al = alc && alc.length ? `<div class="sc-p" style="--pc:var(--blu);--pb:var(--blu-bg)"><div class="t">Hasta dónde se llega en tus especialidades</div><ul class="l" style="margin:.4rem 0 0">${alc.map(a => {
      const rt = a.tandas ? a.tandas_alcanzado / a.tandas : 0, lv = rt >= 5 / 6 ? "Alcance alto" : rt >= 0.5 ? "Alcance medio" : rt > 0 ? "Alcance bajo" : "Alcance muy bajo";
      return `<li><span class="tag">${lv}</span> <strong>${esc(a.especialidad_codigo)} · ${esc(a.especialidad)}</strong>: ${a.adj_total} adjudicaciones en las últimas ${a.tandas} tandas. La última llegó hasta alguien con ${a.x_max_ultima ?? "—"} competidores por delante (tú tienes ${a.x_mio}); en ${a.tandas_alcanzado} de ${a.tandas} tandas se llegó tan lejos como tú.</li>`;
    }).join("")}</ul></div>` : '<p class="note" style="padding:0 1rem">Elige abajo tus especialidades de Maestros para ver hasta dónde se llega en cada una.</p>';
  }
  return `<div class="sc" style="${vars}">${cab}${st(EST_TXT[r.estado] || "")}${k}${prob}${al}<div class="sc-b">${otras ? `<p class="note">Por delante de ti: ${r.x} compiten (pidieron plazas ofertadas y no las consiguieron) · ${otras}.</p>` : ""}${ausente}${real}<p class="note">${esc(act)}</p>${charts(hist)}</div></div>`;
}

/* ---------- Ficha del centro ---------- */
const CF_TIPO = [[/^CEIP|^CEE?IP|^CP /i, "Colegio de Infantil y Primaria"], [/^CRA/i, "Colegio Rural Agrupado (varias localidades)"], [/^CEE/i, "Centro de Educación Especial"], [/^IES/i, "Instituto de Educación Secundaria"],
  [/^CIPFP|^CIFP/i, "Centro Integrado de Formación Profesional"], [/^EOI/i, "Escuela Oficial de Idiomas"], [/^CFPA|^FPA/i, "Formación de Personas Adultas"], [/^CONSERVATORI|^CMP|^CPM|^CSM/i, "Conservatorio"], [/^EA |^EASD|^ESCOLA D'ART/i, "Escuela de Arte"], [/^SPE|^SERVEI/i, "Servicio psicopedagógico"]];
const cfTipo = n => (CF_TIPO.find(([re]) => re.test(n || "")) || [null, ""])[1];
async function fichaAbrir(cod) {
  const dlg = $("cf-dlg"), b = $("cf-b"); $("cf-t").textContent = "Centro"; b.innerHTML = '<p class="note">Cargando…</p>';
  if (!dlg.open) dlg.showModal();
  let f = null;
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/ficha_centro", { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_codigo: cod }) });
    if (r.ok) f = await r.json();
  } catch (e) {}
  if (!f) { b.innerHTML = '<p class="note">No hemos podido cargar la ficha de este centro.</p>'; return; }
  CEN[cod] = CEN[cod] || { codigo: cod, nombre: f.nombre, localidad: f.localidad, provincia: f.provincia, lat: f.lat, lon: f.lon, direccion: f.direccion, cp: f.cp };
  const j = JINFO[cod], tipo = cfTipo(f.nombre), mae = /^(CEIP|CRA|CEE|CP )/i.test(f.nombre || "");
  const dir = [f.direccion, [f.cp, f.localidad].filter(Boolean).join(" "), f.provincia].filter(Boolean).join(", ");
  $("cf-t").textContent = f.nombre;
  b.innerHTML = `<p style="margin:.3rem 0">${tipo ? `<span class="tag" style="background:var(--gry-bg);color:var(--ink)">${esc(tipo)}</span> ` : ""}${j && mae && j[0] ? `<span class="tag">${j[0] === "C" ? "🕘 Jornada completa" : "🕑 Jornada partida"}</span> ` : ""}<span class="note">Código ${esc(cod)}</span></p>
    <p style="margin:.3rem 0">📍 ${esc(dir || f.localidad || "")}</p>
    ${distLinea(cod)}
    <div class="filters" style="margin:.4rem 0">${j && /^https?:\/\//.test(j[1] || "") ? `<a class="btn" href="${esc(j[1])}" target="_blank" rel="noopener" style="text-decoration:none">🌐 Web del centro</a>` : ""}<a class="btn" style="text-decoration:none;background:var(--surface);color:var(--accent);border:2px solid var(--accent)" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([f.nombre, dir].filter(Boolean).join(", "))}" target="_blank" rel="noopener">🗺️ Ver en el mapa</a></div>
    <h3 style="margin:.9rem 0 .2rem;font:600 1rem var(--body)">Este curso (desde el ${fmtF(f.desde)})</h3>
    <div class="cf-k"><div><b>${f.ofertadas}</b><small>plazas ofertadas${f.ofertadas ? ` (${f.ofertadas_vac} vacante${f.ofertadas_vac === 1 ? "" : "s"})` : ""}</small></div><div><b>${f.continuas}</b><small>adjudicadas en continuas</small></div><div><b>${f.inicio_curso}</b><small>adjudicadas al inicio de curso</small></div>${f.dificil ? `<div><b>${f.dificil}</b><small>de difícil cobertura</small></div>` : ""}</div>
    ${f.ult_oferta || f.ult_continua ? `<p class="note" style="margin:.2rem 0">${f.ult_oferta ? `Última oferta: ${fmtF(f.ult_oferta)}. ` : ""}${f.ult_continua ? `Última adjudicación continua: ${fmtF(f.ult_continua)}.` : ""}</p>` : ""}
    ${(f.especialidades || []).length ? `<p style="margin:.6rem 0 .2rem"><strong>Especialidades con más movimiento</strong></p><ul class="l" style="margin:0">${f.especialidades.map(e => `<li>${esc(e.codigo)} · ${esc(e.nombre)} <span class="note">(${e.n})</span></li>`).join("")}</ul>` : '<p class="note">Este curso todavía no ha tenido plazas ofertadas ni adjudicadas.</p>'}
    <p class="note" style="margin:.8rem 0 0">Datos de los listados oficiales de la Conselleria cargados en DocentsCV. Para el teléfono y el horario exacto, consulta la web del centro o llámales.</p>`;
}
document.addEventListener("click", ev => { const b = ev.target.closest("[data-ficha]"); if (!b) return; ev.preventDefault(); ev.stopPropagation(); fichaAbrir(b.dataset.ficha); });
$("cf-x").onclick = () => $("cf-dlg").close();
$("cf-dlg").addEventListener("click", ev => { if (ev.target === $("cf-dlg")) $("cf-dlg").close(); });

/* ---------- «Actualizado hace…» ---------- */
function haceTxt(ts) {
  const m = Math.round((Date.now() - new Date(ts)) / 60000);
  return m < 2 ? "hace un momento" : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} día${Math.round(m / 1440) === 1 ? "" : "s"}`;
}
async function frescura() {
  let u = null;
  try { const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/ultima_actualizacion", { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" }, body: "{}" }); if (r.ok) u = await r.json(); } catch (e) {}
  if (!u || !u.cargado) return;
  const ult = [u.ofertas && `plazas ofertadas del ${fmtF(u.ofertas)}`, u.continua && `adjudicación continua del ${fmtF(u.continua)}`].filter(Boolean).join(" · ");
  const txt = `🔄 Revisamos los listados oficiales automáticamente varias veces al día. Última carga: <strong>${haceTxt(u.cargado)}</strong>${ult ? ` (${ult})` : ""}. <a href="https://ceice.gva.es/es/web/rrhh-educacion" target="_blank" rel="noopener">Listados oficiales ↗</a>`;
  ["fresh-home", "fresh-cons"].forEach(id => { const el = $(id); if (el) el.innerHTML = txt; });
}
frescura(); setInterval(frescura, 5 * 60000);

/* ---------- Simulador de petición ---------- */
let SPX = null;
function spxPintar(pan, por) {
  const panel = $("spx-panel"); SPX = { pan: pan.filter(r => r.estado !== 1 && r.estado !== 5), por };
  if (!SPX.pan.some(r => (por[r.lista_id] || []).some(o => o.mi_posicion != null))) { panel.hidden = true; return; }
  panel.hidden = false;
  $("spx-f").innerHTML = ["Alicante", "Castelló", "València"].map(p => `<label class="chk" style="margin:0"><input type="checkbox" data-spx-p="${p}" checked><span>${p}</span></label>`).join("")
    + (DOM ? `<label>Hasta <select id="spx-km"><option value="0">cualquier distancia</option><option>20</option><option>30</option><option>50</option><option>75</option><option>100</option><option>150</option></select> km de casa</label>` : `<span class="note">Guarda tu domicilio en Ajustes para simular también por distancia.</span>`);
  $("spx-f").querySelectorAll("input,select").forEach(x => x.onchange = spxCalc);
  spxCalc();
}
function spxCalc() {
  if (!SPX) return;
  const provs = [...document.querySelectorAll("[data-spx-p]")].filter(x => x.checked).map(x => x.dataset.spxP), km = +(($("spx-km") || {}).value || 0);
  const pasa = (o, ps, k) => (!ps || ps.includes(o.provincia)) && (!k || ((distInfo(o.centro_codigo) || { km: 1e9 }).km <= k));
  const fila = (lab, rows, N, ps, k) => { const t = new Set(rows.filter(o => pasa(o, ps, k)).map(o => o.fecha)).size; return `<tr><td>${lab}</td><td class="n"><strong>${t}</strong> de ${N}</td><td class="n"><strong>${Math.round(100 * t / (N || 1))} %</strong></td></tr>`; };
  $("spx-body").innerHTML = SPX.pan.map(r => {
    const rows = (SPX.por[r.lista_id] || []).filter(o => o.mi_posicion != null && o.mi_posicion < o.posicion_adj);
    const N = Math.min(12, r.tandas || new Set((SPX.por[r.lista_id] || []).map(o => o.fecha)).size || 1);
    const todas = (SPX.por[r.lista_id] || []).some(o => o.mi_posicion != null);
    if (!todas) return "";
    return `<h3 style="margin:.8rem 0 .3rem;font:600 1rem var(--body)">${esc(tituloLista(r))}</h3>
      <div class="scroll"><table id="spx-tab"><thead><tr><th>Si hubieras pedido…</th><th class="n">Tandas con plaza para ti</th><th class="n">Por tanda</th></tr></thead><tbody>
      ${fila("<strong>Tu selección</strong>" + (km ? ` (hasta ${km} km)` : ""), rows, N, provs, km)}
      ${fila("Toda la Comunitat", rows, N, null, 0)}
      ${["Alicante", "Castelló", "València"].map(p => fila("Solo " + p, rows, N, [p], 0)).join("")}
      </tbody></table></div>`;
  }).join("") || '<p class="note">Todavía no hay tandas con datos suficientes para simular.</p>';
}

async function oportunidades(pan, espMia) {
  await cargarOfertas();
  const { data, error } = await sb.rpc("mi_oportunidades");
  if (error) { $("oport-body").innerHTML = `<p class="err">${esc(error.message)}</p>`; return; }
  if (DOM) { try { await cargarCentros((data || []).map(o => o.centro_codigo)); } catch (e) {} }
  const por = {}; (data || []).forEach(o => (por[o.lista_id] ||= []).push(o));
  let html = "";
  pan.forEach(r => {
    const rows = por[r.lista_id] || [];
    const ofe = ofertaVigente() ? OFER.rows.filter(o => r.cuerpo === "maestros" ? (o.cuerpo === "maestros" && (espMia || []).includes(o.especialidad_codigo)) : (o.cuerpo === r.cuerpo && o.especialidad_codigo === r.bolsa)) : [];
    html += `<div style="margin:0 0 1.4rem"><h3 style="margin:0 0 .3rem;font:600 1rem var(--body)">${esc(tituloLista(r))}</h3>`;
    if (!rows.length && !ofe.length) { html += `<p class="note">${r.cuerpo === "maestros" ? "Elige abajo tus especialidades de Maestros para ver oportunidades." : "Todavía no ha habido adjudicaciones en esta bolsa."}</p></div>`; return; }
    const conDato = rows.filter(o => o.mi_posicion != null), K = conDato.filter(o => o.mi_posicion < o.posicion_adj).length, tandas = new Set(rows.map(o => o.fecha)).size;
    html += `<p style="margin:.2rem 0 .6rem">En las últimas ${tandas} tanda${tandas === 1 ? "" : "s"} se adjudicaron <strong>${rows.length}</strong> plaza${rows.length === 1 ? "" : "s"} en esta bolsa${r.cuerpo === "maestros" ? " (de tus especialidades)" : ""}. ` +
      (conDato.length ? `En las ${conDato.length} de ellas en las que apareces en la lista, tú ibas por delante de la persona adjudicada en <strong>${K}</strong> (${Math.round(100 * K / conDato.length)} %).` : "No apareces en esas listas (puede que ya tengas plaza), así que no hay comparación posible.") + `</p>`;
    const ultima = rows.length ? rows[0].fecha : "", cen = new Map(), ofCod = new Map();
    ofe.forEach(o => { if (!ofCod.has(o.centro_codigo)) ofCod.set(o.centro_codigo, { n: o.centro || o.centro_codigo, l: o.localidad || "", k: 0 }); ofCod.get(o.centro_codigo).k++; });
    rows.forEach(o => { if (!cen.has(o.centro_codigo)) cen.set(o.centro_codigo, { n: o.centro || o.centro_codigo, l: o.localidad || "", u: o.fecha === ultima }); });
    const optO = [...ofCod].sort(distCmp).map(([k, c]) => `<option value="${esc(k)}">${esc(c.l)} · ${esc(c.n)}${c.k > 1 ? " (" + c.k + " plazas)" : ""}${esc(distTxt(k))}</option>`).join("");
    const opt = u => [...cen].filter(([k, c]) => c.u === u && !ofCod.has(k)).sort(distCmp).map(([k, c]) => `<option value="${esc(k)}">${esc(c.l)} · ${esc(c.n)}${esc(distTxt(k))}</option>`).join("");
    html += `<label>Centro<select data-lista="${r.lista_id}" style="max-width:100%"><option value="">Elige un centro…</option>${optO ? `<optgroup label="📣 Se ofertan en la próxima adjudicación (${fmtF(OFER.fecha)})">${optO}</optgroup>` : ""}<optgroup label="Última tanda con plazas (${fmtF(ultima)})">${opt(true)}</optgroup><optgroup label="Tandas anteriores">${opt(false)}</optgroup></select></label><div id="op-res-${r.lista_id}" style="margin-top:.6rem"></div></div>`;
  });
  $("oport-body").innerHTML = html;
  wowPintar(pan, espMia, por);
  try { spxPintar(pan, por); } catch (e) {}
  $("oport-body").querySelectorAll("select").forEach(sel => sel.onchange = () => {
    const out = $("op-res-" + sel.dataset.lista), rows = (por[sel.dataset.lista] || []).filter(o => o.centro_codigo === sel.value);
    const esMae = (pan.find(x => String(x.lista_id) === sel.dataset.lista) || {}).cuerpo === "maestros";
    if (!sel.value) { out.innerHTML = ""; return; }
    const rp = pan.find(x => String(x.lista_id) === sel.dataset.lista) || {};
    const ofC = ofertaVigente() ? OFER.rows.filter(o => o.centro_codigo === sel.value && (rp.cuerpo === "maestros" ? (o.cuerpo === "maestros" && (espMia || []).includes(o.especialidad_codigo)) : (o.cuerpo === rp.cuerpo && o.especialidad_codigo === rp.bolsa))) : [];
    const bannerO = ofC.length ? `<div class="op-b go" style="--c:var(--amb);--cb:var(--amb-bg)" role="status"><div class="k">📣 Se ofertan en este centro</div><div class="h">${ofC.length === 1 ? "1 plaza" : ofC.length + " plazas"} en la próxima adjudicación (${fmtF(OFER.fecha)})</div>${ofC.map(o => `<p><strong>${esc(plazaTipo(o))}</strong>${rp.cuerpo === "maestros" ? " · esp. " + esc(o.especialidad_codigo) : ""}${o.req_ling ? " · " + esc(plazaIng(o)) : ""}${o.iti ? " · Itinerante" + (sitios(o).length > 1 ? " (" + sitios(o).length + " centros)" : "") : ""}${reducida(o) ? " · Jornada reducida (" + fmtH(o.horas) + " h)" : ""}${obsTxt(o)}</p>`).join("")}</div>` : "";
    const K = rows.filter(o => o.mi_posicion != null && o.mi_posicion < o.posicion_adj).length;
    const dato = rows.filter(o => o.mi_posicion != null), N = dato.length, ult = dato[0];
    let cartel = "";
    if (N && K > 0) cartel = `<div class="op-b go" style="--c:var(--ok);--cb:var(--ok-bg)" role="status"><div class="k">🎯 Tu oportunidad en este centro</div><div class="h">¡Tenías opción real de conseguir esta plaza!</div><span class="n">${K} de ${N}</span> adjudicaciones en las que ibas <strong>por delante</strong> de la persona que se la llevó.<p>Si este centro vuelve a ofertar una plaza parecida, <strong>podría ser para ti</strong>. Estate atento a la próxima tanda.</p></div>`;
    else if (N) {
      const gap = ult.mi_posicion - ult.posicion_adj, cerca = gap / ult.mi_posicion < 0.15;
      cartel = cerca
        ? `<div class="op-b go" style="--c:var(--amb);--cb:var(--amb-bg)" role="status"><div class="k">🔥 Tu oportunidad en este centro</div><div class="h">¡Estás muy cerca!</div><span class="n">${gap}</span> puestos te separaron de la última persona adjudicada aquí (${fmtF(ult.fecha)}).<p>Con unas pocas tandas más, <strong>podrías alcanzarla</strong>.</p></div>`
        : `<div class="op-b" style="--c:var(--blu);--cb:var(--blu-bg)" role="status"><div class="k">📍 Tu oportunidad en este centro</div><div class="h">Todavía lejos por ahora</div><span class="n">${gap}</span> puestos te separaron de la última persona adjudicada aquí (${fmtF(ult.fecha)}).<p>Las listas avanzan en cada tanda: vuelve a mirar tras las próximas adjudicaciones.</p></div>`;
    }
    if (!cartel && ofC.length) {
      const ref = (por[sel.dataset.lista] || []).filter(o => rp.cuerpo !== "maestros" || ofC.some(x => x.especialidad_codigo === o.especialidad_codigo));
      const f0 = ref.map(o => o.fecha).sort().pop(), top = f0 ? Math.max(...ref.filter(o => o.fecha === f0).map(o => o.posicion_adj)) : null;
      if (top) { const gap = rp.posicion - top;
        cartel = gap <= 0 ? `<div class="op-b go" style="--c:var(--ok);--cb:var(--ok-bg)" role="status"><div class="k">🎯 Tu oportunidad</div><div class="h">¡Estás dentro del alcance!</div>En la última tanda con adjudicaciones en tu bolsa (${fmtF(f0)}) se llegó hasta la posición <strong>${top}</strong>. Tú estás en la <strong>${rp.posicion}</strong>.</div>`
          : `<div class="op-b ${gap / rp.posicion < 0.15 ? "go" : ""}" style="--c:var(--${gap / rp.posicion < 0.15 ? "amb" : "blu"});--cb:var(--${gap / rp.posicion < 0.15 ? "amb" : "blu"}-bg)" role="status"><div class="k">📍 Tu oportunidad</div><div class="h">${gap / rp.posicion < 0.15 ? "¡Estás muy cerca!" : "Todavía lejos por ahora"}</div><span class="n">${gap}</span> puestos te separan de hasta donde se llegó en la última tanda (posición ${top}, ${fmtF(f0)}).</div>`; }
    }
    out.innerHTML = distLinea(sel.value) + bannerO + cartel + (!rows.length ? "" : `<p class="note" style="margin:0 0 .4rem">Este centro ha adjudicado ${rows.length} plaza${rows.length === 1 ? "" : "s"} en esta bolsa en las últimas tandas; en ${K} tú ibas por delante.</p>
      <div class="scroll"><table><thead><tr><th>Fecha</th><th>Plaza</th><th class="n">Puesto del adjudicado</th><th class="n">Tu puesto ese día</th><th>Resultado</th></tr></thead><tbody>${rows.map(o => {
        const res = o.mi_posicion == null ? "Sin dato" : o.mi_posicion < o.posicion_adj ? `<span class="tag">Ibas por delante</span> (${o.posicion_adj - o.mi_posicion} puestos)` : o.mi_posicion === o.posicion_adj ? "Eras tú" : `Iba por delante de ti (${o.mi_posicion - o.posicion_adj} puestos)`;
        return `<tr><td>${fmtF(o.fecha)}</td><td>${o.plaza_tipo === "vacante" ? "Vacante" : "Sustitución"}${o.especialidad_codigo && esMae ? " · esp. " + esc(o.especialidad_codigo) : ""}</td><td class="n">${o.posicion_adj}</td><td class="n">${o.mi_posicion ?? "—"}</td><td>${res}</td></tr>`;
      }).join("")}</tbody></table></div>`);
  });
}

function wowPintar(pan, espMia, por) {
  const box = $("wow"); box.hidden = true; box.className = "wow";
  if (!ofertaVigente()) return;
  const C = [];
  pan.forEach(r => {
    const ofe = OFER.rows.filter(o => r.cuerpo === "maestros" ? (o.cuerpo === "maestros" && (espMia || []).includes(o.especialidad_codigo)) : (o.cuerpo === r.cuerpo && o.especialidad_codigo === r.bolsa));
    if (!ofe.length) return;
    const cen = new Map(); ofe.forEach(o => { const c = cen.get(o.centro_codigo) || { n: o.centro || o.centro_codigo, l: o.localidad || "", k: 0, esp: new Set() }; c.k++; c.esp.add(o.especialidad_codigo); cen.set(o.centro_codigo, c); });
    const hist = por[r.lista_id] || [];
    const ref = hist.filter(o => r.cuerpo !== "maestros" || ofe.some(x => x.especialidad_codigo === o.especialidad_codigo));
    const f0 = ref.map(o => o.fecha).sort().pop(), top = f0 ? Math.max(...ref.filter(o => o.fecha === f0).map(o => o.posicion_adj)) : null;
    cen.forEach((c, cod) => {
      const rows = hist.filter(o => o.centro_codigo === cod && o.mi_posicion != null), N = rows.length, K = rows.filter(o => o.mi_posicion < o.posicion_adj).length;
      const it = { r, cod, c };
      if (N && K > 0) Object.assign(it, { tipo: "real", score: 3 + K / N, txt: `Ibas por delante en ${K} de ${N} adjudicaci${N === 1 ? 'ón' : 'ones'} de este centro` });
      else if (top != null) {
        const gap = r.posicion - top;
        if (gap <= 0) Object.assign(it, { tipo: "real", score: 2.5, txt: `Dentro del alcance: en la última tanda se llegó hasta la posición ${top} y tú estás en la ${r.posicion}` });
        else if (gap / r.posicion < 0.15) Object.assign(it, { tipo: "cerca", score: 1 + 1 / gap, txt: `A ${gap} puestos de la última persona adjudicada en tu bolsa` });
        else Object.assign(it, { tipo: "lejos", score: 0, txt: `Todavía lejos por ahora (${gap} puestos)` });
      } else Object.assign(it, { tipo: "lejos", score: 0, txt: "Plaza ofertada en tu bolsa" });
      C.push(it);
    });
  });
  if (!C.length) return;
  C.sort((a, b) => b.score - a.score);
  const reales = C.filter(x => x.tipo === "real"), cercas = C.filter(x => x.tipo === "cerca");
  const np = L => L.reduce((s, x) => s + x.c.k, 0), pl = n => n + " plaza" + (n === 1 ? "" : "s");
  let k, h, cls = "";
  if (reales.length) { k = "🎯 Tu mejor oportunidad ahora"; h = `Tienes opción real en ${pl(np(reales))} de la próxima adjudicación`; }
  else if (cercas.length) { k = "🔥 Estás muy cerca"; h = `Estás muy cerca en ${pl(np(cercas))} que se ofertan el ${fmtF(OFER.fecha)}`; cls = " cerca"; }
  else { k = "📣 Plazas ofertadas en tus bolsas"; h = `Se ofertan ${pl(np(C))} en tus bolsas el ${fmtF(OFER.fecha)}`; cls = " lejos"; }
  box.className = "wow" + cls;
  box.innerHTML = `<div class="k">${k}</div><div class="h">${esc(h)}</div>` + C.slice(0, 3).map((x, i) => `<button class="li" data-i="${i}"><span><b>${esc(x.c.l)} · ${esc(x.c.n)}${x.c.k > 1 ? " (" + x.c.k + " plazas)" : ""}</b><small>${esc(x.txt)}${esc(distTxt(x.cod))}</small></span><span class="go">›</span></button>`).join("") + '<small style="display:block;margin-top:.6rem;opacity:.85">Orientativo: se basa en quién se llevó plazas de estos centros en tandas anteriores. No garantiza ninguna plaza.</small>';
  box.hidden = false;
  box.querySelectorAll(".li").forEach(b => b.onclick = () => {
    const x = C[+b.dataset.i], sel = $("oport-body").querySelector(`select[data-lista="${x.r.lista_id}"]`); if (!sel) return;
    sel.value = x.cod; sel.dispatchEvent(new Event("change")); $("oport-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// Paso 2 del registro: ¿a qué especialidades de Maestros puedes optar? (la lista de Maestros es única y no las indica)
async function pedirEsp(forzar) {
  let hayMae = false, esp = null;
  try { hayMae = ((await sb.rpc("mi_panorama")).data || []).some(r => r.cuerpo === "maestros"); } catch (e) {}
  try { esp = ((await sb.from("perfiles").select("esp_maestros").eq("id", USER.id).maybeSingle()).data || {}).esp_maestros; } catch (e) {}
  if (!forzar && (!hayMae || (esp && esp.length))) return renderApartado();
  $("analisis").hidden = true;
  $("perfil").innerHTML = `<h2>¿A qué especialidades puedes optar?</h2><p style="margin:0 0 .75rem">Estás en la lista única de Maestros, que no indica especialidad. <strong>Puedes marcar varias</strong> (por ejemplo Infantil y Primaria): marca <strong>todas las que tengas</strong> y te mostramos hasta dónde se llega en cada una. Si te equivocas, podrás pedir el cambio con el botón «✏️ Pedir cambio de especialidad» de tu apartado.</p>
    <div id="pe-list" class="filters">${ESPU.filter(e => e.cuerpo === "maestros").map(e => `<label style="flex-direction:row;align-items:center;gap:.4rem"><input type="checkbox" value="${esc(e.codigo)}" style="min-width:0"> ${esc(e.codigo)} · ${esc(e.nombre)}</label>`).join("")}</div>
    <p class="note" id="pe-msg" role="status"></p><button class="btn" id="pe-ok">Guardar y continuar</button>`;
  const pec = () => { const n = $("pe-list").querySelectorAll("input:checked").length; $("pe-msg").textContent = n ? "Has marcado " + n + " especialidad" + (n === 1 ? "" : "es") + "." : ""; };
  $("pe-list").addEventListener("change", pec);
  $("pe-ok").onclick = async () => {
    const sel = [...$("pe-list").querySelectorAll("input:checked")].map(i => i.value);
    if (!sel.length) { $("pe-msg").textContent = "Marca al menos una especialidad."; return; }
    const { error } = await sb.from("perfiles").upsert({ id: USER.id, esp_maestros: sel });
    if (error) { $("pe-msg").textContent = "No se pudo guardar: " + error.message; return; }
    renderApartado();
  };
}

const EP_FAM = [["secundaria", "Secundaria"], ["fp_especialistas", "FP · profesorado especialista"], ["idiomas", "Escuelas Oficiales de Idiomas"], ["catedraticos_musica", "Catedráticos de Música"], ["musica", "Música y Artes Escénicas"], ["artes_plasticas", "Artes Plásticas y Diseño"], ["taller_artes", "Maestros de Taller"]];
function espPedir(actual, prof = [], adm = null, profListas = []) {
  actual = actual || []; prof = prof || []; profListas = adm ? (profListas || []) : [];
  const chk = (e, on) => { const fija = profListas.includes(e.codigo); return `<label style="display:flex;flex-direction:row;align-items:center;gap:.4rem;margin:.15rem 0;font-size:.92rem"${fija ? ' title="Sale en las listas oficiales: no se puede quitar"' : ""}><input type="checkbox" value="${esc(e.codigo)}" ${on || fija ? "checked" : ""} ${fija ? "disabled data-fija" : ""} style="min-width:0;width:1.05rem;height:1.05rem;flex:none;margin:0"> ${esc(e.codigo)} · ${esc(e.nombre)}${fija ? ' <span class="note">(listas)</span>' : ""}</label>`; };
  const mae = ESPU.filter(e => e.cuerpo === "maestros");
  const profEsp = EP_FAM.map(([f, nom]) => { const L = ESPU.filter(e => e.cuerpo === f); return L.length ? `<div data-epfam style="margin:.5rem 0 0"><b style="font-size:.85rem;color:var(--muted)">${nom}</b><div class="ep-cols">${L.map(e => chk(e, prof.includes(e.codigo))).join("")}</div></div>` : ""; }).join("");
  const busc = id => `<input id="${id}" type="search" placeholder="Buscar especialidad (nombre o código)" autocomplete="off" style="width:100%;margin:.2rem 0 .3rem">`;
  const caja = "border:1px solid var(--line);border-radius:.7rem;padding:.2rem .8rem;margin:0 0 .6rem";
  const sum = "cursor:pointer;font-weight:700;padding:.5rem 0";
  $("ep-list").innerHTML = `
    <details id="ep-m" style="${caja}"><summary style="${sum}">👩‍🏫 Maestros <span class="note" data-cnt></span></summary>
      ${busc("ep-qm")}<div id="ep-ml" style="max-height:16rem;overflow:auto;padding-bottom:.4rem"><div data-epfam><div class="ep-cols">${mae.map(e => chk(e, actual.includes(e.codigo))).join("")}</div></div></div></details>
    <details id="ep-p" style="${caja}"><summary style="${sum}">🎓 Profesorado (Secundaria, FP, Idiomas, Artes…) <span class="note" data-cnt></span></summary>
      <p class="note" style="margin:0 0 .3rem">Tus bolsas de profesorado salen de las listas oficiales. Si falta o sobra alguna, márcalo bien aquí y lo revisamos.</p>
      ${busc("ep-q")}<div id="ep-pl" style="max-height:16rem;overflow:auto;padding-bottom:.4rem">${profEsp}</div></details>`;
  const filtro = (inp, lista) => { $(inp).oninput = () => { const q = $(inp).value.trim().toLowerCase();
    $(lista).querySelectorAll("label").forEach(l => l.hidden = !!q && !l.textContent.toLowerCase().includes(q));
    $(lista).querySelectorAll("[data-epfam]").forEach(g => g.hidden = ![...g.querySelectorAll("label")].some(l => !l.hidden)); }; };
  filtro("ep-qm", "ep-ml"); filtro("ep-q", "ep-pl");
  const cuenta = () => ["ep-m", "ep-p"].forEach(id => { const n = $(id).querySelectorAll("input:checked").length; $(id).querySelector("[data-cnt]").textContent = n ? `· ${n} marcada${n === 1 ? "" : "s"}` : ""; });
  $("ep-list").onchange = cuenta; cuenta();
  $("esp-dlg").querySelector("h2").textContent = adm ? "✏️ Especialidades de " + adm : "✏️ Pedir cambio de especialidad";
  $("ep-nota").closest("label").hidden = !!adm; $("ep-form").querySelector("p.note").innerHTML = adm ? "Cambia sus especialidades y pulsa <strong>Guardar</strong>: se aplica al momento." : "Marca <strong>todas</strong> las especialidades que tengas, en Maestros y/o en Profesorado. Se lo enviamos a administración y te las cambiamos."; $("ep-send").textContent = adm ? "Guardar" : "Enviar petición";
  const ayudaP = $("ep-p").querySelector("p.note"); ayudaP.textContent = adm ? "Las marcadas como «(listas)» salen de las listas oficiales y no se pueden quitar. Las que añadas cuentan para sus avisos (plazas ofertadas, cerca de casa, resumen); su puesto saldrá cuando aparezca en una lista." : "Tus bolsas de profesorado salen de las listas oficiales. Si falta o sobra alguna, márcalo bien aquí y lo revisamos.";
  $("ep-st").textContent = ""; $("ep-nota").value = ""; $("ep-send").disabled = false; $("ep-ok").hidden = true; $("ep-form").hidden = false;
  $("ep-send").onclick = adm ? async () => {
    const sel = [...$("ep-m").querySelectorAll("input:checked")].map(i => i.value).sort(), st = $("ep-st");
    const selP = [...$("ep-p").querySelectorAll("input:checked:not([data-fija])")].map(i => i.value).sort();
    $("ep-send").disabled = true; st.textContent = "Guardando…";
    const r1 = await sb.rpc("admin_set_esp_maestros", { p_email: adm, p_esp: sel });
    const r2 = await sb.rpc("admin_set_esp_profesor", { p_email: adm, p_esp: selP });
    $("ep-send").disabled = false;
    const mal = [r1, r2].find(r => r.error || r.data !== "ok");
    if (mal) { st.textContent = mal.error ? "No se pudo (¿has ejecutado especialidades_profesorado.sql?): " + mal.error.message : mal.data === "no_existe" ? "No hay ninguna cuenta con ese correo." : mal.data; return; }
    $("esp-dlg").close(); adminUsuarios(); alert("✅ Guardado para " + adm + "\nMaestros: " + (sel.join(", ") || "ninguna") + "\nProfesorado añadido a mano: " + (selP.join(", ") || "ninguna"));
  } : async () => {
    const selM = [...$("ep-m").querySelectorAll("input:checked")].map(i => i.value).sort(), selP = [...$("ep-p").querySelectorAll("input:checked")].map(i => i.value).sort();
    const actM = [...actual].sort(), actP = [...prof].sort(), st = $("ep-st");
    if (!selM.length && !selP.length) { st.textContent = "Marca al menos una especialidad."; return; }
    const camM = selM.join() !== actM.join(), camP = selP.join() !== actP.join();
    if (!camM && !camP) { st.textContent = "No has cambiado ninguna. Marca o desmarca las que quieras cambiar."; return; }
    const nota = $("ep-nota").value.trim();
    const txt = "Cambio de especialidades"
      + (camM ? "\nMaestros · actuales: " + (actM.join(", ") || "ninguna") + " · pide: " + (selM.join(", ") || "ninguna") : "")
      + (camP ? "\nProfesorado · actuales: " + (actP.join(", ") || "ninguna") + " · pide: " + (selP.join(", ") || "ninguna") + " (revisar a mano: las bolsas salen de las listas oficiales)" : "")
      + (nota ? "\nNota: " + nota : "")
      + (camM ? "\n[ESP:" + selM.join(",") + "]" : "") + (camP && selP.length ? "\n[PROF:" + selP.join(",") + "]" : "");
    $("ep-send").disabled = true; st.textContent = "Enviando…";
    const { data, error } = await sb.rpc("enviar_mensaje", { p_tipo: "especialidad", p_texto: txt, p_email: null });
    if (!error && data === "ok") { $("ep-form").hidden = true; $("ep-ok").hidden = false; return; }
    st.textContent = data === "limite" ? "Has enviado muchas peticiones seguidas. Inténtalo más tarde." : "No se pudo enviar. Inténtalo de nuevo."; $("ep-send").disabled = false;
  };
  if (!$("esp-dlg").open) $("esp-dlg").showModal();
}
$("ep-x").onclick = $("ep-cerrar").onclick = () => $("esp-dlg").close();

async function situacion() {
  $("s-cards").innerHTML = '<div class="panel">Cargando…</div>'; $("u-body").innerHTML = ""; $("h-body").innerHTML = "";
  const [a, b] = await Promise.all([sb.rpc("mi_situacion"), sb.rpc("mi_panorama")]);
  if ((a.error || b.error || {}).message === "sin_acceso") { pintarAcceso({ cobro_activo: true, activo: false, precio: "4.99" }); $("analisis").hidden = true; return; }
  if (a.error || b.error) { $("s-cards").innerHTML = `<div class="panel err">${esc((a.error || b.error).message)}</div>`; return; }
  const hist = a.data || [], pan = b.data || [];
  const histDe = r => hist.filter(h => h.cuerpo === r.cuerpo && h.bolsa === r.bolsa);   // ya viene de la más reciente a la más antigua
  FREQ = {};
  pan.forEach(r => {   // días medios entre tandas de su grupo este curso: desde la primera tanda continua que aparece en su historial
    const fs = hist.filter(h => h.grupo === r.grupo && h.tipo === "continua").map(h => h.fecha).sort();
    if (fs.length && r.tandas > 1 && r.ult_tanda) { const d = (new Date(r.ult_tanda) - new Date(fs[0])) / 864e5 / (r.tandas - 1); FREQ[r.grupo] = Math.min(14, Math.max(3, d || 7)); }
  });

  // especialidades de Maestros (la lista de Maestros es única y no indica especialidad)
  let esp = [];
  const hayMae = pan.some(r => r.cuerpo === "maestros");
  if (hayMae) {
    try { esp = ((await sb.from("perfiles").select("esp_maestros").eq("id", USER.id).maybeSingle()).data || {}).esp_maestros || []; } catch (e) {}
    $("mae-esp").hidden = true;
  }
  const alc = hayMae && esp.length ? ((await sb.rpc("mi_alcance_maestros")).data || []) : [];

  let UA = []; try { UA = (await sb.rpc("mi_ultimo_adjudicado")).data || []; } catch (e) {}
  $("s-cards").innerHTML = pan.length
    ? pan.map(r => tarjeta(r, histDe(r), r.cuerpo === "maestros" ? alc : null, UA.find(u => u.lista_id === r.lista_id))).join("")
    : '<div class="panel">No hemos encontrado tu nombre en las listas cargadas.</div>';
  oportunidades(pan, esp); difMias(pan, esp);
  const ult = pan.length ? pan.map(r => r.ult_tanda).sort().pop() : null;
  $("s-aviso").textContent = ult ? `Datos hasta la lista de adjudicaciones continuas del ${fmtF(ult)}.` : "";

  // últimas adjudicaciones en tus bolsas (con hasta dónde se llegó, medido en competidores por delante)
  try {
    let html = "";
    for (const r of pan) {
      const mae = r.cuerpo === "maestros", sel = mae ? esp : [];
      html += `<h3 style="margin:1rem 0 .3rem;font:600 1rem var(--body)">${esc(tituloLista(r))}</h3>`;
      if (mae && !sel.length) { html += '<p class="note">Elige abajo tus especialidades de Maestros para ver las adjudicaciones.</p>'; continue; }
      const f = mae ? `&especialidad_codigo=in.(${sel.map(enc).join(",")})` : "";
      const rows = await getJ(`adjudicaciones_continuas?select=instantanea_id,posicion,tipo,horas,centro_codigo,especialidad_codigo,instantaneas(fecha)&lista_id=eq.${r.lista_id}${f}&order=instantanea_id.desc,posicion.desc&limit=400`);
      if (!rows.length) { html += '<p class="note">Todavía no ha habido adjudicaciones continuas en esta bolsa.</p>'; continue; }
      const iid = rows[0].instantanea_id, mias = rows.filter(x => x.instantanea_id === iid), fecha = mias[0].instantaneas.fecha;
      let xmax = null;
      try { xmax = Math.max(...(await getJ(`alcance?select=x_max,especialidad_codigo&instantanea_id=eq.${iid}&lista_id=eq.${r.lista_id}${f}`)).map(x => x.x_max)); } catch (e) {}
      const dentro = xmax !== null && isFinite(xmax) ? (r.estado === 2 || r.estado === 3 || r.estado === 4
        ? (r.x <= xmax ? ` Se llegó a alguien con ${xmax} competidores por delante; tú tienes ${r.x}: <strong>tu puesto quedaba dentro del alcance de esa tanda</strong>.` : ` Se llegó a alguien con ${xmax} competidores por delante; tú tienes ${r.x}: tu puesto quedaba fuera del alcance de esa tanda.`) : "") : "";
      const cen = {}; (await getJ(`centros?select=codigo,nombre,localidad&codigo=in.(${[...new Set(mias.map(x => x.centro_codigo))].map(enc).join(",")})`)).forEach(c => cen[c.codigo] = c);
      html += `<p style="margin:.2rem 0 .5rem"><strong>${mias.length} adjudicaci${mias.length === 1 ? "ón" : "ones"} el ${fmtF(fecha)}</strong> (última tanda con plazas en esta bolsa).${dentro}</p>
        <div class="scroll"><table><thead><tr><th class="n">Posición</th><th>Localidad</th><th>Centro</th><th>Tipo</th></tr></thead><tbody>${mias.slice(0, 8).map(x => { const c = cen[x.centro_codigo] || {}; return `<tr><td class="n">${x.posicion}</td><td>${esc(c.localidad || "")}</td><td>${esc(c.nombre || x.centro_codigo)}</td><td>${x.tipo === "vacante" ? "Vacante" : "Sustitución"}</td></tr>`; }).join("")}</tbody></table></div>${mias.length > 8 ? `<p class="note">Mostrando 8 de ${mias.length}.</p>` : ""}`;
    }
    $("u-body").innerHTML = html;
  } catch (e) { $("u-body").innerHTML = `<p class="err">${esc(e.message)}</p>`; }

  // hasta dónde se llegó otros años (con tu posición de inicio de curso)
  try {
    let h = "";
    for (const r of pan) {
      const ini = histDe(r).find(x => x.tipo === "inicio_curso");
      if (!ini) continue;
      const sel = r.cuerpo === "maestros" ? esp : [r.bolsa];
      for (const e of sel) {
        const li = await estimateHTML(r.cuerpo, e, ini.posicion);
        if (li) h += `<h3 style="margin:1rem 0 .3rem;font:600 1rem var(--body)">${esc(r.cuerpo === "maestros" ? "Maestros · " + e : tituloLista(r))}</h3><ul class="l">${li}</ul>`;
      }
    }
    $("h-body").innerHTML = h || '<p class="note">Sin datos todavía.</p>';
  } catch (e) { $("h-body").innerHTML = ""; }
}
