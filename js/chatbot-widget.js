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
  };

  // ---- Hero shell ----
  root.innerHTML = `
    <div class="pc-hero" role="region" aria-label="Publications chatbot">
      <div class="pc-hero-header">
        <span class="pc-hero-title">Ask about Ali's research</span>
        <span class="pc-hero-hint">Powered by Cloudflare Workers AI · 20 questions/day</span>
      </div>
      <form class="pc-input-wrap" novalidate>
        <input class="pc-input" type="text" maxlength="500"
               placeholder="e.g. Which papers cover demand response?"
               aria-label="Ask the publications chatbot" />
        <button class="pc-send" type="submit" aria-label="Send question">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 8h12M9 3l5 5-5 5"/>
          </svg>
        </button>
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
  `;

  const formEl = root.querySelector(".pc-input-wrap");
  const inputEl = root.querySelector(".pc-input");
  const sendEl = root.querySelector(".pc-send");
  const threadEl = root.querySelector(".pc-thread");
  const contextEl = root.querySelector(".pc-context");
  const quotaEl = root.querySelector(".pc-quota");

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    submit();
  });

  root.querySelectorAll(".pc-suggestions button").forEach(function (b) {
    b.addEventListener("click", function () {
      inputEl.value = b.dataset.q;
      submit();
    });
  });

  // ---- Per-paper "Ask" buttons via DOM observation ----
  // publications.js renders entries asynchronously and re-renders on filter/search changes.
  // We observe the publications container and (re-)wire any unwired .publication-item.
  const wireAskButtons = function () {
    document.querySelectorAll(".publication-item:not([data-pc-wired])").forEach(function (item) {
      item.setAttribute("data-pc-wired", "1");
      const id = item.id;
      if (!id) return;
      const linksWrap = item.querySelector(".pub-links");
      if (!linksWrap) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pc-ask-btn";
      btn.title = "Ask the chatbot about this paper";
      btn.setAttribute("data-paper-id", id);
      btn.innerHTML = '<span aria-hidden="true">💬</span> Ask';
      btn.addEventListener("click", function () { openWithPaper(id); });
      linksWrap.appendChild(btn);
    });
  };

  const pubsContainer = document.getElementById("publications-container");
  if (pubsContainer) {
    const observer = new MutationObserver(wireAskButtons);
    observer.observe(pubsContainer, { childList: true, subtree: true });
    wireAskButtons(); // initial sweep in case render already finished
  }

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

  function openWithPaper(id) {
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
    inputEl.focus();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
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
        // Citation chip — links to the existing rendered entry on the same page.
        const chip = document.createElement("a");
        chip.href = "#" + c.paper_id;
        chip.className = "pc-cite-chip";
        chip.textContent = c.title || c.paper_id;
        chip.title = c.paper_id;
        chip.addEventListener("click", function (e) {
          const target = document.getElementById(c.paper_id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.classList.add("pc-highlight");
            setTimeout(function () { target.classList.remove("pc-highlight"); }, 2000);
          }
        });
        wrap.appendChild(chip);

        // Audio chip — class pub-audio-btn triggers the site's existing audio player
        // via the event-delegated handler in publications.js. Identical visual to the
        // per-paper 🔊 button (32×32 round, .pub-link).
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

        // BibTeX copy chip
        if (c.bibtex) {
          const bibBtn = document.createElement("button");
          bibBtn.type = "button";
          bibBtn.className = "pc-bib-chip";
          bibBtn.title = "Copy BibTeX to clipboard";
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
})();
