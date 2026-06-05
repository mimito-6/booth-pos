/* ============================================================
   OpenBooth — Router
   Minimal view switcher. Views register a render(root, params)
   fn. Transient nodes (sheets/overlays) are appended to body
   with class .boo-transient and cleaned up on navigation.
   ============================================================ */
(function () {
  window.OB = window.OB || {};
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
    if (window.OB.store && OB.store.isLocked && OB.store.isLocked() && currentName !== "front" && currentName !== "home") {
      renderLocked(root);
      window.scrollTo(0, 0);
      return;
    }
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

  function renderLocked(root) {
    const t = window.t;
    const U = window.OB.util;
    const view = U.el("div", { class: "view active" });
    view.appendChild(
      OB.ui.header({
        title: t("helper_lock"),
        subtitle: t("locked_title"),
        onBack: () => go("home", {}, { replace: true }),
        right: [{ icon: OB.icon("lock-open"), label: t("unlock"), onClick: () => OB.app.unlockHelper() }],
      })
    );
    view.appendChild(
      U.el("main", {}, [
        U.el("section", { class: "section locked-notice" }, [
          U.el("div", { class: "locked-icon", html: OB.icon("lock", 44) }),
          U.el("h2", { text: t("locked_title") }),
          U.el("p", { text: t("locked_notice") }),
          U.el("button", { class: "btn btn-primary btn-block", text: t("unlock"), onclick: () => OB.app.unlockHelper() }),
        ]),
      ])
    );
    root.appendChild(view);
  }

  OB.router = { register, go, back, refresh, current };
})();
