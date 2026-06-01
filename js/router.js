/* ============================================================
   BOO-POS — Router
   Minimal view switcher. Views register a render(root, params)
   fn. Transient nodes (sheets/overlays) are appended to body
   with class .boo-transient and cleaned up on navigation.
   ============================================================ */
(function () {
  window.BOO = window.BOO || {};
  const routes = {};
  let currentName = null;
  let currentParams = {};
  const stack = [];

  function register(name, fn) {
    routes[name] = fn;
  }

  function cleanTransient() {
    document.querySelectorAll(".boo-transient").forEach((n) => n.remove());
  }

  function render() {
    const root = document.getElementById("app");
    if (!root) return;
    cleanTransient();
    root.innerHTML = "";
    const fn = routes[currentName] || routes["home"];
    fn(root, currentParams);
    window.scrollTo(0, 0);
    // reflect in hash for share/deep-link friendliness (no reload)
    try {
      const h = "#/" + currentName;
      if (location.hash !== h) history.replaceState(null, "", h);
    } catch (e) {}
  }

  function go(name, params, opts) {
    if (!routes[name]) name = "home";
    if (currentName && !(opts && opts.replace)) stack.push({ name: currentName, params: currentParams });
    currentName = name;
    currentParams = params || {};
    render();
  }

  function back() {
    const prev = stack.pop();
    if (prev) {
      currentName = prev.name;
      currentParams = prev.params;
      render();
    } else {
      go("home", {}, { replace: true });
    }
  }

  function refresh() {
    if (currentName) render();
  }
  function current() {
    return currentName;
  }

  BOO.router = { register, go, back, refresh, current };
})();
