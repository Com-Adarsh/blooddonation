const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const areas = ["All campus", "CUSAT Main Campus", "Kalamassery", "Hostel area", "School of Engineering"];
const state = {
  group: "All", area: areas[0], search: "", activity: [], selected: null,
  donors: [
    ["Ananya R.", "O+", "School of Engineering", "3rd year", "Hostel area", "Weekends + emergencies", "AR", "rose"],
    ["Rahul K.", "B+", "School of Marine Sciences", "2nd year", "CUSAT Main Campus", "Evenings", "RK", "blue"],
    ["Meera S.", "A-", "Department of Computer Applications", "Final year", "Kalamassery", "Weekdays", "MS", "gold"],
    ["Arjun P.", "AB+", "School of Management Studies", "1st year", "CUSAT Main Campus", "Anytime", "AP", "green"],
    ["Nikhil V.", "O-", "School of Engineering", "4th year", "Hostel area", "Weekends", "NV", "lavender"],
    ["Diya M.", "B-", "Department of Biotechnology", "3rd year", "Kalamassery", "Evenings + emergencies", "DM", "peach"],
    ["Akhil T.", "A+", "School of Legal Studies", "2nd year", "CUSAT Main Campus", "Weekends", "AT", "blue"],
    ["Fathima N.", "AB-", "Department of Applied Chemistry", "Final year", "Hostel area", "Anytime", "FN", "rose"]
  ].map(function (d, i) { return { id: "d" + i, name: d[0], group: d[1], department: d[2], year: d[3], area: d[4], availability: d[5], initials: d[6], tint: d[7], demo: true }; })
};
const app = document.getElementById("app");
const esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); };
function ico(name, size) {
  const p = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
    heart: '<path d="M20.8 8.6c0 5.2-8.8 10.4-8.8 10.4S3.2 13.8 3.2 8.6A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.1Z"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"></path><path d="m9 12 2 2 4-4"></path>',
    close: '<path d="m18 6-12 12M6 6l12 12"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"></path>'
  };
  return '<svg aria-hidden="true" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || "") + '</svg>';
}
function badge(g) { return '<span class="blood-badge">' + esc(g) + '</span>'; }
function card(d) {
  return '<article class="donor-card"><div class="donor-card-top"><div class="donor-person"><span class="avatar avatar-' + esc(d.tint) + '">' + esc(d.initials) + '</span><div><div class="donor-name-row"><h3>' + esc(d.name) + '</h3><span class="' + (d.demo ? "sample-pill" : "new-pill") + '">' + (d.demo ? "Sample" : "New") + '</span></div><p>' + esc(d.department) + ' <span class="dot"></span> ' + esc(d.year) + '</p></div></div>' + badge(d.group) + '</div><div class="donor-meta"><span>' + ico("pin", 15) + esc(d.area) + '</span><span>' + ico("clock", 15) + esc(d.availability) + '</span></div><div class="donor-card-bottom"><span class="privacy-label">' + ico("shield", 14) + ' Contact stays private</span><button class="button button-outline button-small" data-request="' + esc(d.id) + '">Request connection ' + ico("arrow", 15) + '</button></div></article>';
}
function filtered() {
  const q = state.search.trim().toLowerCase();
  return state.donors.filter(function (d) {
    return (state.group === "All" || d.group === state.group) &&
      (state.area === areas[0] || d.area === state.area) &&
      (!q || (d.name + " " + d.department + " " + d.area + " " + d.year).toLowerCase().includes(q));
  });
}
function renderDonors() {
  const el = document.getElementById("donor-list");
  if (!el) return;
  const found = filtered();
  el.innerHTML = found.length ? found.map(card).join("") : '<div class="empty-state"><span class="empty-icon">' + ico("search", 24) + '</span><h3>No matching sample profiles</h3><p>Try a different blood group or campus area.</p><button class="button button-soft" data-reset>Clear filters</button></div>';
  const count = document.getElementById("result-count");
  if (count) count.textContent = found.length + (found.length === 1 ? " profile" : " profiles");
  document.querySelectorAll("[data-group]").forEach(function (b) {
    const active = b.dataset.group === state.group;
    b.classList.toggle("is-selected", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
  });
}
function renderActivity() {
  const el = document.getElementById("activity-list");
  if (!el) return;
  el.innerHTML = state.activity.length ? state.activity.slice().reverse().map(function (item) {
    return '<div class="activity-row"><span class="activity-symbol">' + ico(item.kind === "donor" ? "heart" : "plus", 18) + '</span><div class="activity-copy"><strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + '</span></div><span class="status-chip">Preview</span></div>';
  }).join("") : '<div class="activity-empty"><span class="empty-icon">' + ico("heart", 20) + '</span><p>Your requests will appear here.</p><span>Preview only — nothing is sent to the campus cell.</span></div>';
  document.querySelectorAll(".activity-count").forEach(function (n) { n.textContent = state.activity.length; });
}
function addActivity(kind, title, detail) {
  state.activity.push({ kind: kind, title: title, detail: detail });
  renderActivity();
  const n = document.getElementById("activity-total");
  if (n) n.textContent = state.activity.length;
}
function showToast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("toast-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () { el.classList.remove("toast-visible"); }, 3600);
}
function open(id) { document.getElementById(id).showModal(); }
function render() {
  const chips = ["All"].concat(groups).map(function (g) {
    return '<button class="filter-chip' + (state.group === g ? " is-selected" : "") + '" type="button" data-group="' + g + '" aria-pressed="' + (state.group === g) + '">' + g + '</button>';
  }).join("");
  const options = areas.map(function (a) { return '<option' + (a === state.area ? " selected" : "") + '>' + esc(a) + '</option>'; }).join("");
  app.innerHTML =
  '<header class="site-header"><div class="header-inner"><a class="brand" href="#top" aria-label="Aashraya home"><span class="brand-mark"><img src="/public/aashraya-logo.jpg" alt="" /></span><span class="brand-copy"><strong>Aashraya</strong><small>CUSAT Blood Donation Cell</small></span></a><button class="mobile-menu" aria-label="Open menu" aria-expanded="false" data-menu>' + ico("menu", 21) + '</button><nav class="site-nav" id="site-nav"><a class="nav-link is-current" href="#discover">Discover</a><a class="nav-link" href="#how-it-works">How it works</a><a class="nav-link activity-link" href="#activity">My activity <span class="nav-count activity-count">0</span></a></nav><button class="button button-primary header-cta" data-open-register>' + ico("plus", 17) + ' Register as donor</button></div></header>' +
  '<main id="top"><section class="hero shell"><div class="hero-copy"><span class="eyebrow"><span class="eyebrow-dot"></span> CUSAT students, here for each other</span><h1>When someone needs blood, <em>campus shows up.</em></h1><p class="hero-text">Find a student donor, offer support, and keep help close to home. Aashraya brings the CUSAT community together, one connection at a time.</p><div class="hero-actions"><a class="button button-primary button-large" href="#discover">Find a donor ' + ico("arrow", 18) + '</a><button class="button button-white button-large" data-open-register>' + ico("heart", 18) + ' I can donate</button></div><div class="hero-note">' + ico("shield", 16) + '<span>Donor contact details stay private in this preview.</span></div></div><div class="hero-art" aria-label="A community blood donation illustration"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-heart">' + ico("heart", 42) + '</div><span class="art-badge badge-a">A+</span><span class="art-badge badge-o">O−</span><span class="art-badge badge-b">B+</span><div class="art-caption"><span class="caption-icon">' + ico("sparkle", 18) + '</span><div><strong>Small act. Real support.</strong><span>Students helping students</span></div></div></div></section>' +
  '<section class="demo-notice shell" role="note"><span class="notice-icon">' + ico("shield", 17) + '</span><p><strong>Preview mode</strong><span> Sample student profiles are shown. Requests and donor registrations stay in this browser and do not reach the CUSAT Blood Donation Cell.</span></p><button class="notice-close" aria-label="Dismiss preview notice" data-dismiss>' + ico("close", 16) + '</button></section>' +
  '<section class="discover-section shell" id="discover"><div class="section-heading"><div><span class="section-kicker">THE CUSAT COMMUNITY</span><h2>Find a campus donor</h2><p>Filter by blood group or campus area to find a student who may be able to help.</p></div><button class="text-button" data-open-help>' + ico("plus", 16) + ' Need blood support?</button></div><div class="search-panel"><div class="search-panel-top"><label class="search-box">' + ico("search", 19) + '<span class="sr-only">Search by name or department</span><input id="donor-search" type="search" placeholder="Search by name or department" autocomplete="off" /></label><label class="select-box"><span>' + ico("pin", 18) + '</span><span class="sr-only">Campus area</span><select id="area-filter">' + options + '</select><span class="select-chevron">⌄</span></label></div><div class="filter-row"><span class="filter-label">Blood group</span><div class="filter-chips" role="group" aria-label="Filter by blood group">' + chips + '</div></div></div><div class="results-heading"><div><h3>Available student profiles</h3><span id="result-count" class="result-count"></span></div><span class="sample-key">' + ico("sparkle", 14) + ' Sample data</span></div><div class="donor-grid" id="donor-list"></div></section>' +
  '<section class="how-section" id="how-it-works"><div class="shell"><div class="section-heading"><div><span class="section-kicker">A SIMPLE WAY TO HELP</span><h2>Three steps. One campus.</h2><p>Designed to make it easier for students to find support and offer it safely.</p></div></div><div class="steps-grid"><article class="step-card"><span class="step-number">01</span><span class="step-icon">' + ico("search", 21) + '</span><h3>Search nearby</h3><p>Choose a blood group and campus area to browse student profiles.</p></article><article class="step-card"><span class="step-number">02</span><span class="step-icon">' + ico("heart", 21) + '</span><h3>Request a connection</h3><p>Ask to connect without publishing a donor’s phone number.</p></article><article class="step-card"><span class="step-number">03</span><span class="step-icon">' + ico("shield", 21) + '</span><h3>Coordinate with care</h3><p>In a live service, the campus cell can coordinate next steps with consent.</p></article></div></div></section>' +
  '<section class="activity-section shell" id="activity"><div class="activity-panel"><div class="activity-title"><div><span class="section-kicker">YOUR SESSION</span><h2>My activity</h2><p>Requests and registrations you create in this preview appear here.</p></div><span class="activity-count-large" id="activity-total">0</span></div><div class="activity-list" id="activity-list"></div></div><aside class="care-note"><span class="care-icon">' + ico("shield", 21) + '</span><h3>Medical decisions stay with professionals</h3><p>Aashraya helps students connect. Donor suitability and care decisions must be assessed by qualified medical staff.</p><button class="text-button" data-open-help>Request blood support ' + ico("arrow", 15) + '</button></aside></section></main>' +
  '<footer class="site-footer"><div class="shell footer-inner"><a class="brand footer-brand" href="#top"><span class="brand-mark"><img src="/public/aashraya-logo.jpg" alt="" /></span><span class="brand-copy"><strong>Aashraya</strong><small>CUSAT Blood Donation Cell</small></span></a><p>Care travels further when a campus comes together.</p><a href="https://aashraya-cusat.vercel.app/" target="_blank" rel="noreferrer">Aashraya CUSAT ↗</a></div></footer>';
  renderDialogs();
  renderDonors();
  renderActivity();
  bindEvents();
}
function renderDialogs() {
  app.insertAdjacentHTML("beforeend",
  '<dialog class="app-dialog" id="register-dialog" aria-labelledby="register-title"><div class="dialog-head"><div><span class="section-kicker">JOIN THE CAMPUS CIRCLE</span><h2 id="register-title">Register as a donor</h2><p>Share a few details so the CUSAT cell can coordinate in a live service.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><div class="dialog-demo">' + ico("shield", 15) + ' Preview mode: contact details are not saved or sent.</div><form id="register-form" class="dialog-form"><div class="form-grid"><label class="field field-wide">Full name <span>*</span><input name="name" required maxlength="70" placeholder="Your name" autocomplete="name" /></label><label class="field">Phone number <span>*</span><input name="phone" required type="tel" inputmode="tel" maxlength="18" placeholder="+91" autocomplete="tel" /></label><label class="field">CUSAT email <span>*</span><input name="email" required type="email" placeholder="you@cusat.ac.in" autocomplete="email" /></label><label class="field">Blood group <span>*</span><select name="group" required><option value="">Select group</option>' + groups.map(function (g) { return '<option>' + g + '</option>'; }).join("") + '</select></label><label class="field">Department <span>*</span><input name="department" required maxlength="90" placeholder="Your department" /></label><label class="field">Study year <span>*</span><select name="year" required><option value="">Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option><option>Final year</option><option>Postgraduate</option></select></label><label class="field">Campus area <span>*</span><select name="area" required><option value="">Select area</option><option>CUSAT Main Campus</option><option>Kalamassery</option><option>Hostel area</option><option>School of Engineering</option></select></label><label class="field field-wide">When are you usually available? <span>*</span><select name="availability" required><option value="">Choose availability</option><option>Weekdays</option><option>Evenings</option><option>Weekends</option><option>Anytime (emergency)</option></select></label></div><label class="consent"><input type="checkbox" name="consent" required /><span>I agree that the CUSAT Blood Donation Cell may use these details to coordinate a donor connection. A medical professional will assess eligibility.</span></label><button class="button button-primary button-full" type="submit">Add me to this preview ' + ico("arrow", 17) + '</button><p class="form-footnote">Your phone and email are never shown on public donor cards. This preview does not store them.</p></form></dialog>' +
  '<dialog class="app-dialog compact-dialog" id="request-dialog" aria-labelledby="request-title"><div class="dialog-head"><div><span class="section-kicker">AASHRAYA CONNECTION</span><h2 id="request-title">Request a connection</h2><p>Ask to connect with this student donor.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><div class="request-person" id="request-person"></div><form id="connection-form" class="dialog-form"><label class="field">A note for the campus cell <span>(optional)</span><textarea name="note" rows="3" maxlength="180" placeholder="Share a little context. Leave out patient names and medical details."></textarea></label><div class="dialog-info">' + ico("shield", 17) + '<span>This preview will not message the donor or share contact details.</span></div><button class="button button-primary button-full" type="submit">Save preview request ' + ico("arrow", 17) + '</button></form></dialog>' +
  '<dialog class="app-dialog compact-dialog" id="help-dialog" aria-labelledby="help-title"><div class="dialog-head"><div><span class="section-kicker">CAMPUS SUPPORT</span><h2 id="help-title">Need blood support?</h2><p>In a live service, this request would be routed to the CUSAT Blood Donation Cell.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><form id="help-form" class="dialog-form"><div class="form-grid"><label class="field">Blood group needed <span>*</span><select name="group" required><option value="">Select group</option>' + groups.map(function (g) { return '<option>' + g + '</option>'; }).join("") + '</select></label><label class="field">How soon? <span>*</span><select name="urgency" required><option value="">Choose timing</option><option>As soon as possible</option><option>Today</option><option>Planned date</option></select></label><label class="field field-wide">Campus / hospital area <span>*</span><input name="area" required maxlength="90" placeholder="Where support is needed" /></label><label class="field field-wide">Short context <span>(optional)</span><textarea name="note" rows="3" maxlength="180" placeholder="Do not include patient names or medical records."></textarea></label></div><div class="dialog-info">' + ico("shield", 17) + '<span>For immediate emergencies, contact the hospital or local emergency services directly.</span></div><button class="button button-primary button-full" type="submit">Save preview request ' + ico("arrow", 17) + '</button></form></dialog><div class="toast" id="toast" role="status" aria-live="polite"></div>');
}
function requestDonor(d) {
  state.selected = d;
  document.getElementById("request-person").innerHTML =
    '<div class="donor-person"><span class="avatar avatar-' + esc(d.tint) + '">' + esc(d.initials) + '</span><div><strong>' + esc(d.name) + '</strong><span>' + esc(d.department) + ' · ' + esc(d.area) + '</span></div></div>' + badge(d.group);
  open("request-dialog");
}
function bindEvents() {
  document.querySelectorAll("[data-open-register]").forEach(function (b) { b.addEventListener("click", function () { open("register-dialog"); }); });
  document.querySelectorAll("[data-open-help]").forEach(function (b) { b.addEventListener("click", function () { open("help-dialog"); }); });
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  document.querySelectorAll("[data-group]").forEach(function (b) { b.addEventListener("click", function () { state.group = b.dataset.group; renderDonors(); }); });
  const search = document.getElementById("donor-search");
  search.addEventListener("input", function () { state.search = search.value; renderDonors(); });
  document.getElementById("area-filter").addEventListener("change", function (e) { state.area = e.target.value; renderDonors(); });
  document.getElementById("donor-list").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-request]");
    if (btn) {
      const d = state.donors.find(function (item) { return item.id === btn.dataset.request; });
      if (d) requestDonor(d);
    }
    if (e.target.closest("[data-reset]")) {
      state.group = "All"; state.area = areas[0]; state.search = "";
      search.value = ""; document.getElementById("area-filter").value = areas[0]; renderDonors();
    }
  });
  document.querySelectorAll("[data-dismiss]").forEach(function (b) {
    b.addEventListener("click", function () {
      const n = b.closest(".demo-notice"); n.classList.add("notice-dismissed");
      setTimeout(function () { n.remove(); }, 250);
    });
  });
  const menu = document.querySelector("[data-menu]");
  menu.addEventListener("click", function () {
    const nav = document.getElementById("site-nav");
    const on = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", on ? "false" : "true");
    nav.classList.toggle("nav-open", !on);
  });
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.getElementById("site-nav").classList.remove("nav-open");
      menu.setAttribute("aria-expanded", "false");
    });
  });
  document.getElementById("register-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const f = e.currentTarget, data = new FormData(f), name = String(data.get("name")).trim();
    const parts = name.split(/\s+/);
    const profile = {
      id: "local-" + Date.now(),
      name: parts[0] + (parts.length > 1 ? " " + parts.slice(1).map(function (p) { return p[0] + "."; }).join(" ") : ""),
      group: String(data.get("group")), department: String(data.get("department")).trim(),
      year: String(data.get("year")), area: String(data.get("area")),
      availability: String(data.get("availability")),
      initials: parts.map(function (p) { return p[0]; }).join("").slice(0, 2).toUpperCase(),
      tint: "rose", demo: false
    };
    state.donors.unshift(profile);
    state.group = "All"; state.area = areas[0]; state.search = "";
    search.value = ""; document.getElementById("area-filter").value = areas[0];
    renderDonors(); addActivity("donor", "Donor profile added", profile.group + " · " + profile.department);
    f.reset(); document.getElementById("register-dialog").close();
    showToast("Added to this preview. Contact details were not saved.");
  });
  document.getElementById("connection-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const note = String(new FormData(e.currentTarget).get("note") || "").trim();
    const d = state.selected;
    if (d) addActivity("request", "Connection request saved", d.name + " · " + d.group + (note ? " · Note added" : ""));
    e.currentTarget.reset(); document.getElementById("request-dialog").close();
    showToast("Saved in this preview only. No message was sent.");
  });
  document.getElementById("help-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    addActivity("request", "Blood support request saved", data.get("group") + " · " + data.get("urgency") + " · " + data.get("area"));
    e.currentTarget.reset(); document.getElementById("help-dialog").close();
    showToast("Saved in this preview only. Contact the hospital for immediate help.");
  });
  document.querySelectorAll("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  });
}
render();
