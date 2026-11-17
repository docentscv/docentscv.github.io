
/* Registro anónimo de errores de la web: qué falló, en qué pantalla y en qué tipo de dispositivo. Sin usuario, sin IP. Máximo 5 por visita. */
(function () {
  const VERSION = "2026-11-12", URL = "https://gwoamxgvnhietzhixjlf.supabase.co/rest/v1/rpc/registrar_error", KEY = "sb_publishable_H2de5fVQpyV-L9y_5K6DpA_ZQ_zQCUl";
  let n = 0; const vistos = new Set();
  const disp = () => { const u = navigator.userAgent || ""; const so = /iPhone|iPad|iPod/i.test(u) || (/Macintosh/i.test(u) && navigator.maxTouchPoints > 1) ? "ios" : /Android/i.test(u) ? "android" : "pc";
    const nav = /EdgA?\//.test(u) ? "edge" : /SamsungBrowser/.test(u) ? "samsung" : /Firefox|FxiOS/.test(u) ? "firefox" : /CriOS|Chrome/.test(u) ? "chrome" : /Safari/.test(u) ? "safari" : "otro";
    let app = ""; try { if (matchMedia("(display-mode: standalone)").matches) app = " · app"; } catch (e) {} return so + " · " + nav + app; };
  const enviar = (msg, fuente, linea) => {
    msg = String(msg || "").slice(0, 300);
    // Ruido de cosas que NO son nuestro código: extensiones, carteras cripto inyectadas (window.ethereum),
    // scripts internos de Firefox para iOS (window.__firefox__), fallos de "in-app browsers", etc.
    if (!msg || n >= 5 || /^Script error\.?$/i.test(msg) || /ResizeObserver loop/i.test(msg) || /extension:\/\//.test(fuente || "") || /iabjs:\/\//.test(fuente || "") || /Java object is gone/i.test(msg) || /\bethereum\b/i.test(msg) || /__firefox__/i.test(msg) || /\bwebkit\b.*messageHandlers/i.test(msg)) return;
    const k = msg + "|" + fuente + "|" + linea; if (vistos.has(k)) return; vistos.add(k); n++;
    let pag = ""; try { pag = (document.querySelector("main.view:not([hidden])") || {}).id || location.hash || "/"; } catch (e) {}
    try { fetch(URL, { method: "POST", keepalive: true, headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_msg: msg, p_fuente: String(fuente || "").replace(/[?#].*$/, ""), p_linea: +linea || 0, p_pagina: pag, p_disp: disp(), p_version: VERSION }) }).catch(() => {}); } catch (e) {}
  };
  window.addEventListener("error", e => { if (e && e.message) enviar(e.message, e.filename, e.lineno); });
  window.addEventListener("unhandledrejection", e => { const r = e && e.reason; enviar("Promesa: " + (r && (r.message || r.toString()) || "sin detalle"), "", 0); });
})();
