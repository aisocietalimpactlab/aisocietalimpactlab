// Small, optional enhancements. Page content and links are ordinary HTML.
document.documentElement.classList.add("js-enabled");
document.querySelectorAll("[data-enhancement]").forEach((element) => {
  element.hidden = false;
});

// Mobile navigation.
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-navigation");
if (menuButton && navigation) {
  function setMenu(open) {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector("span").textContent = open ? "Close" : "Menu";
    menuButton.querySelector(".menu-lines").classList.toggle("is-open", open);
    navigation.classList.toggle("is-open", open);
  }
  menuButton.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menuButton.focus();
    }
  });
}

// Research filters operate on the four articles already present in the HTML.
const search = document.querySelector('input[type="search"]');
if (search) {
  const buttons = [...document.querySelectorAll(".filters [data-topic]")];
  const articles = [...document.querySelectorAll(".research-row")];
  const count = document.querySelector(".result-count");
  const emptyState = document.querySelector(".empty-state");
  let topic = "All research";
  let resultsAnimation;
  let filterRevision = 0;
  const results = document.querySelector(".research-list");

  async function filterResearch(updateAddress = true) {
    const revision = ++filterRevision;
    const searchText = search.value.trim();
    const query = searchText.toLowerCase();
    const matches = articles.map((article) =>
      (topic === "All research" || article.dataset.topic === topic) &&
      article.textContent.toLowerCase().includes(query),
    );
    const changed = articles.some((article, index) => article.hidden === matches[index]);
    const visible = matches.filter(Boolean).length;
    const outgoing = emptyState.hidden ? results : emptyState;
    const opacity = getComputedStyle(outgoing).opacity;
    resultsAnimation?.cancel();

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.topic === topic));
    });
    if (updateAddress) {
      const url = new URL(window.location.href);
      if (topic === "All research") url.searchParams.delete("topic");
      else url.searchParams.set("topic", topic);
      if (searchText) url.searchParams.set("q", searchText);
      else url.searchParams.delete("q");
      try {
        history.replaceState(null, "", url);
      } catch {
        /* Local URL restrictions. */
      }
    }

    const animate = updateAddress && changed &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) {
      resultsAnimation = outgoing.animate(
        [{ opacity }, { opacity: 0 }],
        { duration: 250, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
      );
      try { await resultsAnimation.finished; } catch { return; }
      if (revision !== filterRevision) return;
    }

    // Swap only once the previous results are completely invisible.
    const lastVisible = matches.lastIndexOf(true);
    articles.forEach((article, index) => {
      article.hidden = !matches[index];
      article.classList.toggle("is-last-result", index === lastVisible);
    });
    count.textContent = `${visible} ${visible === 1 ? "PUBLICATION" : "PUBLICATIONS"}${query ? ` MATCHING “${searchText}”` : ""}`;
    emptyState.hidden = visible !== 0;
    resultsAnimation?.cancel();
    if (animate) {
      resultsAnimation = (visible ? results : emptyState).animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 380, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      );
    }
  }

  function readFilters() {
    const params = new URLSearchParams(window.location.search);
    const requestedTopic = params.get("topic");
    topic = buttons.some((button) => button.dataset.topic === requestedTopic)
      ? requestedTopic
      : "All research";
    search.value = params.get("q") || "";
    filterResearch(false);
  }

  search.addEventListener("input", () => filterResearch());
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      topic = button.dataset.topic;
      filterResearch();
    }),
  );
  document
    .querySelector("[data-clear-filters]")
    .addEventListener("click", () => {
      topic = "All research";
      search.value = "";
      filterResearch();
      search.focus();
    });
  window.addEventListener("popstate", readFilters);
  readFilters();
}

