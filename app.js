(function () {
  const MAX_RANK = 8;
  const POSTERS = window.POSTERS || [];
  const AWARDS = window.AWARDS || [];
  const CONFIG = window.C4C_CONFIG || {};

  // State: array of { id, award } in ranked order
  const state = {
    ballot: [],
    allBallots: [],     // all previously-submitted ballots (from JSONBlob)
    results: {},        // posterId -> { votes, avgRank, awardCounts }
  };

  // --- Helpers ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const getPoster = (id) => POSTERS.find((p) => p.id === id);
  const gradeLabel = (g) => {
    if (g == null) return "Grade not recorded";
    if (g <= 8) return `Grade ${g} (Jr. High)`;
    if (g <= 12) return `Grade ${g} (Sr. High)`;
    return `Grade ${g}`;
  };

  // --- Render awards section ---
  function renderAwards() {
    const grid = $("#awards-grid");
    grid.innerHTML = AWARDS.map(
      (a) => `
      <div class="award-card ${a.id}">
        <h3>${a.label} Award</h3>
        <p>${a.description}</p>
      </div>`
    ).join("");
  }

  // --- Render posters grid ---
  function renderPosters() {
    const grid = $("#posters-grid");
    grid.innerHTML = POSTERS.map(
      (p) => `
      <div class="poster-card" data-id="${p.id}">
        <div class="thumb-wrap">
          <img src="${p.image}" alt="Poster by ${p.artist}" loading="lazy" />
        </div>
        <div class="meta">
          <span class="artist">${p.artist}</span>
          <span class="grade">${gradeLabel(p.grade)}</span>
        </div>
        <span class="zoom-hint">Click to zoom</span>
        <div class="results" data-results-for="${p.id}">
          <div class="res-headline"><span>Loading votes…</span></div>
        </div>
      </div>`
    ).join("");
    $("#poster-count").textContent = POSTERS.length;

    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".poster-card");
      if (!card) return;
      const id = card.dataset.id;
      // If shift key → toggle ballot; otherwise open modal
      if (e.shiftKey) {
        toggleBallot(id);
      } else {
        openModal(id);
      }
    });
  }

  // --- Modal with in-modal "add to ballot" button ---
  function openModal(id) {
    const p = getPoster(id);
    if (!p) return;
    const body = $("#modal-body");
    const info = $("#modal-info");
    body.innerHTML = `<img src="${p.image}" alt="${p.artist}" />`;
    const img = body.querySelector("img");
    img.addEventListener("click", () => img.classList.toggle("zoomed"));

    const onBallot = state.ballot.find((b) => b.id === id);
    const btnLabel = onBallot ? "✓ Remove from ballot" : "+ Add to ballot";
    const origLink = p.original && p.original !== p.image
      ? `<a href="${p.original}" target="_blank" rel="noopener">Open original PDF</a> · `
      : "";
    info.innerHTML = `
      <strong>${p.artist}</strong> — ${gradeLabel(p.grade)}<br/>
      ${origLink}
      <button type="button" class="btn btn-primary" id="modal-add">${btnLabel}</button>
    `;
    $("#modal-add").addEventListener("click", () => {
      toggleBallot(id);
      openModal(id); // refresh button label
    });
    $("#modal").classList.add("open");
    $("#modal").setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    $("#modal").setAttribute("aria-hidden", "true");
    $("#modal-body").innerHTML = "";
  }

  // --- Ballot management ---
  function toggleBallot(id) {
    const idx = state.ballot.findIndex((b) => b.id === id);
    if (idx >= 0) {
      state.ballot.splice(idx, 1);
    } else {
      if (state.ballot.length >= MAX_RANK) {
        alert(`You can only rank up to ${MAX_RANK} posters. Remove one first, or move it.`);
        return;
      }
      state.ballot.push({ id, award: "" });
    }
    renderBallot();
    updateCardSelection();
  }

  function moveBallot(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= state.ballot.length) return;
    const [item] = state.ballot.splice(index, 1);
    state.ballot.splice(target, 0, item);
    renderBallot();
  }

  function setAward(id, award) {
    const item = state.ballot.find((b) => b.id === id);
    if (item) item.award = award;
    renderBallot();
  }

  function clearBallot() {
    if (state.ballot.length === 0) return;
    if (!confirm("Clear your entire ballot?")) return;
    state.ballot = [];
    renderBallot();
    updateCardSelection();
  }

  function renderBallot() {
    const list = $("#ballot-list");
    $("#ballot-count").textContent = `${state.ballot.length} / ${MAX_RANK}`;
    if (state.ballot.length === 0) {
      list.innerHTML = `<li class="ballot-empty">No posters selected yet. Click a poster below to zoom, then add it to your ballot.</li>`;
      return;
    }
    list.innerHTML = state.ballot
      .map((item, i) => {
        const p = getPoster(item.id);
        if (!p) return "";
        const awardOptions = AWARDS.map(
          (a) => `<option value="${a.id}" ${item.award === a.id ? "selected" : ""}>${a.label}</option>`
        ).join("");
        return `
          <li class="ballot-item" data-id="${p.id}">
            <span class="rank-num">${i + 1}</span>
            <img class="mini-thumb" src="${p.image}" alt="" />
            <div>
              <div class="ballot-artist">${p.artist}</div>
              <div class="ballot-id">${gradeLabel(p.grade)}</div>
            </div>
            <select class="award-select" data-id="${p.id}" aria-label="Award for ${p.artist}">
              <option value="">— choose award —</option>
              ${awardOptions}
            </select>
            <div class="move-btns">
              <button type="button" data-action="up" title="Move up">▲</button>
              <button type="button" data-action="down" title="Move down">▼</button>
              <button type="button" class="remove-btn" data-action="remove" title="Remove">×</button>
            </div>
          </li>
        `;
      })
      .join("");
  }

  function updateCardSelection() {
    const selected = new Set(state.ballot.map((b) => b.id));
    $$(".poster-card").forEach((card, idx) => {
      const id = card.dataset.id;
      if (selected.has(id)) {
        card.classList.add("selected");
        const rank = state.ballot.findIndex((b) => b.id === id) + 1;
        let badge = card.querySelector(".rank-badge");
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "rank-badge";
          card.appendChild(badge);
        }
        badge.textContent = rank;
      } else {
        card.classList.remove("selected");
        const badge = card.querySelector(".rank-badge");
        if (badge) badge.remove();
      }
    });
  }

  // --- Ballot event delegation ---
  function wireBallotEvents() {
    const list = $("#ballot-list");
    list.addEventListener("click", (e) => {
      const li = e.target.closest(".ballot-item");
      if (!li) return;
      const idx = Array.from(list.children).indexOf(li);
      const action = e.target.dataset.action;
      if (action === "up") moveBallot(idx, -1);
      else if (action === "down") moveBallot(idx, 1);
      else if (action === "remove") {
        state.ballot.splice(idx, 1);
        renderBallot();
        updateCardSelection();
      }
    });
    list.addEventListener("change", (e) => {
      if (e.target.classList.contains("award-select")) {
        setAward(e.target.dataset.id, e.target.value);
      }
    });
  }

  // --- Submit / Download ---
  function buildPayload() {
    const name = $("#voter-name").value.trim();
    const affiliation = $("#voter-affiliation").value.trim();
    return {
      voterName: name,
      voterAffiliation: affiliation,
      submittedAt: new Date().toISOString(),
      ballot: state.ballot.map((item, i) => {
        const p = getPoster(item.id);
        return {
          rank: i + 1,
          posterId: item.id,
          artist: p ? p.artist : "(unknown)",
          grade: p ? p.grade : null,
          award: item.award || null,
        };
      }),
    };
  }

  function validatePayload(payload) {
    if (!payload.voterName) return "Please enter your name before submitting.";
    if (payload.ballot.length === 0) return "Your ballot is empty. Add at least one poster.";
    const missingAward = payload.ballot.find((b) => !b.award);
    if (missingAward)
      return `Please assign an award to every ranked poster (missing for "${missingAward.artist}" at rank ${missingAward.rank}).`;
    return null;
  }

  // --- Backend: JSONBin.io (CORS-friendly) with local-storage fallback ---
  function jsonbinConfigured() {
    return (
      CONFIG.BACKEND === "jsonbin" &&
      CONFIG.JSONBIN_BIN_ID &&
      CONFIG.JSONBIN_MASTER_KEY &&
      !CONFIG.JSONBIN_BIN_ID.startsWith("PASTE_") &&
      !CONFIG.JSONBIN_MASTER_KEY.startsWith("PASTE_")
    );
  }

  function jsonbinHeaders() {
    return {
      "Content-Type": "application/json",
      "X-Master-Key": CONFIG.JSONBIN_MASTER_KEY,
      "X-Bin-Versioning": "false",
    };
  }

  async function fetchAllBallots() {
    if (jsonbinConfigured()) {
      try {
        const url = `https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`;
        const res = await fetch(url, {
          headers: { "X-Master-Key": CONFIG.JSONBIN_MASTER_KEY },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("GET " + res.status);
        const data = await res.json();
        const record = data && data.record ? data.record : { ballots: [] };
        if (!Array.isArray(record.ballots)) record.ballots = [];
        return record;
      } catch (e) {
        console.warn("JSONBin fetch failed, falling back to local:", e);
      }
    }
    // local fallback
    try {
      const raw = localStorage.getItem("c4c_ballots");
      return raw ? JSON.parse(raw) : { ballots: [] };
    } catch (e) {
      return { ballots: [] };
    }
  }

  async function putAllBallots(doc) {
    if (jsonbinConfigured()) {
      const url = `https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: jsonbinHeaders(),
        body: JSON.stringify(doc),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error("PUT " + res.status + " " + txt);
      }
      return res;
    }
    // local fallback
    localStorage.setItem("c4c_ballots", JSON.stringify(doc));
    return { ok: true };
  }

  function showBackendBanner() { /* disabled */ }

  async function submitBallot() {
    const payload = buildPayload();
    const err = validatePayload(payload);
    if (err) { alert(err); return; }

    const btn = $("#submit-btn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    // Fetch current, append (or replace), PUT back. One retry on conflict.
    async function tryOnce() {
      const doc = await fetchAllBallots();
      let ballots = doc.ballots || [];
      if (CONFIG.DEDUPE_BY_NAME) {
        const norm = payload.voterName.trim().toLowerCase();
        ballots = ballots.filter(
          (b) => (b.voterName || "").trim().toLowerCase() !== norm
        );
      }
      ballots.push(payload);
      await putAllBallots({ ballots });
      return ballots;
    }

    try {
      let ballots;
      try {
        ballots = await tryOnce();
      } catch (e) {
        console.warn("First submit attempt failed, retrying:", e);
        await new Promise((r) => setTimeout(r, 600));
        ballots = await tryOnce();
      }
      state.allBallots = ballots;
      computeResults();
      renderResultsOnCards();
      // Keep the ballot on screen so voter can see their votes reflected below each poster.
      showSuccess(
        `Thanks, ${payload.voterName}! Your ballot has been recorded. Live results are now shown below each poster.`
      );
    } catch (e) {
      console.error("Submit failed:", e);
      if (
        confirm(
          "Online submission failed. Download your ballot as a file to send manually?"
        )
      ) {
        downloadBallot(payload);
        showSuccess("Ballot saved as a file. Please email it to the organizers.");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit ballot";
    }
  }

  function downloadBallot(payload) {
    payload = payload || buildPayload();
    const err = validatePayload(payload);
    if (err) { alert(err); return; }
    const safeName = (payload.voterName || "ballot").replace(/[^a-z0-9]+/gi, "_");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `c4c-ballot-${safeName}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function showSuccess(msg) {
    $("#success-msg").textContent = msg;
    $("#success-modal").classList.add("open");
  }

  // --- Results aggregation + render ---
  function computeResults() {
    const results = {};
    POSTERS.forEach((p) => {
      results[p.id] = { votes: 0, rankSum: 0, awardCounts: {} };
    });
    (state.allBallots || []).forEach((b) => {
      (b.ballot || []).forEach((entry) => {
        const r = results[entry.posterId];
        if (!r) return;
        r.votes += 1;
        r.rankSum += entry.rank || 0;
        if (entry.award) {
          r.awardCounts[entry.award] = (r.awardCounts[entry.award] || 0) + 1;
        }
      });
    });
    Object.keys(results).forEach((id) => {
      const r = results[id];
      r.avgRank = r.votes > 0 ? r.rankSum / r.votes : null;
    });
    state.results = results;
  }

  function renderResultsOnCards() {
    const totalBallots = (state.allBallots || []).length;
    POSTERS.forEach((p) => {
      const el = document.querySelector(`[data-results-for="${p.id}"]`);
      if (!el) return;
      const r = state.results[p.id] || { votes: 0, avgRank: null, awardCounts: {} };
      if (r.votes === 0) {
        el.innerHTML = `
          <div class="res-headline">
            <span class="no-votes">No votes yet</span>
            <span>${totalBallots} ballot${totalBallots === 1 ? "" : "s"} cast</span>
          </div>`;
        return;
      }
      const chips = AWARDS.map((a) => {
        const n = r.awardCounts[a.id] || 0;
        if (n === 0) return "";
        return `<span class="award-chip ${a.id}">${a.label} × ${n}</span>`;
      })
        .filter(Boolean)
        .join("");
      const avg = r.avgRank != null ? r.avgRank.toFixed(2) : "—";
      el.innerHTML = `
        <div class="res-headline">
          <span><span class="votes">${r.votes} vote${r.votes === 1 ? "" : "s"}</span> · avg rank ${avg}</span>
          <span>of ${totalBallots}</span>
        </div>
        <div class="res-awards">${chips || '<span class="no-votes">no award tags</span>'}</div>
      `;
    });
  }

  async function loadAndRenderResults() {
    const doc = await fetchAllBallots();
    state.allBallots = doc.ballots || [];
    computeResults();
    renderResultsOnCards();
  }

  // --- Thumbnail size slider ---
  function wireThumbSlider() {
    const slider = $("#thumb-size");
    const grid = $("#posters-grid");
    slider.addEventListener("input", () => {
      grid.style.setProperty("--thumb-min", `${slider.value}px`);
    });
    grid.style.setProperty("--thumb-min", `${slider.value}px`);
  }

  // --- Init ---
  function init() {
    renderAwards();
    renderPosters();
    renderBallot();
    wireBallotEvents();
    wireThumbSlider();

    $("#modal-close").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    $("#submit-btn").addEventListener("click", submitBallot);
    $("#download-btn").addEventListener("click", () => downloadBallot());
    $("#clear-ballot").addEventListener("click", clearBallot);
    $("#success-close").addEventListener("click", () => $("#success-modal").classList.remove("open"));

    $("#ballot-toggle").addEventListener("click", () => {
      const b = $("#ballot");
      b.classList.toggle("collapsed");
      $("#ballot-toggle").textContent = b.classList.contains("collapsed") ? "+" : "—";
    });

    showBackendBanner();
    // Prime the cards with the "loading votes..." placeholder, then fetch.
    computeResults();
    renderResultsOnCards();
    loadAndRenderResults();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
