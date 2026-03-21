/**
 * Kite Prospect — widget de lead (iframe a /embed/lead).
 * Cargar desde el mismo origen que la app (p. ej. https://tu-app.vercel.app/kite-lead-widget.js).
 *
 * Atributos en el <script>:
 * - data-account-slug (o data-slug): slug de cuenta (default "demo")
 * - data-target: id del contenedor (default "kite-lead-widget-root"). Si no existe, se crea.
 * - data-min-height: altura mínima del iframe en px (default 520)
 */
(function () {
  function findScript() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var el = scripts[i];
      if (el.src && el.src.indexOf("kite-lead-widget.js") !== -1) return el;
    }
    return null;
  }

  var s = findScript();
  if (!s) return;

  var base;
  try {
    base = new URL(s.src).origin;
  } catch (e) {
    return;
  }

  var slug = (s.getAttribute("data-account-slug") || s.getAttribute("data-slug") || "demo").trim();
  var targetId = (s.getAttribute("data-target") || "kite-lead-widget-root").trim();
  var minHeight = parseInt(s.getAttribute("data-min-height") || "520", 10) || 520;

  var mount = document.getElementById(targetId);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = targetId;
    if (s.parentNode) {
      s.parentNode.insertBefore(mount, s.nextSibling);
    } else {
      document.body.appendChild(mount);
    }
  }

  var iframe = document.createElement("iframe");
  iframe.src = base + "/embed/lead?slug=" + encodeURIComponent(slug);
  iframe.title = "Formulario de contacto";
  iframe.setAttribute("loading", "lazy");
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.minHeight = minHeight + "px";
  iframe.style.display = "block";
  mount.appendChild(iframe);
})();
