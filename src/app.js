import { isLiveConfigured, signInWithEmail, signOut, onAuthChange, getAreas, getDonors, registerDonor, addConnectionRequest, addBloodRequest, getMyActivity, isCoordinator, getCoordinatorQueue, getDonorContact, setRequestStatus, deactivateDonor } from "./backend.js";
const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const districts = ["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"];
let areas = ["All campus"];
let areaRows = [];
const state = { group: "All", area: areas[0], district: "All districts", availability: "All availability", search: "", activity: [], selected: null, user: null, live: false, coordinator: false, donors: [] };
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
  return '<article class="donor-card"><div class="donor-card-top"><div class="donor-person"><span class="avatar avatar-' + esc(d.tint) + '">' + esc(d.initials) + '</span><div><div class="donor-name-row"><h3>' + esc(d.name) + '</h3>' +  + '</div><p>' + esc(d.department) + ' <span class="dot"></span> ' + esc(d.year) + '</p></div></div>' + badge(d.group) + '</div><div class="donor-meta"><span>' + ico("pin", 15) + esc(d.area) + '</span><span>' + ico("clock", 15) + esc(d.availability) + '</span></div><div class="donor-card-bottom"><span class="privacy-label">' + ico("shield", 14) + ' Contact stays private</span><button class="button button-outline button-small" data-request="' + esc(d.id) + '">Request connection ' + ico("arrow", 15) + '</button></div></article>';
}
function filtered() {
  const q = state.search.trim().toLowerCase();
  return state.donors.filter(function (d) {
    return (state.group === "All" || d.group === state.group) &&
      (state.area === areas[0] || d.area === state.area) && (state.district === "All districts" || d.district === state.district) && (state.availability === "All availability" || d.availability === state.availability) &&
      (!q || (d.name + " " + d.department + " " + d.area + " " + d.year + " " + (d.district || "")).toLowerCase().includes(q));
  });
}
function renderDonors() {
  const el = document.getElementById("donor-list");
  if (!el) return;
  const found = filtered();
  el.innerHTML = found.length ? found.map(card).join("") : '<div class="empty-state"><span class="empty-icon">' + ico("search", 24) + '</span><h3>' + (state.live ? 'No matching donor profiles' : 'No matching donor profiles') + '</h3><p>Try a different blood group or campus area.</p><button class="button button-soft" data-reset>Clear filters</button></div>';
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
    return '<div class="activity-row"><span class="activity-symbol">' + ico(item.kind === "donor" ? "heart" : "plus", 18) + '</span><div class="activity-copy"><strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + '</span></div><span class="status-chip">' + esc(item.status || ("Saved")) + '</span></div>';
  }).join("") : '<div class="activity-empty"><span class="empty-icon">' + ico("heart", 20) + '</span><p>Your requests will appear here.</p><span>' + "Sign in to view your live requests and donor activity." + '</span></div>';
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
  '<header class="site-header"><div class="header-inner"><a class="brand" href="#top" aria-label="Aashraya home"><span class="brand-mark"><img src="./aashraya-logo.jpg" alt="" /></span><span class="brand-copy"><strong>Aashraya</strong><small>CUSAT Blood Donation Cell</small></span></a><button class="mobile-menu" type="button" aria-label="Open menu" aria-controls="site-nav" aria-expanded="false" data-menu>' + ico("menu", 21) + '</button><nav class="site-nav" id="site-nav"><a class="nav-link is-current" href="#discover">Discover</a><a class="nav-link" href="#how-it-works">How it works</a><a class="nav-link activity-link" href="#activity">My activity <span class="nav-count activity-count">0</span></a></nav><div class="header-actions"><button class="button button-outline button-small" type="button" data-auth>Sign in</button><button class="button button-outline button-small" type="button" data-open-coordinator hidden>Coordinator</button><button class="button button-primary header-cta" type="button" data-open-register>' + ico("plus", 17) + ' Register as donor</button></div></div></header>' +
  '<main id="top"><section class="hero shell"><div class="hero-copy"><span class="eyebrow"><span class="eyebrow-dot"></span> CUSAT students, here for each other</span><h1>When someone needs blood, <em>campus shows up.</em></h1><p class="hero-text">Find a student donor, offer support, and keep help close to home. Aashraya brings the CUSAT community together, one connection at a time.</p><div class="hero-actions"><a class="button button-primary button-large" href="#discover">Find a donor ' + ico("arrow", 18) + '</a><button class="button button-white button-large" data-open-register>' + ico("heart", 18) + ' I can donate</button></div><div class="hero-note">' + ico("shield", 16) + '<span>Donor contact details stay private and are shared only with the campus cell.</span></div></div><div class="hero-art" aria-label="A community blood donation illustration"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-heart">' + ico("heart", 42) + '</div><span class="art-badge badge-a">A+</span><span class="art-badge badge-o">O−</span><span class="art-badge badge-b">B+</span><div class="art-caption"><span class="caption-icon">' + ico("sparkle", 18) + '</span><div><strong>Small act. Real support.</strong><span>Students helping students</span></div></div></div></section>' +
  '<section class="demo-notice shell" id="preview-notice" role="note"><span class="notice-icon">' + ico("shield", 17) + '</span><p><strong>Live service</strong><span>Real donor profiles and requests are securely handled through the Aashraya campus service.</span></p><button class="notice-close" aria-label="Dismiss preview notice" data-dismiss>' + ico("close", 16) + '</button></section>' +
  '<section class="discover-section shell" id="discover"><div class="section-heading"><div><span class="section-kicker">THE CUSAT COMMUNITY</span><h2>Find a campus donor</h2><p>Filter by blood group or campus area to find a student who may be able to help.</p></div><button class="text-button" data-open-help>' + ico("plus", 16) + ' Need blood support?</button></div><div class="search-panel"><div class="search-panel-top"><label class="search-box">' + ico("search", 19) + '<span class="sr-only">Search by name or department</span><input id="donor-search" type="search" placeholder="Search by name or department" autocomplete="off" /></label><label class="select-box"><span>' + ico("pin", 18) + '</span><span class="sr-only">Campus area</span><select id="area-filter">' + options + '</select><span class="select-chevron">⌄</span></label></div><div class="filter-row extra-filters"><label class="select-box"><span class="sr-only">District</span><select id="district-filter"><option>All districts</option><option>Thiruvananthapuram</option><option>Kollam</option><option>Pathanamthitta</option><option>Alappuzha</option><option>Kottayam</option><option>Idukki</option><option>Ernakulam</option><option>Thrissur</option><option>Palakkad</option><option>Malappuram</option><option>Kozhikode</option><option>Wayanad</option><option>Kannur</option><option>Kasaragod</option></select></label><label class="select-box"><span class="sr-only">Availability</span><select id="availability-filter"><option>All availability</option><option>Anytime (emergency)</option><option>Daytime only</option><option>Weekends only</option></select></label></div><div class="filter-row"><span class="filter-label">Blood group</span><div class="filter-chips" role="group" aria-label="Filter by blood group">' + chips + '</div></div></div><div class="results-heading"><div><h3>Available student profiles</h3><span id="result-count" class="result-count" role="status" aria-live="polite"></span></div><span class="sample-key" id="directory-mode">' + ico("sparkle", 14) + ' Live directory</span></div><div class="donor-grid" id="donor-list"></div></section>' +
  '<section class="how-section" id="how-it-works"><div class="shell"><div class="section-heading"><div><span class="section-kicker">A SIMPLE WAY TO HELP</span><h2>Three steps. One campus.</h2><p>Designed to make it easier for students to find support and offer it safely.</p></div></div><div class="steps-grid"><article class="step-card"><span class="step-number">01</span><span class="step-icon">' + ico("search", 21) + '</span><h3>Search nearby</h3><p>Choose a blood group and campus area to browse student profiles.</p></article><article class="step-card"><span class="step-number">02</span><span class="step-icon">' + ico("heart", 21) + '</span><h3>Request a connection</h3><p>Ask to connect without publishing a donor’s phone number.</p></article><article class="step-card"><span class="step-number">03</span><span class="step-icon">' + ico("shield", 21) + '</span><h3>Coordinate with care</h3><p>In a live service, the campus cell can coordinate next steps with consent.</p></article></div></div></section>' +
  '<section class="activity-section shell" id="activity"><div class="activity-panel"><div class="activity-title"><div><span class="section-kicker">YOUR SESSION</span><h2>My activity</h2><p>Requests and registrations you create appear here.</p></div><span class="activity-count-large" id="activity-total">0</span></div><div class="activity-list" id="activity-list"></div></div><aside class="care-note"><span class="care-icon">' + ico("shield", 21) + '</span><h3>Medical decisions stay with professionals</h3><p>Aashraya helps students connect. Donor suitability and care decisions must be assessed by qualified medical staff.</p><button class="text-button" data-open-help>Request blood support ' + ico("arrow", 15) + '</button></aside></section></main>' +
  '<footer class="site-footer"><div class="shell footer-inner"><a class="brand footer-brand" href="#top"><span class="brand-mark"><img src="./aashraya-logo.jpg" alt="" /></span><span class="brand-copy"><strong>Aashraya</strong><small>CUSAT Blood Donation Cell</small></span></a><p>Care travels further when a campus comes together.</p><a href="https://aashraya-cusat-blooddonation-cell.vercel.app/" target="_blank" rel="noopener noreferrer">Aashraya CUSAT ↗</a></div></footer>';
  renderDialogs();
  renderDonors();
  renderActivity();
  bindEvents();
}
function renderDialogs() {
  app.insertAdjacentHTML("beforeend",
  '<dialog class="app-dialog" id="register-dialog" aria-labelledby="register-title"><div class="dialog-head"><div><span class="section-kicker">JOIN THE CAMPUS CIRCLE</span><h2 id="register-title">Register as a donor</h2><p>Share a few details so the CUSAT cell can coordinate in a live service.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><div class="dialog-demo">' + ico("shield", 15) + ' Contact details are private and used only for donor coordination.</div><form id="register-form" class="dialog-form"><div class="form-grid"><label class="field field-wide">Full name <span>*</span><input name="name" required maxlength="70" placeholder="Your name" autocomplete="name" /></label><label class="field">Phone number <span>*</span><input name="phone" required type="tel" inputmode="tel" maxlength="18" placeholder="+91" autocomplete="tel" /></label><label class="field">CUSAT email <span>*</span><input name="email" required type="email" placeholder="you@cusat.ac.in" autocomplete="email" /></label><label class="field">Blood group <span>*</span><select name="group" required><option value="">Select group</option>' + groups.map(function (g) { return '<option>' + g + '</option>'; }).join("") + '</select></label><label class="field">Department <span>*</span><input name="department" required maxlength="90" placeholder="Your department" /></label><label class="field">Study year <span>*</span><select name="year" required><option value="">Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option><option>Final year</option><option>Postgraduate</option></select></label><label class="field">Campus area <span>*</span><select name="area" id="donor-area" required><option value="">Select area</option><option>CUSAT Main Campus</option><option>Kalamassery</option><option>Hostel area</option><option>School of Engineering</option></select></label><label class="field">District <span>*</span><select name="district" required><option value="">Select district</option><option>Kollam</option><option>Ernakulam</option><option>Alappuzha</option><option>Pathanamthitta</option><option>Kottayam</option><option>Idukki</option><option>Thrissur</option><option>Palakkad</option><option>Malappuram</option><option>Kozhikode</option><option>Wayanad</option><option>Kannur</option><option>Kasaragod</option><option>Thiruvananthapuram</option></select></label><label class="field">Date of birth <span>*</span><input name="dob" required type="date" autocomplete="bday" /></label><label class="field">Weight (kg) <span>*</span><input name="weightKg" required type="number" min="30" max="200" step="0.1" placeholder="e.g. 60" /></label><label class="field">Height (cm) <span>*</span><input name="heightCm" required type="number" min="100" max="230" step="0.1" placeholder="e.g. 170" /></label><label class="field field-wide">Address <span>*</span><input name="address" required maxlength="160" placeholder="Current address" autocomplete="street-address" /></label><label class="field">Expected passing date <span>*</span><input name="passingDate" required type="date" /></label><label class="field field-wide">When are you usually available? <span>*</span><select name="availability" required><option value="">Choose availability</option><option>Weekdays</option><option>Evenings</option><option>Weekends</option><option>Anytime (emergency)</option></select></label></div><label class="consent"><input type="checkbox" name="consent" required /><span>I agree that the CUSAT Blood Donation Cell may use these details to coordinate a donor connection. A medical professional will assess eligibility.</span></label><button class="button button-primary button-full" type="submit">Register as donor ' + ico("arrow", 17) + '</button><p class="form-footnote">Your phone and email are never shown on public donor cards.</p></form></dialog>' +
  '<dialog class="app-dialog compact-dialog" id="request-dialog" aria-labelledby="request-title"><div class="dialog-head"><div><span class="section-kicker">AASHRAYA CONNECTION</span><h2 id="request-title">Request a connection</h2><p>Ask to connect with this student donor.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><div class="request-person" id="request-person"></div><form id="connection-form" class="dialog-form"><label class="field">A note for the campus cell <span>(optional)</span><textarea name="note" rows="3" maxlength="180" placeholder="Share a little context. Leave out patient names and medical details."></textarea></label><label class="field">How soon? <select name="urgency" required><option>As soon as possible</option><option>Today</option><option>Planned date</option></select></label><div class="dialog-info">' + ico("shield", 17) + '<span>The campus cell reviews each request before coordinating next steps.</span></div><button class="button button-primary button-full" type="submit">Send request ' + ico("arrow", 17) + '</button></form></dialog>' +
  '<dialog class="app-dialog compact-dialog" id="help-dialog" aria-labelledby="help-title"><div class="dialog-head"><div><span class="section-kicker">CAMPUS SUPPORT</span><h2 id="help-title">Need blood support?</h2><p>In a live service, this request would be routed to the CUSAT Blood Donation Cell.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><form id="help-form" class="dialog-form"><div class="form-grid"><label class="field">Blood group needed <span>*</span><select name="group" required><option value="">Select group</option>' + groups.map(function (g) { return '<option>' + g + '</option>'; }).join("") + '</select></label><label class="field">How soon? <span>*</span><select name="urgency" required><option value="">Choose timing</option><option>As soon as possible</option><option>Today</option><option>Planned date</option></select></label><label class="field">District <span>*</span><select name="district" required><option value="">Select district</option><option>Kollam</option><option>Ernakulam</option><option>Alappuzha</option><option>Pathanamthitta</option><option>Kottayam</option><option>Idukki</option><option>Thrissur</option><option>Palakkad</option><option>Malappuram</option><option>Kozhikode</option><option>Wayanad</option><option>Kannur</option><option>Kasaragod</option><option>Thiruvananthapuram</option></select></label><label class="field">Needed by <span>*</span><input name="neededBy" required type="date" /></label><label class="field field-wide">Campus / hospital area <span>*</span><input name="area" required maxlength="90" placeholder="Where support is needed" /></label><label class="field field-wide">Short context <span>(optional)</span><textarea name="note" rows="3" maxlength="180" placeholder="Do not include patient names or medical records."></textarea></label></div><div class="dialog-info">' + ico("shield", 17) + '<span>For immediate emergencies, contact the hospital or local emergency services directly.</span></div><button class="button button-primary button-full" type="submit">Save request ' + ico("arrow", 17) + '</button></form></dialog>' +
  '<dialog class="app-dialog compact-dialog" id="auth-dialog" aria-labelledby="auth-title"><div class="dialog-head"><div><span class="section-kicker">STUDENT SIGN IN</span><h2 id="auth-title">Sign in with your email</h2><p>We’ll email you a secure sign-in link.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><form id="auth-form" class="dialog-form"><label class="field">Email <span>*</span><input name="email" type="email" required autocomplete="email" placeholder="you@gmail.com" /></label><div class="dialog-info">' + ico("shield", 17) + '<span>Use your Gmail or another email address to receive the secure sign-in link. Donor registration still requires a verified CUSAT student email.</span></div><button class="button button-primary button-full" type="submit">Send sign-in link ' + ico("arrow", 17) + '</button></form></dialog>' +
  '<dialog class="app-dialog" id="coordinator-dialog" aria-labelledby="coordinator-title"><div class="dialog-head"><div><span class="section-kicker">CAMPUS CELL</span><h2 id="coordinator-title">Coordinator queue</h2><p>Review pending requests. Contact details are logged when viewed.</p></div><button class="icon-button" aria-label="Close" data-close>' + ico("close", 19) + '</button></div><div id="coordinator-queue" class="coordinator-queue"></div></dialog><div class="toast" id="toast" role="status" aria-live="polite"></div>');
}
function requestDonor(d) {
  state.selected = d;
  document.getElementById("request-person").innerHTML =
    '<div class="donor-person"><span class="avatar avatar-' + esc(d.tint) + '">' + esc(d.initials) + '</span><div><strong>' + esc(d.name) + '</strong><span>' + esc(d.department) + ' · ' + esc(d.area) + '</span></div></div>' + badge(d.group);
  open("request-dialog");
}
function setAreaChoices() {
  const filter = document.getElementById("area-filter"), donorArea = document.getElementById("donor-area");
  if (!filter || !donorArea || !areaRows.length) return;
  areas = ["All campus"].concat(areaRows.map((a) => a.name));
  filter.innerHTML = areas.map((a) => '<option value="' + esc(a) + '">' + esc(a) + '</option>').join("");
  donorArea.innerHTML = '<option value="">Select area</option>' + areaRows.map((a) => '<option value="' + esc(a.name) + '">' + esc(a.name) + '</option>').join("");
  state.area = areas[0];
}
function updateAuthUI() {
  const button = document.querySelector("[data-auth]"), coordinatorButton = document.querySelector("[data-open-coordinator]");
  if (button) button.textContent = state.user ? "Sign out" : "Sign in";
  if (coordinatorButton) coordinatorButton.hidden = !state.coordinator;
  const notice = document.getElementById("preview-notice");
  if (notice && state.live) notice.hidden = true;
  const registrationInfo = document.querySelector("#register-dialog .dialog-demo");
  if (registrationInfo && state.live) registrationInfo.innerHTML = ico("shield", 15) + " Contact details are private and visible only to you and authorized coordinators.";
  const registerFootnote = document.querySelector("#register-form .form-footnote");
  if (registerFootnote && state.live) registerFootnote.textContent = "Your phone number is never shown on public donor cards.";
  const mode = document.getElementById("directory-mode");
  if (mode && state.live) mode.textContent = "Live directory";
  const heroPrivacy = document.querySelector(".hero-note span");
  if (heroPrivacy && state.live) heroPrivacy.textContent = "Donor contact details are visible only to the authorized campus cell.";
}
async function loadLiveData() {
  state.donors = state.user ? await getDonors() : [];
  state.activity = state.user ? await getMyActivity() : [];
  state.coordinator = state.user ? await isCoordinator() : false;
  updateAuthUI(); renderDonors(); renderActivity();
}
async function loadCoordinatorQueue() {
  if (!state.coordinator) throw new Error("Coordinator access is required.");
  const queue = await getCoordinatorQueue(), el = document.getElementById("coordinator-queue");
  const connectionCards = queue.connections.map((r) => {
    const d = r.donor || {};
    const approved = r.status === "accepted";
    return '<article class="moderation-item"><strong>Connection request · ' + esc(d.display_name || "Donor") + '</strong><p>' + esc(r.request_blood_group) + ' · ' + esc(r.urgency) + ' · ' + esc(d.department || "") + ' · ' + esc(d.campus_areas?.name || "") + ' · ' + esc(r.status) + '</p><p>' + esc(r.note || "No note supplied") + '</p>' + (approved ? '<button class="button button-outline button-small" data-contact="' + esc(d.id || "") + '">View donor contact</button><button class="button button-outline button-small" data-deactivate="' + esc(d.id || "") + '">Deactivate donor</button><p id="contact-' + esc(d.id || "") + '" class="contact-result" aria-live="polite"></p><div class="moderation-actions"><button class="button button-primary button-small" data-table="connection_requests" data-id="' + esc(r.id) + '" data-status="closed">Mark fulfilled / close</button></div>' : '<div class="moderation-actions"><button class="button button-primary button-small" data-table="connection_requests" data-id="' + esc(r.id) + '" data-status="accepted">Approve</button><button class="button button-outline button-small" data-table="connection_requests" data-id="' + esc(r.id) + '" data-status="declined">Decline</button></div>') + '</article>';
  }).join("");
  const helpCards = queue.needs.map((r) => '<article class="moderation-item"><strong>Blood support request</strong><p>' + esc(r.blood_group) + ' · ' + esc(r.urgency) + ' · ' + esc(r.location) + ' · ' + esc(r.status) + '</p><p>' + esc(r.note || "No note supplied") + '</p><div class="moderation-actions">' + (r.status === "pending" ? '<button class="button button-primary button-small" data-table="blood_requests" data-id="' + esc(r.id) + '" data-status="accepted">Approve</button><button class="button button-outline button-small" data-table="blood_requests" data-id="' + esc(r.id) + '" data-status="declined">Decline</button>' : '<button class="button button-primary button-small" data-table="blood_requests" data-id="' + esc(r.id) + '" data-status="closed">Mark fulfilled / close</button>') + '</div></article>').join("");
  el.innerHTML = connectionCards + helpCards || '<div class="activity-empty"><p>No pending requests.</p></div>';
}
async function initializeBackend() {
  if (!isLiveConfigured) return;
  state.live = true; state.donors = []; state.activity = [];
  updateAuthUI(); renderDonors(); renderActivity();
  try { areaRows = await getAreas(); setAreaChoices(); renderDonors(); }
  catch (error) { showToast(error.message || "Could not load campus areas."); }
  onAuthChange((session) => { setTimeout(async () => {
    state.user = session?.user || null;
    try { await loadLiveData(); }
    catch (error) { state.donors = []; state.activity = []; updateAuthUI(); renderDonors(); renderActivity(); showToast(error.message || "Could not load your account data."); }
  }, 0); });
}
function bindEvents() {
  document.querySelectorAll("[data-open-register]").forEach(function (b) { b.addEventListener("click", function () { open("register-dialog"); }); });
  document.querySelectorAll("[data-open-help]").forEach(function (b) { b.addEventListener("click", function () { open("help-dialog"); }); });
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  document.querySelectorAll("[data-group]").forEach(function (b) { b.addEventListener("click", function () { state.group = b.dataset.group; renderDonors(); }); });
  const search = document.getElementById("donor-search"); const districtFilter = document.getElementById("district-filter"); const availabilityFilter = document.getElementById("availability-filter");
  districtFilter.addEventListener("change", function(e){ state.district=e.target.value; renderDonors(); }); availabilityFilter.addEventListener("change", function(e){ state.availability=e.target.value; renderDonors(); }); search.addEventListener("input", function () { state.search = search.value; renderDonors(); });
  document.getElementById("area-filter").addEventListener("change", function (e) { state.area = e.target.value; renderDonors(); });
  document.getElementById("donor-list").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-request]");
    if (btn) {
      const d = state.donors.find(function (item) { return item.id === btn.dataset.request; });
      if (d) requestDonor(d);
    }
    if (e.target.closest("[data-reset]")) {
      state.group = "All"; state.area = areas[0]; state.district = "All districts"; state.availability = "All availability"; state.search = "";
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
    menu.setAttribute("aria-label", on ? "Open menu" : "Close menu");
    nav.classList.toggle("nav-open", !on);
  });
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.getElementById("site-nav").classList.remove("nav-open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open menu");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      document.getElementById("site-nav").classList.remove("nav-open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open menu");
    }
  });
  document.getElementById("register-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const f = e.currentTarget, data = new FormData(f), name = String(data.get("name") || "").trim();
    const department = String(data.get("department") || "").trim();
    if (!name || !department) {
      const field = f.elements.namedItem(!name ? "name" : "department");
      field.setCustomValidity(!name ? "Please enter your full name." : "Please enter your department.");
      field.reportValidity();
      field.addEventListener("input", function () { field.setCustomValidity(""); }, { once: true });
      return;
    }
    if (state.live) {
      if (!state.user) { open("auth-dialog"); showToast("Sign in before registering as a donor."); return; }
      if (String(data.get("email") || "").toLowerCase() !== String(state.user.email || "").toLowerCase()) {
        showToast("Use the same verified email address you signed in with."); return;
      }
      const area = areaRows.find((a) => a.name === String(data.get("area")));
      if (!area) { showToast("Choose an available campus area."); return; }
      const parts = name.split(/\s+/), publicName = parts[0] + (parts.length > 1 ? " " + parts[parts.length - 1][0] + "." : "");
      try {
        await registerDonor({ name: publicName, group: String(data.get("group")), department, year: String(data.get("year")), areaId: area.id, availability: String(data.get("availability")), district: String(data.get("district")), dob: String(data.get("dob")), weightKg: Number(data.get("weightKg")), heightCm: Number(data.get("heightCm")), address: String(data.get("address")).trim(), passingDate: String(data.get("passingDate")) }, String(data.get("phone") || "").trim());
        state.donors = await getDonors();
        state.group = "All"; state.area = areas[0]; state.search = ""; search.value = "";
        document.getElementById("area-filter").value = areas[0];
        renderDonors(); addActivity("donor", "Donor profile added", String(data.get("group")) + " · " + department);
        f.reset(); document.getElementById("register-dialog").close();
        showToast("Your donor profile is saved. The Cell coordinates connections.");
      } catch (error) { showToast(error.message || "Could not save the donor profile."); }
      return;
    }
    showToast("The live Aashraya service is not configured on this deployment.");
    return;
  });
  document.getElementById("connection-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.currentTarget, data = new FormData(form), note = String(data.get("note") || "").trim(), d = state.selected;
    if (state.live && !state.user) { open("auth-dialog"); showToast("Sign in before requesting a connection."); return; }
    if (state.live && d) {
      try {
        await addConnectionRequest({ donorId: d.id, group: d.group, urgency: String(data.get("urgency")), note });
        state.activity = await getMyActivity(); renderActivity();
        form.reset(); document.getElementById("request-dialog").close();
        showToast("Your request was sent to the CUSAT Blood Donation Cell for review.");
      } catch (error) { showToast(error.message || "Could not save your request."); }
      return;
    }
    showToast("The live Aashraya service is not configured on this deployment.");
    return;
  });
  document.getElementById("help-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.currentTarget, data = new FormData(form);
    if (state.live && !state.user) { open("auth-dialog"); showToast("Sign in before requesting blood support."); return; }
    if (state.live) {
      try {
        await addBloodRequest({ group: String(data.get("group")), urgency: String(data.get("urgency")), location: String(data.get("area") || "").trim(), district: String(data.get("district") || ""), neededBy: String(data.get("neededBy") || ""), note: String(data.get("note") || "").trim() });
        state.activity = await getMyActivity(); renderActivity();
        form.reset(); document.getElementById("help-dialog").close();
        showToast("Your request was sent to the CUSAT Blood Donation Cell for review.");
      } catch (error) { showToast(error.message || "Could not save your request."); }
      return;
    }
    showToast("The live Aashraya service is not configured on this deployment.");
    return;
  });
  document.getElementById("auth-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!state.live) { showToast("Add the Supabase project URL and publishable key to enable sign-in."); return; }
    const email = String(new FormData(e.currentTarget).get("email") || "").trim().toLowerCase(); if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Enter a valid email address."); return; }
    try {
      const { error } = await signInWithEmail(email);
      if (error) throw error;
      document.getElementById("auth-dialog").close();
      showToast("Check your email for the secure sign-in link.");
    } catch (error) { showToast(error.message || "Could not send the sign-in link."); }
  });
  document.querySelector("[data-auth]").addEventListener("click", async function () {
    if (!state.live) { showToast("The Aashraya service is temporarily unavailable. Please try again later."); return; }
    if (!state.user) { open("auth-dialog"); return; }
    try { const { error } = await signOut(); if (error) throw error; showToast("You are signed out."); }
    catch (error) { showToast(error.message || "Could not sign out."); }
  });
  document.querySelector("[data-open-coordinator]").addEventListener("click", async function () {
    try { await loadCoordinatorQueue(); open("coordinator-dialog"); }
    catch (error) { showToast(error.message || "Could not load the coordinator queue."); }
  });
  document.getElementById("coordinator-queue").addEventListener("click", async function (e) {
    const deactivateButton = e.target.closest("[data-deactivate]");
    if (deactivateButton) {
      deactivateButton.disabled = true;
      try { await deactivateDonor(deactivateButton.dataset.deactivate); await loadCoordinatorQueue(); await loadLiveData(); }
      catch (error) { showToast(error.message || "Could not deactivate donor."); }
      finally { deactivateButton.disabled = false; }
      return;
    }
    const contactButton = e.target.closest("[data-contact]");
    if (contactButton) {
      contactButton.disabled = true;
      try {
        const contact = await getDonorContact(contactButton.dataset.contact);
        const result = document.getElementById("contact-" + contactButton.dataset.contact);
        result.textContent = contact ? "Email: " + contact.email + " · Phone: " + contact.phone : "No contact record found.";
      } catch (error) { showToast(error.message || "Could not retrieve contact details."); }
      finally { contactButton.disabled = false; }
      return;
    }
    const statusButton = e.target.closest("[data-status]");
    if (statusButton) {
      statusButton.disabled = true;
      try {
        await setRequestStatus(statusButton.dataset.table, statusButton.dataset.id, statusButton.dataset.status);
        await loadCoordinatorQueue();
        state.activity = await getMyActivity(); renderActivity();
      } catch (error) { showToast(error.message || "Could not update request status."); }
      finally { statusButton.disabled = false; }
    }
  });
  document.querySelectorAll("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  });
}
render();
initializeBackend();