// Citations remain ordinary reference-list anchors on touch screens and without JS.
const citations = [...document.querySelectorAll("a.citation")];
if (citations.length) {
  const desktopCitations = matchMedia("(hover: hover) and (pointer: fine)");
  const preview = document.createElement("aside");
  preview.className = "citation-preview";
  preview.id = "citation-preview";
  preview.setAttribute("aria-label", "Reference preview");
  preview.hidden = true;
  document.body.append(preview);
  let activeCitation;
  let dismissTimer;
  const keepPreview = () => clearTimeout(dismissTimer);
  function hidePreview() {
    keepPreview();
    activeCitation?.removeAttribute("aria-controls");
    preview.hidden = true;
    activeCitation = null;
  }
  function dismissPreview() {
    keepPreview();
    dismissTimer = setTimeout(() => {
      if (!preview.matches(":hover") && !preview.contains(document.activeElement) &&
          document.activeElement !== activeCitation) hidePreview();
    }, 200);
  }
  function showPreview(link) {
    if (!desktopCitations.matches) return;
    const reference = document.querySelector(link.getAttribute("href"));
    if (!reference) return;
    hidePreview();
    activeCitation = link;
    link.setAttribute("aria-controls", preview.id);
    preview.replaceChildren(...[...reference.childNodes].map(node => node.cloneNode(true)));
    if (link.dataset.pages) {
      const locator = document.createElement("strong");
      locator.className = "citation-pages";
      locator.textContent = `Cited pages: ${link.dataset.pages}`;
      preview.append(locator);
    }
    preview.hidden = false;
    const anchor = link.getBoundingClientRect();
    const box = preview.getBoundingClientRect();
    preview.style.left = `${Math.max(12, Math.min(anchor.left, innerWidth - box.width - 12))}px`;
    const below = anchor.bottom + 8;
    preview.style.top = `${below + box.height <= innerHeight - 12 ? below : Math.max(12, anchor.top - box.height - 8)}px`;
  }
  citations.forEach(link => {
    link.addEventListener("mouseenter", () => showPreview(link));
    link.addEventListener("focus", () => showPreview(link));
    link.addEventListener("mouseleave", dismissPreview);
    link.addEventListener("blur", dismissPreview);
    link.addEventListener("click", hidePreview);
    // Let keyboard users enter the interactive preview without tabbing through the essay.
    link.addEventListener("keydown", event => {
      if (event.key === "Tab" && !event.shiftKey && activeCitation === link) {
        const source = preview.querySelector("a");
        if (source) { event.preventDefault(); source.focus(); }
      }
    });
  });
  preview.addEventListener("mouseenter", keepPreview);
  preview.addEventListener("mouseleave", dismissPreview);
  preview.addEventListener("focusin", keepPreview);
  preview.addEventListener("focusout", dismissPreview);
  preview.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      const links = [...preview.querySelectorAll("a")];
      if (event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault(); activeCitation?.focus();
      } else if (!event.shiftKey && document.activeElement === links.at(-1)) {
        activeCitation?.focus(); hidePreview();
      }
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !preview.hidden) {
      if (preview.contains(document.activeElement)) activeCitation?.focus();
      hidePreview();
    }
  });
  window.addEventListener("scroll", hidePreview, { passive: true });
  window.addEventListener("resize", hidePreview);
  desktopCitations.addEventListener("change", hidePreview);
}

// Without JavaScript, portrait links reveal the biographies in the page.
// Where supported, enhance those same HTML sections into native dialogs.
if (
  typeof HTMLDialogElement !== "undefined" &&
  HTMLDialogElement.prototype.showModal
) {
  document.querySelectorAll(".profile-panel").forEach((panel) => {
    const dialog = document.createElement("dialog");
    dialog.id = panel.id;
    dialog.className = "profile-dialog";
    dialog.setAttribute(
      "aria-labelledby",
      panel.getAttribute("aria-labelledby"),
    );
    dialog.append(...panel.childNodes);
    panel.replaceWith(dialog);

    const openers = [...document.querySelectorAll(`[data-profile="${dialog.id}"]`)];
    let opener = openers[0];
    openers.forEach((link) => link.setAttribute("aria-haspopup", "dialog"));
    let closeTimer;
    function finishClose() {
      clearTimeout(closeTimer);
      dialog.close();
    }
    function closeProfile() {
      if (!dialog.open || dialog.classList.contains("is-closing")) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishClose();
        return;
      }
      dialog.classList.add("is-closing");
      // Also finish if animations are disabled or interrupted mid-dismissal.
      closeTimer = setTimeout(finishClose, 220);
    }
    dialog.addEventListener("animationend", (event) => {
      if (event.target === dialog && event.animationName === "profile-dismiss") finishClose();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeProfile();
    });
    function openProfile() {
      if (dialog.open) return;
      dialog.classList.remove("is-closing");
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    openers.forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      opener = link;
      openProfile();
    }));
    dialog.querySelector(".dialog-close").addEventListener("click", (event) => {
      event.preventDefault();
      closeProfile();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        closeProfile();
    });
    dialog.addEventListener("close", () => {
      clearTimeout(closeTimer);
      dialog.classList.remove("is-closing");
      document.body.style.overflow = "";
      opener.focus({ preventScroll: true });
      if (window.location.hash === `#${dialog.id}`) {
        try {
          history.replaceState(null, "", dialog.querySelector(".dialog-close").getAttribute("href"));
        } catch {
          /* Local URL restrictions. */
        }
      }
    });
    window.addEventListener("hashchange", () => {
      if (window.location.hash === `#${dialog.id}` && !dialog.open)
        openProfile();
    });
    if (window.location.hash === `#${dialog.id}`) openProfile();
  });
}

