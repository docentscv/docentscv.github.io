
/* ====== IDIOMA: Castellano / Valencià ======
   No traduce "en el servidor": busca frases en castellano dentro del texto ya mostrado
   y las cambia por su versión en valencià (y al revés, al volver a castellano).
   Así funciona con TODO lo que la web pinta dinámicamente, sin tocar esas funciones.
   Para ampliar la traducción, basta con añadir pares ["frase en castellano","frase en valencià"]
   a DIC_VAL — cuanto más larga y concreta la frase, mejor (menos riesgo de coincidir por error). */
(function () {
  const DIC_VAL = [
    // --- Inicio ---
    ["Interinos · Comunitat Valenciana","Interins · Comunitat Valenciana"],
    ["Descubre tus","Descobreix les teues"],
    ["opciones reales","opcions reals"],
    ["de conseguir plaza","de conseguir plaça"],
    ["Las últimas adjudicaciones al instante, tu posición en la bolsa y la probabilidad de que te toque.","Les últimes adjudicacions a l'instant, la teua posició en la borsa i la probabilitat que et toque."],
    ["plazas en la última tanda","places en l'última tanda"],
    ["fecha de la última tanda","data de l'última tanda"],
    ["🎯 Ver mi posición","🎯 Veure la meua posició"],
    ["Consultar adjudicaciones","Consultar adjudicacions"],
    ["Hoy en las listas","Hui en les llistes"],
    ["Siempre al día","Sempre al dia"],
    ["Se actualiza con cada lista de la Conselleria.","S'actualitza amb cada llista de la Conselleria."],
    ["Tu evolución","La teua evolució"],
    ["Gráficas de tu puesto en los últimos 2 meses.","Gràfiques del teu lloc en els últims 2 mesos."],
    ["Datos oficiales","Dades oficials"],
    ["Sin nombres de personas en la consulta pública.","Sense noms de persones en la consulta pública."],
    ["Instala DocentsCV en tu iPhone","Instal·la DocentsCV en el teu iPhone"],
    ["Así la tienes como una app, con su icono, sin pasar por la App Store.","Així la tens com una app, amb la seua icona, sense passar per l'App Store."],
    ["Elige","Tria"],
    ["«Añadir a pantalla de inicio»","«Afegir a pantalla d'inici»"],
    [". Ya tienes el icono de DocentsCV.",". Ja tens la icona de DocentsCV."],
    ["No, gracias","No, gràcies"],
    ["Descárgala en Android","Descarrega-la en Android"],
    ["La app de DocentsCV, con icono propio y notificaciones.","L'app de DocentsCV, amb icona pròpia i notificacions."],
    ["Todavía está en fase de pruebas de Google: antes de descargarla, tienes que unirte como probador (solo una vez).","Encara està en fase de proves de Google: abans de descarregar-la, has d'unir-te com a provador (només una vegada)."],
    ["1. Unirme como probador","1. Unir-me com a provador"],
    ["2. Descargar","2. Descarregar"],
    ["Síguenos","Segueix-nos"],
    ["Enterarte de cuándo salen las listas sin abrir la web.","Assabenta't de quan ixen les llistes sense obrir la web."],
    // --- Consulta ---
    ["Invita a tus compañeros y consigue la app gratis","Convida els teus companys i aconsegueix l'app gratis"],
    ["Si 3 personas se registran con tu código y pagan, tu curso es gratis. Con los","Si 3 persones es registren amb el teu codi i paguen, el teu curs és gratis. Amb els"],
    ["días de prueba tienes tiempo de sobra para invitar a todos los que puedas.","dies de prova tens temps de sobra per a convidar tots els que pugues."],
    ["Quiero mi código","Vull el meu codi"],
    ["Plazas ofertadas","Places ofertades"],
    ["Sin requisito de idioma","Sense requisit d'idioma"],
    ["En inglés","En anglés"],
    ["Otro requisito","Un altre requisit"],
    ["Localidad o centro","Localitat o centre"],
    ["📝 Ir a pedir plazas en la web de la GVA","📝 Anar a demanar places en la web de la GVA"],
    ["🗺️ Ver en el mapa","🗺️ Veure en el mapa"],
    ["Plazas de difícil cobertura en tus bolsas","Places de difícil cobertura en les teues borses"],
    ["Plazas de difícil cobertura","Places de difícil cobertura"],
    ["Son plazas que nadie cogió en la adjudicación continua. Se ofrecen también a personas que no están en la bolsa y a quienes sí están y quieren cogerlas.","Són places que ningú va agafar en l'adjudicació contínua. S'oferixen també a persones que no estan en la borsa i a qui sí que ho estan i volen agafar-les."],
    ["Últimas adjudicaciones en tus bolsas","Últimes adjudicacions en les teues borses"],
    ["Últimas adjudicaciones","Últimes adjudicacions"],
    ["Secundaria y otros cuerpos","Secundària i altres cossos"],
    ["Filtrar esta lista","Filtrar esta llista"],
    ["Ver más resultados","Veure més resultats"],
    ["Ver más","Veure més"],
    ["Busca por especialidad y centro","Busca per especialitat i centre"],
    ["Mira cuál fue la última adjudicación y hasta qué posición se llegó en cada centro.","Mira quina va ser l'última adjudicació i fins quina posició es va arribar en cada centre."],
    ["Centro o localidad","Centre o localitat"],
    ["Escribe y espera un momento","Escriu i espera un moment"],
    ["Adjudicación de inicio de curso (listado completo)","Adjudicació d'inici de curs (llistat complet)"],
    ["Tu posición","La teua posició"],
    ["Posición adjudicada","Posició adjudicada"],
    ["Hasta dónde se llegó otros años","Fins on es va arribar altres anys"],
    ["Hasta dónde se llegó","Fins on es va arribar"],
    ["Estimación orientativa: la numeración cambia cada curso y la posición adjudicada no siempre coincide con el corte real de la bolsa.","Estimació orientativa: la numeració canvia cada curs i la posició adjudicada no sempre coincidix amb el tall real de la borsa."],
    // --- Acceso ---
    ["Correo electrónico","Correu electrònic"],
    ["Contraseña","Contrasenya"],
    ["Mínimo 8 caracteres","Mínim 8 caràcters"],
    ["He leído y acepto la","He llegit i accepte la"],
    ["política de privacidad y las condiciones de uso","política de privacitat i les condicions d'ús"],
    ["Crear cuenta","Crear compte"],
    ["He olvidado mi contraseña","He oblidat la meua contrasenya"],
    // --- Mi apartado ---
    ["Menú de usuario","Menú d'usuari"],
    ["⚙️ Ajustes y avisos","⚙️ Ajustos i avisos"],
    ["💬 Sugerencias y reclamaciones","💬 Suggeriments i reclamacions"],
    ["Eliminar mi cuenta","Eliminar el meu compte"],
    ["Salir","Eixir"],
    ["Última adjudicación","Última adjudicació"],
    ["Tus oportunidades por centro","Les teues oportunitats per centre"],
    ["Elige un centro de las últimas adjudicaciones y mira, tanda a tanda, si habrías ido por delante de la persona que se llevó esa plaza. «Por delante» significa que, si la hubieras pedido, te habría correspondido antes a ti (siempre que no te dieran otra que prefieres más). Cuando carguemos los PDF de las plazas que ofertará la Conselleria, aparecerán también en este desplegable.","Tria un centre de les últimes adjudicacions i mira, torn a torn, si hagueres anat per davant de la persona que es va emportar eixa plaça. «Per davant» significa que, si l'hagueres demanada, t'haguera correspost abans a tu (sempre que no et donaren una altra que prefereixes més). Quan carreguem els PDF de les places que oferirà la Conselleria, apareixeran també en este desplegable."],
    ["Simulador de petición","Simulador de petició"],
    ["¿Qué habría pasado en las últimas tandas si hubieras pedido plazas en estas provincias o hasta esta distancia? Contamos las tandas en las que se adjudicó, dentro de tu selección, alguna plaza de tu bolsa a alguien que iba","Què hauria passat en les últimes tandes si hagueres demanat places en estes províncies o fins esta distància? Comptem les tandes en què es va adjudicar, dins de la teua selecció, alguna plaça de la teua borsa a algú que anava"],
    ["por detrás","per darrere"],
    ["de ti: si la hubieras pedido, te habría tocado a ti.","de tu: si l'hagueres demanada, t'haguera tocat a tu."],
    ["Es una estimación, no una certeza:","És una estimació, no una certesa:"],
    ["mira lo que ya pasó y no tiene en cuenta requisitos como el idioma ni otras plazas que hubieras preferido. Las próximas tandas pueden ser distintas.","mira el que ja va passar i no té en compte requisits com l'idioma ni altres places que hagueres preferit. Les pròximes tandes poden ser distintes."],
    ["Tus especialidades de Maestros","Les teues especialitats de Mestres"],
    ["Elígelas para ver las adjudicaciones que te interesan.","Tria-les per a veure les adjudicacions que t'interessen."],
    ["Orientativo, no garantiza ni descarta ninguna plaza. «Competidores por delante» son las personas que pidieron alguna de las plazas ofertadas y no la consiguieron («No adjudicat»). Vacante: trabajarás hasta el final del curso en el mismo centro. Sustitución: la plaza es temporal, mientras su titular está de baja.","Orientatiu, no garantix ni descarta cap plaça. «Competidors per davant» són les persones que van demanar alguna de les places ofertades i no la van aconseguir («No adjudicat»). Vacant: treballaràs fins al final del curs en el mateix centre. Substitució: la plaça és temporal, mentre el seu titular està de baixa."],
    ["Cerrar ✕","Tancar ✕"],
    ["Se borrarán de forma definitiva tu cuenta, tu correo, el nombre asociado y tus datos de acceso. No se puede deshacer. Si pagaste el curso, el pago no se devuelve.","S'esborraran de forma definitiva el teu compte, el teu correu, el nom associat i les teues dades d'accés. No es pot desfer. Si vas pagar el curs, el pagament no es retorna."],
    ["Escribe ELIMINAR para confirmar","Escriu ELIMINAR per a confirmar"],
    // --- pie, navegación, bienvenida ---
    ["DocentsCV es un proyecto independiente, no vinculado a la Conselleria. Fuente: listados oficiales de adjudicación de inicio de curso. No se muestran nombres de personas.","DocentsCV és un projecte independent, no vinculat a la Conselleria. Font: llistats oficials d'adjudicació d'inici de curs. No es mostren noms de persones."],
    ["Privacidad y condiciones","Privacitat i condicions"],
    ["❓ Ayuda","❓ Ajuda"],
    ["Navegación principal","Navegació principal"],
    ["Mi apartado","El meu apartat"],
    ["Inicio","Inici"],
    ["Bienvenida a DocentsCV","Benvinguda a DocentsCV"],
    ["Tu posición, al instante","La teua posició, a l'instant"],
    ["Mira en qué puesto estás en cada bolsa y cómo ha evolucionado en los últimos 2 meses.","Mira en quin lloc estàs en cada borsa i com ha evolucionat en els últims 2 mesos."],
    ["Tus oportunidades reales","Les teues oportunitats reals"],
    ["Descubre si habrías ido por delante de quien se llevó cada plaza y tu probabilidad de conseguirla.","Descobreix si hagueres anat per davant de qui es va emportar cada plaça i la teua probabilitat de conseguir-la."],
    ["Cada lista de la Conselleria se carga en cuanto sale: adjudicaciones, plazas ofertadas y de difícil cobertura.","Cada llista de la Conselleria es carrega en quant ix: adjudicacions, places ofertades i de difícil cobertura."],
    ["Siguiente","Següent"],
    // --- diálogos ---
    ["Tienes mensajes pendientes","Tens missatges pendents"],
    ["Ir a resolverlos","Anar a resoldre'ls"],
    ["Luego","Després"],
    ["Pedir cambio de especialidad","Demanar canvi d'especialitat"],
    ["las especialidades que tengas, en Maestros y/o en Profesorado. Se lo enviamos a administración y te las cambiamos.","les especialitats que tingues, en Mestres i/o en Professorat. L'enviem a administració i te les canviem."],
    ["Por ejemplo: me equivoqué al elegirlas","Per exemple: em vaig equivocar en triar-les"],
    ["Enviar petición","Enviar petició"],
    ["¡Hecho! 🙌","Fet! 🙌"],
    ["Hemos enviado tu petición a administración. La cambiaremos lo antes posible.","Hem enviat la teua petició a administració. La canviarem com més prompte millor."],
    ["Cargando…","Carregant…"],
    ["Cuéntanos qué mejorarías o qué ha ido mal. Lo leemos todo.","Conta'ns què milloraries o què ha anat malament. Ho llegim tot."],
    ["💡 Sugerencia","💡 Suggeriment"],
    ["📣 Reclamación","📣 Reclamació"],
    ["🐞 He encontrado un error","🐞 He trobat un error"],
    ["Tu mensaje","El teu missatge"],
    ["Escribe aquí…","Escriu ací…"],
    ["Tu correo (opcional, para poder responderte)","El teu correu (opcional, per a poder respondre't)"],
    ["¡Gracias! 🙌","Gràcies! 🙌"],
    ["Hemos recibido tu mensaje.","Hem rebut el teu missatge."],
    // --- tarjetas de "Mi apartado" / "Consulta" generadas por JS ---
    ["¡Tienes plaza!","Tens plaça!"],
    ["Sigues compitiendo","Segueixes competint"],
    ["Sigues en la lista","Segueixes en la llista"],
    ["No confirmaste a tiempo","No vas confirmar a temps"],
    ["Estás desactivado en esta bolsa","Estàs desactivat en esta borsa"],
    ["Desactivado en esta bolsa","Desactivat en esta borsa"],
    ["Tu puesto en la lista sigue siendo el","El teu lloc en la llista continua sent el"],
    ["aunque al estar desactivado no participas en la adjudicación.","encara que, en estar desactivat, no participes en l'adjudicació."],
    ["Tu puesto en la bolsa es el","El teu lloc en la borsa és el"],
    ["Sin contar a los desactivados, eres el","Sense comptar els desactivats, eres el"],
    ["de los disponibles en esta lista.","dels disponibles en esta llista."],
    ["Último adjudicado de tu bolsa","Últim adjudicat de la teua borsa"],
    ["Te separan","Et separen"],
    ["Tu puesto ya entra en la zona donde se está adjudicando.","El teu lloc ja entra en la zona on s'està adjudicant."],
    ["Probabilidad de conseguir plaza","Probabilitat de conseguir plaça"],
    ["próximas tandas","pròximes tandes"],
    ["Plaza adjudicada","Plaça adjudicada"],
    ["Prueba gratuita: te","Prova gratuïta: te"],
    ["queda 1 día","queda 1 dia"],
    ["Tu puesto en la lista es el","El teu lloc en la llista és el"],
    ["¿No quieres esperar? Paga ya los","No vols esperar? Paga ja els"],
    ["Confirmando tu pago…","Confirmant el teu pagament…"],
    ["¡Pago correcto!","Pagament correcte!"],
    ["Ya tienes acceso a todo el curso.","Ja tens accés a tot el curs."],
    ["Pago cancelado.","Pagament cancel·lat."],
    ["📣 Recomienda DocentsCV a tus compañeros","📣 Recomana DocentsCV als teus companys"],
    ["Pago único, sin renovación automática.","Pagament únic, sense renovació automàtica."],
    ["Todo el curso","Tot el curs"],
    ["Precio especial por incorporarte a mitad de curso.","Preu especial per incorporar-te a mitat de curs."],
    ["El precio de 4,99 € es especial por incorporarte este curso. El curso 2027-28 será de 7,49 €.","El preu de 4,99 € és especial per incorporar-te este curs. El curs 2027-28 serà de 7,49 €."],
    ["plazas adjudicadas en la última tanda","places adjudicades en l'última tanda"],
    ["Secundaria y otros","Secundària i altres"],
    ["Por provincia","Per província"],
    ["Mis centros favoritos","Els meus centres favorits"],
    ["Te avisamos por notificación cuando salgan plazas ofertadas o de difícil cobertura en estos centros.","T'avisem per notificació quan isquen places ofertades o de difícil cobertura en estos centres."],
    ["Activar notificaciones","Activar notificacions"],
    ["Todavía no tienes ninguno. Búscalos aquí o pulsa «☆ Favorito» en las plazas de Consulta.","Encara no en tens cap. Busca'ls ací o prem «☆ Favorit» en les places de Consulta."],
    ["Añadir un centro","Afegir un centre"],
    ["Profesores de Enseñanza Secundaria","Professorat d'Ensenyament Secundari"],
    ["Evolución de los últimos 2 meses","Evolució dels últims 2 mesos"],
    ["Todavía no hay suficientes datos en los últimos 2 meses para dibujar la gráfica.","Encara no hi ha prou dades en els últims 2 mesos per a dibuixar la gràfica."],
    // --- palabras sueltas (comodín, se aplican con límite de palabra) ---
    ["Cuerpo","Cos"],["Especialidad","Especialitat"],["Especialidades","Especialitats"],["Provincia","Província"],["Todas","Totes"],
    ["Localidad","Localitat"],["Centro","Centre"],["Centros","Centres"],["Plaza","Plaça"],["Plazas","Places"],
    ["Tipo","Tipus"],["Lista","Llista"],["Listas","Llistes"],["Curso","Curs"],["Guardar","Guarda"],
    ["Correo","Correu"],["Nombre","Nom"],["Fecha","Data"],["Días","Dies"],["Día","Dia"],
    ["Bolsas","Borses"],["Bolsa","Borsa"],["Puestos","Llocs"],["Puesto","Lloc"],["Maestros","Mestres"],
    ["Vacante","Vacant"],["Vacantes","Vacants"],["Sustitución","Substitució"],["Sustituciones","Substitucions"],["Competidores","Competidors"],
    ["Administración","Administració"],["Tandas","Tandes"],["Enviar","Enviar"],["Cerrar","Tancar"],
    ["Entrar","Entrar"],["Consulta","Consulta"],["Adjudicación","Adjudicació"],["Adjudicaciones","Adjudicacions"],
    ["Ofertada","Oferida"],["Ofertadas","Oferides"],["Ofertado","Oferit"],["Ofertados","Oferits"],["Continuas","Contínues"],["Continua","Contínua"],
  ];
  let LANG; try { LANG = localStorage.getItem("dcv_lang") || "es"; } catch (e) { LANG = "es"; }
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function trad(s, inversa) {
    for (const [es, val] of DIC_VAL) {
      const a = inversa ? val : es, b = inversa ? es : val;
      if (!a || !b || a === b) continue;
      if (!/\s/.test(a) && /^[A-Za-zÀ-ÿ]+$/.test(a)) {
        const re = new RegExp("(?<![A-Za-zÀ-ÿ])" + escRe(a) + "(?![A-Za-zÀ-ÿ])", "gi");
        s = s.replace(re, m => {
          if (m === m.toUpperCase() && m !== m.toLowerCase()) return b.toUpperCase();
          if (/^[A-ZÀ-Ý]/.test(m)) return b.charAt(0).toUpperCase() + b.slice(1);
          return b.toLowerCase();
        });
      } else if (s.indexOf(a) !== -1) { s = s.split(a).join(b); }
    }
    return s;
  }
  function tradNodo(n, inversa) {
    if (n.nodeType === 3) { if (!n.nodeValue || !n.nodeValue.trim()) return; const t = trad(n.nodeValue, inversa); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1) return;
    if (n.tagName === "SCRIPT" || n.tagName === "STYLE") return;
    for (const at of ["placeholder", "aria-label", "title"]) {
      const v = n.getAttribute && n.getAttribute(at);
      if (v) { const t = trad(v, inversa); if (t !== v) n.setAttribute(at, t); }
    }
    const hijos = n.childNodes; for (let i = 0; i < hijos.length; i++) tradNodo(hijos[i], inversa);
  }
  let obs = null;
  function activarObservador() {
    if (obs) return;
    obs = new MutationObserver(muts => {
      if (LANG !== "val") return;
      for (const m of muts) {
        if (m.addedNodes) m.addedNodes.forEach(n => tradNodo(n, false));
        if (m.type === "characterData") tradNodo(m.target, false);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function pintarBotones() {
    document.querySelectorAll(".lang-btn").forEach(b => { b.textContent = LANG === "val" ? "CAS" : "VAL"; });
  }
  function aplicarIdioma() {
    document.documentElement.lang = LANG === "val" ? "ca" : "es";
    tradNodo(document.body, LANG !== "val");
    pintarBotones();
    activarObservador();
  }
  document.addEventListener("click", e => { if (e.target && e.target.closest && e.target.closest(".lang-btn")) {
    LANG = LANG === "val" ? "es" : "val"; try { localStorage.setItem("dcv_lang", LANG); } catch (err) {} aplicarIdioma();
  } });
  aplicarIdioma();
})();
