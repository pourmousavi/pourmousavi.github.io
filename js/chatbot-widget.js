// Publications chatbot widget — front-end for the papercast-chat Cloudflare Worker.
// The Worker (`papercast-chat`) accepts both alipourmousavi.com and pourmousavi.github.io
// as origins. Set the data-worker-url attribute on #pc-chat-root in publications.html.

(function () {
  const root = document.getElementById("pc-chat-root");
  if (!root) return;

  const WORKER_URL = root.dataset.workerUrl;
  if (!WORKER_URL || WORKER_URL.includes("example.workers.dev")) {
    console.warn("[pc-chat] data-worker-url is not configured; widget disabled.");
    return;
  }

  const state = {
    paperId: null,
    quota: null,
    lastTrigger: null,
  };

  const SITE_URL = "https://pourmousavi.github.io/publications.html";

  // Material `auto_awesome` — the de-facto AI sparkle icon.
  const SPARKLE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
    + '<path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>'
    + '</svg>';
  const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  const ICON_SEND = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5"/></svg>';

  // The publications page hooks the widget via #pc-chat-root for data-worker-url;
  // we don't render anything inline — the persistent side tab / FAB are the entry points.

  // ---- Persistent side trigger (desktop pull-tab + mobile FAB) ----
  // Always visible; no scroll gating.
  const sideTab = document.createElement("button");
  sideTab.type = "button";
  sideTab.className = "pc-side-tab pc-side-tab--visible";
  sideTab.title = "Chat with my publications";
  sideTab.setAttribute("aria-label", "Chat with my publications");
  sideTab.innerHTML = SPARKLE;
  document.body.appendChild(sideTab);

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "pc-fab pc-fab--visible";
  fab.title = "Chat with my publications";
  fab.setAttribute("aria-label", "Chat with my publications");
  fab.innerHTML = SPARKLE;
  document.body.appendChild(fab);

  // ---- Drawer (lives on body so it can overlay the whole viewport) ----
  const drawer = document.createElement("div");
  drawer.className = "pc-drawer";
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-labelledby", "pc-drawer-title");
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="pc-drawer-backdrop" data-pc-close></div>
    <aside class="pc-drawer-panel">
      <header class="pc-drawer-header">
        <h2 id="pc-drawer-title" class="pc-drawer-title">
          ${SPARKLE}
          <span>Chat with my publications</span>
        </h2>
        <div class="pc-drawer-actions">
          <button type="button" class="pc-drawer-icon-btn pc-download-btn"
                  aria-haspopup="menu" aria-expanded="false"
                  aria-label="Download conversation" title="Download conversation"
                  disabled>${ICON_DOWNLOAD}</button>
          <div class="pc-download-menu" role="menu" hidden>
            <button type="button" role="menuitem" data-format="txt">Download as text (.txt)</button>
            <button type="button" role="menuitem" data-format="md">Download as Markdown (.md)</button>
          </div>
          <button type="button" class="pc-drawer-icon-btn pc-drawer-close"
                  data-pc-close aria-label="Close chat" title="Close">${ICON_CLOSE}</button>
        </div>
      </header>
      <div class="pc-drawer-body">
        <div class="pc-hint">Powered by Cloudflare Workers AI · 20 questions/day</div>
        <form class="pc-input-wrap" novalidate>
          <input class="pc-input" type="text" maxlength="500"
                 placeholder="e.g. Which papers cover demand response?"
                 aria-label="Ask the publications chatbot" />
          <button class="pc-send" type="submit" aria-label="Send question">${ICON_SEND}</button>
        </form>
        <div class="pc-suggestions">
          <button type="button" data-q="Which papers cover demand response?">demand response</button>
          <button type="button" data-q="Stochastic dispatch of EV fleets">stochastic EV dispatch</button>
          <button type="button" data-q="Summarise the most recent paper">summarise the most recent paper</button>
          <button type="button" data-q="Which papers are about battery degradation?">battery degradation</button>
        </div>
        <div class="pc-context" hidden></div>
        <div class="pc-thread" hidden role="log" aria-live="polite"></div>
        <div class="pc-quota" hidden></div>
      </div>
    </aside>
  `;
  document.body.appendChild(drawer);

  const drawerPanel = drawer.querySelector(".pc-drawer-panel");
  const formEl = drawer.querySelector(".pc-input-wrap");
  const inputEl = drawer.querySelector(".pc-input");
  const sendEl = drawer.querySelector(".pc-send");
  const threadEl = drawer.querySelector(".pc-thread");
  const contextEl = drawer.querySelector(".pc-context");
  const quotaEl = drawer.querySelector(".pc-quota");
  const downloadBtn = drawer.querySelector(".pc-download-btn");
  const downloadMenu = drawer.querySelector(".pc-download-menu");

  // ---- Drawer open/close ----
  // generalMode = true means this entry point is for whole-corpus chat; clear
  // any lingering paper context so the user doesn't see "Asking about jpaperX"
  // when they meant to chat across all publications.
  function openDrawer(triggerEl, generalMode) {
    if (generalMode && state.paperId) clearContext();
    if (!drawer.hidden) return;
    state.lastTrigger = triggerEl || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    drawer.hidden = false;
    document.body.classList.add("pc-drawer-open");
    // Force reflow so the transition fires from translateX(100%) → 0
    void drawer.offsetWidth;
    drawer.classList.add("pc-drawer--visible");
    requestAnimationFrame(function () { inputEl.focus(); });
    document.addEventListener("keydown", onKeydown);
  }

  function closeDrawer() {
    if (drawer.hidden) return;
    closeDownloadMenu();
    drawer.classList.remove("pc-drawer--visible");
    const finish = function () {
      drawer.hidden = true;
      document.body.classList.remove("pc-drawer-open");
      drawerPanel.removeEventListener("transitionend", finish);
    };
    drawerPanel.addEventListener("transitionend", finish);
    // Fallback if transitionend doesn't fire (reduced-motion, hidden tab)
    setTimeout(finish, 350);
    document.removeEventListener("keydown", onKeydown);
    if (state.lastTrigger && typeof state.lastTrigger.focus === "function") {
      state.lastTrigger.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDrawer();
      return;
    }
    if (e.key === "Tab") {
      const focusables = drawerPanel.querySelectorAll(
        'button:not([disabled]):not([hidden]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  sideTab.addEventListener("click", function () { openDrawer(sideTab, true); });
  fab.addEventListener("click", function () { openDrawer(fab, true); });
  drawer.querySelectorAll("[data-pc-close]").forEach(function (el) {
    el.addEventListener("click", closeDrawer);
  });

  // ---- Form & suggestions ----
  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    submit();
  });
  drawer.querySelectorAll(".pc-suggestions button").forEach(function (b) {
    b.addEventListener("click", function () {
      inputEl.value = b.dataset.q;
      submit();
    });
  });

  // ---- Per-paper "Ask" buttons via DOM observation ----
  let indexedIds = null; // null → not yet loaded; Set → loaded; "all" → fail-open
  const ASK_ICON = '<svg class="pc-ask-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>';

  const wireAskButtons = function () {
    document.querySelectorAll(".publication-item:not([data-pc-wired])").forEach(function (item) {
      const id = item.id;
      if (!id) return;
      if (indexedIds === null) return;
      item.setAttribute("data-pc-wired", "1");
      if (indexedIds !== "all" && !indexedIds.has(id)) return;
      const linksWrap = item.querySelector(".pub-links");
      if (!linksWrap) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pc-ask-btn";
      btn.title = "Ask the chatbot about this paper";
      btn.setAttribute("aria-label", "Ask the chatbot about " + id);
      btn.setAttribute("data-paper-id", id);
      btn.innerHTML = ASK_ICON + '<span>Ask</span>';
      btn.addEventListener("click", function () { openWithPaper(id, btn); });
      linksWrap.appendChild(btn);
    });
  };

  const pubsContainer = document.getElementById("publications-container");
  if (pubsContainer) {
    const observer = new MutationObserver(wireAskButtons);
    observer.observe(pubsContainer, { childList: true, subtree: true });
  }

  fetch("/data/chatbot-papers.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (manifest) {
      if (manifest && Array.isArray(manifest.ids)) {
        indexedIds = new Set(manifest.ids);
      } else {
        console.warn("[pc-chat] chatbot-papers.json missing; wiring Ask on all papers.");
        indexedIds = "all";
      }
      wireAskButtons();
    });

  // ---- Submit ----
  async function submit() {
    const q = inputEl.value.trim();
    if (!q) return;
    inputEl.value = "";
    addMessage("user", q);
    setLoading(true);
    try {
      const r = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, paper_id: state.paperId }),
      });
      let data;
      try { data = await r.json(); } catch { data = {}; }
      setLoading(false);
      if (!r.ok) {
        addMessage("assistant", data.error || `Sorry — server returned ${r.status}.`);
      } else {
        addMessage("assistant", data.answer, data.citations);
        if (data.degraded === "no_llm") {
          addNote("The assistant is in low-quota mode — showing ranked papers without prose.");
        } else if (data.degraded === "no_embeddings") {
          addNote("Search is using keywords only (embeddings unavailable).");
        }
        if (data.quota) { state.quota = data.quota; renderQuota(); }
      }
    } catch {
      setLoading(false);
      addMessage("assistant", "Network error. Please try again in a moment.");
    }
  }

  function openWithPaper(id, triggerEl) {
    state.paperId = id;
    contextEl.hidden = false;
    contextEl.innerHTML = '';
    const label = document.createElement("span");
    label.textContent = "Asking about ";
    const code = document.createElement("code");
    code.textContent = id;
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "pc-clear-context";
    clearBtn.textContent = "clear";
    clearBtn.addEventListener("click", clearContext);
    contextEl.appendChild(label);
    contextEl.appendChild(code);
    contextEl.appendChild(clearBtn);
    inputEl.placeholder = `Ask about ${id}…`;
    openDrawer(triggerEl);
  }

  function clearContext() {
    state.paperId = null;
    contextEl.hidden = true;
    contextEl.innerHTML = "";
    inputEl.placeholder = "e.g. Which papers cover demand response?";
  }

  // ---- Rendering ----
  function addMessage(role, text, citations) {
    threadEl.hidden = false;
    const el = document.createElement("div");
    el.className = "pc-msg pc-msg-" + role;
    el.innerHTML = simpleMarkdown(text || "");

    if (citations && citations.length) {
      const wrap = document.createElement("div");
      wrap.className = "pc-cites";

      citations.forEach(function (c) {
        const chip = document.createElement("a");
        chip.href = "#" + c.paper_id;
        chip.className = "pc-cite-chip";
        chip.textContent = c.title || c.paper_id;
        chip.title = c.paper_id;
        chip.dataset.paperId = c.paper_id;
        chip.addEventListener("click", function (e) {
          const target = document.getElementById(c.paper_id);
          if (target) {
            e.preventDefault();
            closeDrawer();
            // Wait for the drawer slide-out so the target is visible.
            setTimeout(function () {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              target.classList.add("pc-highlight");
              setTimeout(function () { target.classList.remove("pc-highlight"); }, 2000);
            }, 240);
          }
        });
        wrap.appendChild(chip);

        if (c.audio) {
          const audioBtn = document.createElement("button");
          audioBtn.type = "button";
          audioBtn.className = "pub-link pub-audio-btn pc-audio-chip";
          audioBtn.title = "Listen to audio summary";
          audioBtn.dataset.audio = c.audio;
          audioBtn.dataset.title = c.title || c.paper_id;
          audioBtn.textContent = "🔊";
          wrap.appendChild(audioBtn);
        }

        if (c.bibtex) {
          const bibBtn = document.createElement("button");
          bibBtn.type = "button";
          bibBtn.className = "pc-bib-chip";
          bibBtn.title = "Copy BibTeX to clipboard";
          bibBtn.dataset.bibtex = c.bibtex;
          bibBtn.innerHTML = '<span aria-hidden="true">📋</span> BibTeX';
          bibBtn.addEventListener("click", async function () {
            try {
              await navigator.clipboard.writeText(c.bibtex);
              const original = bibBtn.innerHTML;
              bibBtn.innerHTML = '<span aria-hidden="true">✓</span> Copied';
              setTimeout(function () { bibBtn.innerHTML = original; }, 1500);
            } catch {
              bibBtn.title = "Clipboard unavailable";
            }
          });
          wrap.appendChild(bibBtn);
        }
      });
      el.appendChild(wrap);
    }

    threadEl.appendChild(el);
    threadEl.scrollTop = threadEl.scrollHeight;
    updateDownloadAvailability();
  }

  function addNote(text) {
    threadEl.hidden = false;
    const el = document.createElement("div");
    el.className = "pc-msg pc-msg-note";
    el.textContent = text;
    threadEl.appendChild(el);
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function setLoading(on) {
    sendEl.disabled = on;
    inputEl.disabled = on;
    let ind = document.getElementById("pc-loading-indicator");
    if (on && !ind) {
      ind = document.createElement("div");
      ind.className = "pc-msg pc-msg-loading";
      ind.id = "pc-loading-indicator";
      ind.innerHTML = '<span class="pc-dot"></span><span class="pc-dot"></span><span class="pc-dot"></span>';
      threadEl.hidden = false;
      threadEl.appendChild(ind);
      threadEl.scrollTop = threadEl.scrollHeight;
    } else if (!on && ind) {
      ind.remove();
    }
  }

  function renderQuota() {
    if (!state.quota) return;
    quotaEl.hidden = false;
    quotaEl.textContent = state.quota.used + " of " + state.quota.limit + " questions used today";
  }

  function simpleMarkdown(s) {
    const esc = String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  // ---- Download menu ----
  downloadBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (downloadBtn.disabled) return;
    const willOpen = downloadMenu.hidden;
    downloadMenu.hidden = !willOpen;
    downloadBtn.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", function (e) {
    if (downloadMenu.hidden) return;
    if (!downloadMenu.contains(e.target) && !downloadBtn.contains(e.target)) {
      closeDownloadMenu();
    }
  });

  downloadMenu.querySelectorAll("button[data-format]").forEach(function (item) {
    item.addEventListener("click", function () {
      exportConversation(item.dataset.format);
      closeDownloadMenu();
    });
  });

  function closeDownloadMenu() {
    if (downloadMenu.hidden) return;
    downloadMenu.hidden = true;
    downloadBtn.setAttribute("aria-expanded", "false");
  }

  function updateDownloadAvailability() {
    const has = !!threadEl.querySelector(".pc-msg-user, .pc-msg-assistant");
    downloadBtn.disabled = !has;
  }

  function exportConversation(format) {
    const messages = collectMessages();
    if (!messages.length) return;
    const content = format === "md" ? toMarkdown(messages) : toText(messages);
    const mime = format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "papercast-" + isoStamp() + "." + format;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function collectMessages() {
    const out = [];
    threadEl.querySelectorAll(".pc-msg").forEach(function (el) {
      let role;
      if (el.classList.contains("pc-msg-user")) role = "user";
      else if (el.classList.contains("pc-msg-assistant")) role = "assistant";
      else if (el.classList.contains("pc-msg-note")) role = "note";
      else return; // skip loading indicator and any other variants

      const clone = el.cloneNode(true);
      const cites = clone.querySelector(".pc-cites");
      if (cites) cites.remove();
      const text = (clone.textContent || "").trim();

      const citations = [];
      el.querySelectorAll(".pc-cite-chip").forEach(function (chip) {
        citations.push({
          id: chip.dataset.paperId || chip.title || "",
          title: (chip.textContent || "").trim(),
        });
      });

      out.push({ role: role, text: text, citations: citations });
    });
    return out;
  }

  function toText(messages) {
    const lines = [];
    lines.push("Conversation with PaperCast — Ali Pourmousavi Publications");
    lines.push("Site:     " + SITE_URL);
    lines.push("Exported: " + new Date().toLocaleString());
    if (state.paperId) lines.push("Context:  asking about " + state.paperId);
    lines.push("");
    lines.push("------------------------------------------------------------");
    lines.push("");
    messages.forEach(function (m) {
      const label = m.role === "user" ? "[You]"
                  : m.role === "assistant" ? "[Assistant]"
                  : "[Note]";
      lines.push(label);
      lines.push(m.text);
      if (m.citations.length) {
        lines.push("Citations: " + m.citations.map(function (c) { return c.id; }).join(", "));
      }
      lines.push("");
    });
    return lines.join("\n");
  }

  function toMarkdown(messages) {
    const lines = [];
    lines.push("# Conversation with PaperCast");
    lines.push("");
    lines.push("**Site:** [pourmousavi.github.io](" + SITE_URL + ")  ");
    lines.push("**Exported:** " + new Date().toLocaleString() + "  ");
    if (state.paperId) lines.push("**Context:** asking about `" + state.paperId + "`  ");
    lines.push("");
    lines.push("---");
    lines.push("");
    messages.forEach(function (m) {
      const heading = m.role === "user" ? "### You"
                    : m.role === "assistant" ? "### Assistant"
                    : "_Note_";
      lines.push(heading);
      lines.push("");
      lines.push(m.text);
      lines.push("");
      if (m.citations.length) {
        const cites = m.citations.map(function (c) {
          return "[" + c.title + "](" + SITE_URL + "#" + c.id + ")";
        }).join(", ");
        lines.push("**Citations:** " + cites);
        lines.push("");
      }
    });
    lines.push("---");
    lines.push("");
    lines.push("_Generated from PaperCast — an AI assistant trained on Ali Pourmousavi's publications._");
    return lines.join("\n");
  }

  function isoStamp() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
         + "-" + pad(d.getHours()) + pad(d.getMinutes());
  }
})();