// Copy the current article link, with a selectable text fallback.
document.querySelectorAll("[data-copy-link]").forEach((button) => {
  const label = document.createElement("span");
  label.textContent = "Copy link";
  const arrow = button.querySelector("svg");
  button.replaceChildren(label);
  if (arrow) button.append(arrow);
  const controls = button.closest(".share-controls");
  const announcement = controls.querySelector('[role="status"]');
  const fallback = controls.querySelector(".copy-fallback");
  let reset;
  button.addEventListener("click", async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(window.location.href);
      label.textContent = "Link copied";
      announcement.textContent = "Article link copied to clipboard.";
      fallback.hidden = true;
      reset = setTimeout(() => {
        label.textContent = "Copy link";
        announcement.textContent = "";
      }, 2500);
    } catch {
      label.textContent = "Select link below";
      announcement.textContent = "Select and copy the article link below.";
      fallback.hidden = false;
      const input = fallback.querySelector("input");
      input.value = window.location.href;
      input.focus();
      input.select();
    }
  });
});

// Move between the three homepage screens with one wheel gesture. Touch and
// keyboard scrolling retain native behavior; the footer always scrolls freely.
if (document.documentElement.classList.contains("home-page")) {
  const slideMedia = matchMedia("(min-width: 1000px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)");
  const slides = [...document.querySelectorAll(".home-slide")];
  const team = document.querySelector("#team");
  const desktopMedia = matchMedia("(min-width: 1000px) and (min-height: 650px)");
  function headerOffset() {
    return desktopMedia.matches
      ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--compact-header-height")) || 0
      : 0;
  }
  let animationUntil = 0;
  let lastWheel = 0;
  function updateScrollHeader() {
    document.documentElement.classList.toggle("header-compact", desktopMedia.matches && scrollY > 8);
    document.documentElement.classList.toggle("past-slides", scrollY >= team.offsetTop - headerOffset() - 2);
  }
  addEventListener("scroll", updateScrollHeader, { passive: true });
  addEventListener("resize", updateScrollHeader);
  updateScrollHeader();
  addEventListener("wheel", (event) => {
    if (!slideMedia.matches || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) ||
        event.target.closest("dialog, input, textarea, select") || document.querySelector("dialog[open]")) return;
    const now = performance.now();
    const continuingGesture = now - lastWheel < 180;
    lastWheel = now;
    if (animationUntil && (now < animationUntil || continuingGesture)) {
      event.preventDefault();
      return;
    }
    animationUntil = 0;
    const positions = [0, ...slides.slice(1).map((slide) => slide.offsetTop - headerOffset())];
    const index = positions.findIndex((position) => Math.abs(scrollY - position) < 3);
    const direction = Math.sign(event.deltaY);
    if (index < 0 || !direction || index + direction < 0 || index + direction >= slides.length) return;
    // Oversized content (including zoomed text) must remain freely scrollable.
    const currentHeight = slides[index].getBoundingClientRect().height + headerOffset();
    if (currentHeight > innerHeight + 2) return;
    event.preventDefault();
    animationUntil = now + 700;
    scrollTo({ top: positions[index + direction], behavior: "smooth" });
  }, { passive: false });
}

// Fellowship has one introductory transition; programme details scroll freely.
if (document.documentElement.classList.contains("fellowship-page")) {
  const desktop = matchMedia("(min-width: 1000px) and (min-height: 650px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const hero = document.querySelector(".fellowship-hero");
  const details = document.querySelector(".fellowship-details");
  let animationUntil = 0;
  let lastWheel = 0;
  const updateHeader = () => document.documentElement.classList.toggle("header-compact", desktop.matches && scrollY > 8);
  addEventListener("scroll", updateHeader, { passive: true });
  addEventListener("resize", updateHeader);
  updateHeader();
  addEventListener("wheel", event => {
    if (!desktop.matches || reducedMotion.matches || event.ctrlKey ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX) ||
        event.target.closest("dialog, input, textarea, select") ||
        document.querySelector("dialog[open]")) return;
    const now = performance.now();
    const continuingGesture = now - lastWheel < 180;
    lastWheel = now;
    if (animationUntil && (now < animationUntil || continuingGesture)) {
      event.preventDefault();
      return;
    }
    animationUntil = 0;
    if (hero.getBoundingClientRect().height > innerHeight + 2) return;
    const detailsTop = details.offsetTop - 64;
    const downFromHero = event.deltaY > 0 && scrollY < detailsTop - 3;
    const upToHero = event.deltaY < 0 && scrollY > 0 && scrollY <= detailsTop + 3;
    if (!downFromHero && !upToHero) return;
    event.preventDefault();
    animationUntil = now + 700;
    scrollTo({ top: downFromHero ? detailsTop : 0, behavior: "smooth" });
  }, { passive: false });
}
