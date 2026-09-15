(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!navToggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  navToggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  var desktopNav = window.matchMedia("(min-width: 40rem)");
  var syncNavForViewport = function () {
    if (desktopNav.matches) {
      setOpen(false);
    }
  };
  if (desktopNav.addEventListener) {
    desktopNav.addEventListener("change", syncNavForViewport);
  } else if (desktopNav.addListener) {
    desktopNav.addListener(syncNavForViewport);
  }
  window.addEventListener("resize", syncNavForViewport, { passive: true });

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !sections.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        links.forEach(function (link) {
          var active = link.getAttribute("href") === id;
          link.classList.toggle("is-active", active);
          if (active) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
