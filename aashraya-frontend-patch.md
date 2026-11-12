# Aashraya front-end patch (apply to your existing `app.js` and `backend.js`)

Run `202611130001_aashraya_fields.sql` in Supabase first, then make these edits.

## backend.js

1. In `getDonors()`: add `district` to the `.select(...)` list and `district: d.district,` to the mapped object.
2. Replace the `rpc("register_my_donor", {...})` arguments with:
```js
{ p_display_name: profile.name, p_blood_group: profile.group, p_department: profile.department,
  p_study_year: profile.year, p_campus_area_id: profile.areaId, p_availability: profile.availability,
  p_consent: true, p_phone: phone, p_district: profile.district, p_dob: profile.dob,
  p_weight_kg: profile.weight, p_height_cm: profile.height, p_address: profile.address,
  p_passing_date: profile.passingDate }
```
3. In `addBloodRequest()`, add to the insert object:
`needed_by: request.neededBy || null, district: request.district || null`

## app.js

1. Near the top, add:
```js
const districts = ["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"];
const districtOptions = '<option value="">Select district</option>' + districts.map(function (x) { return "<option>" + x + "</option>"; }).join("");
```
2. In the register dialog, directly before the `When are you usually available?` label, insert:
```js
'<label class="field">Date of birth <span>*</span><input name="dob" type="date" required /></label><label class="field">Weight (kg) <span>*</span><input name="weight" type="number" min="30" max="200" step="0.1" required /></label><label class="field">Height (cm) <span>*</span><input name="height" type="number" min="100" max="230" required /></label><label class="field">District <span>*</span><select name="district" required>' + districtOptions + '</select></label><label class="field field-wide">Address <span>*</span><input name="address" required maxlength="160" /></label><label class="field">Expected passing date <span>*</span><input name="passing" type="date" required /></label>' +
```
3. Replace the availability options with Aashraya's three:
`<option>Anytime (emergency)</option><option>Daytime only</option><option>Weekends only</option>`
4. In the register submit handler (live branch), before calling `registerDonor`, add:
```js
const dob = new Date(String(data.get("dob")));
if (isNaN(dob) || dob > new Date(Date.now() - 18 * 365.25 * 864e5)) { showToast("Donors must be 18 or older."); return; }
```
and pass these extra fields inside the object given to `registerDonor`:
```js
district: String(data.get("district")), dob: String(data.get("dob")), weight: Number(data.get("weight")),
height: Number(data.get("height")), address: String(data.get("address")).trim(), passingDate: String(data.get("passing"))
```
5. In the help dialog form-grid, add:
```js
'<label class="field">Needed by <span>*</span><input name="neededBy" type="date" required /></label><label class="field">District <span>*</span><select name="district" required>' + districtOptions + '</select></label>' +
```
and pass `neededBy: String(data.get("neededBy") || ""), district: String(data.get("district") || "")` to `addBloodRequest`.
6. In `card()`, show the district: replace `esc(d.area)` in the first `donor-meta` span with
`esc(d.area) + (d.district ? ", " + esc(d.district) : "")`.
7. Coordinator contact line: replace the `result.textContent = ...` expression with
```js
contact ? "Email: " + contact.email + " · Phone: " + contact.phone + " · " + contact.weight_kg + " kg, " + contact.height_cm + " cm · DOB " + contact.date_of_birth + " · " + contact.address + " · Passing " + contact.expected_passing_date : "No contact record found."
```

## Also check

- Put `aashraya-logo.jpg` inside a `public/` folder. Vite only serves files from `public/` at `/aashraya-logo.jpg`, so a root-level file can disappear from the deployed build.
- Re-save `app.js` as UTF-8 to remove the garbled characters.
- Add the two `VITE_` variables in Vercel and redeploy.
