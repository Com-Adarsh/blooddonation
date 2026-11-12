import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isLiveConfigured = Boolean(url && key && !url.includes("YOUR_PROJECT_REF") && !key.includes("YOUR_KEY"));
export const supabase = isLiveConfigured ? createClient(url, key) : null;

function client() {
  if (!supabase) throw new Error("Supabase is not configured. Add the project URL and publishable key.");
  return supabase;
}
export async function signInWithEmail(email) {
  return client().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
}
export async function signOut() { return client().auth.signOut(); }
export function onAuthChange(callback) { return client().auth.onAuthStateChange((_event, session) => callback(session)); }
export async function getAreas() {
  const { data, error } = await client().from("campus_areas").select("id,name").eq("active", true).order("name");
  if (error) throw error;
  return data;
}
export async function getDonors() {
  const { data, error } = await client().from("student_donors")
    .select("id,display_name,blood_group,department,study_year,campus_area_id,availability,campus_areas(name)")
    .eq("is_active", true).order("display_name");
  if (error) throw error;
  return data.map((d) => ({ id: d.id, name: d.display_name, group: d.blood_group, department: d.department,
    year: d.study_year, area: d.campus_areas?.name || "Campus", areaId: d.campus_area_id,
    availability: d.availability, initials: d.display_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(), tint: "rose", demo: false }));
}
export async function registerDonor(profile, phone) {
  const api = client();
  const { data: { user } } = await api.auth.getUser();
  if (!user?.email) throw new Error("Sign in with your verified student email before registering.");
  const { error } = await api.rpc("register_my_donor", { p_display_name: profile.name, p_blood_group: profile.group,
    p_department: profile.department, p_study_year: profile.year, p_campus_area_id: profile.areaId,
    p_availability: profile.availability, p_consent: true, p_phone: phone });
  if (error) throw error;
}
export async function addConnectionRequest(request) {
  const api = client();
  const { data: { user } } = await api.auth.getUser();
  if (!user) throw new Error("Sign in before requesting a connection.");
  const { error } = await api.from("connection_requests").insert({ donor_id: request.donorId,
    requester_user_id: user.id, request_blood_group: request.group, urgency: request.urgency, note: request.note || null });
  if (error) throw error;
}
export async function addBloodRequest(request) {
  const api = client();
  const { data: { user } } = await api.auth.getUser();
  if (!user) throw new Error("Sign in before requesting blood support.");
  const { error } = await api.from("blood_requests").insert({ requester_user_id: user.id,
    blood_group: request.group, urgency: request.urgency, location: request.location, note: request.note || null });
  if (error) throw error;
}
export async function getMyActivity() {
  const api = client();
  const { data: { user } } = await api.auth.getUser();
  if (!user) return [];
  const [connections, needs] = await Promise.all([
    api.from("connection_requests").select("id,status,created_at,request_blood_group,donor:student_donors(display_name)").order("created_at", { ascending: false }),
    api.from("blood_requests").select("id,status,created_at,blood_group,urgency,location").order("created_at", { ascending: false })
  ]);
  if (connections.error) throw connections.error;
  if (needs.error) throw needs.error;
  return [
    ...connections.data.map((r) => ({ kind: "request", title: "Connection request", detail: `${r.donor?.display_name || "Donor"} · ${r.request_blood_group}`, status: r.status })),
    ...needs.data.map((r) => ({ kind: "request", title: "Blood support request", detail: `${r.blood_group} · ${r.urgency} · ${r.location}`, status: r.status }))
  ];
}
export async function isCoordinator() {
  const { data, error } = await client().rpc("is_campus_coordinator");
  if (error) throw error;
  return data === true;
}
export async function getCoordinatorQueue() {
  const api = client();
  const [connections, needs] = await Promise.all([
    api.from("connection_requests").select("id,status,created_at,request_blood_group,urgency,note,donor:student_donors(id,display_name,blood_group,department,campus_areas(name))").in("status", ["pending", "accepted"]).order("created_at"),
    api.from("blood_requests").select("id,status,created_at,blood_group,urgency,note,location").in("status", ["pending", "accepted"]).order("created_at")
  ]);
  if (connections.error) throw connections.error;
  if (needs.error) throw needs.error;
  return { connections: connections.data, needs: needs.data };
}
export async function getDonorContact(donorId) {
  const { data, error } = await client().rpc("coordinator_contact_for_donor", { p_donor_id: donorId });
  if (error) throw error;
  return data?.[0] || null;
}
export async function setRequestStatus(table, id, status) {
  const { error } = await client().from(table).update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deactivateDonor(donorId) {
  const { error } = await client().rpc("deactivate_donor", { p_donor_id: donorId });
  if (error) throw error;
}

