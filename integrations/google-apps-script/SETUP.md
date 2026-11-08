# KOMI Towers recruitment → private Google Sheet

## What is already done
- Native private Google Sheet: https://docs.google.com/spreadsheets/d/1Yahxmyxloy2PrQM0lZizHYk-l_tAAJ0XX53dk6TnUHo/edit
- Tab: **Jelentkezők**, with headers for all application fields, filters and internal status.
- Receiver source: `integrations/google-apps-script/Code.gs`.
- `work-with-us.html` form is set up to post to the receiver, **but submission is intentionally disabled until the correct deployed URL is configured**.
- Only the development branch has these changes. Do not merge until end-to-end tested.

## One-time account setup (by Google Sheet owner)
1. Open the spreadsheet above, logged into your **own** Google account.
2. Choose **Extensions → Apps Script**.
3. Replace the code in `Code.gs` with the complete content of [Code.gs](./Code.gs); save.
4. Click **Deploy → New deployment → Web app**.
5. Choose **Execute as: Me** (Google Sheet owner), **Who has access: Anyone** (to allow applicants without Google sign-in). Confirm the Google authorization requested by Google. Do **not** share credentials or tokens.
6. Copy the **Web app URL** ending in `/exec`; send that URL back in chat.
7. The assistant updates the constant `KOMI_GOOGLE_APPS_SCRIPT_URL` in `work-with-us.html`, then commits to the development branch.

## Prior to going live
- Verify the existing KOMI Towers recruitment privacy notice covers data collection, purposes, legal basis, retention period, data controller and rights. Add the **actual clickable URL** next to the required acknowledgement in all three languages.
- Test a **dummy** EN, SK, HU application from the deployed form and check each lands in a new Sheet row with the language and fields preserved. Do not submit real personal data while testing.
- Confirm invalid/blank fields are rejected, the honeypot filters bot fields, and a failed save **does not** show a success message.
- Confirm Google Sheet's sharing remains **Restricted**, and the Apps Script only writes; no `doGet` reads applicant data.
- Verify the current site deploys through GitHub Pages after merging to `main`.
- Consider managed anti-spam/CAPTCHA if abuse appears; a public form endpoint cannot be made private while accepting anonymous applicants.

## Operational notes
The Apps Script Web app is public-facing **only as an intake endpoint**. It runs under the Sheet owner's account and writes new rows. It does not grant applicants read access to the spreadsheet. Keep `Execute as: Me`, verify code before authorizing, and do not give edit permission to the Sheet to applicants.

The browser navigates to a branded multilingual receipt page rendered by Google Apps Script upon successful POST. Saving failures show an error rather than a false confirmation.

Form fields:
`full_name`, `email`, `phone`, `country`, `applicant_type`, `experience`, `available_from`, `crew_size`, `details`, `language`, `privacy_acknowledged` plus spam honeypot `bot-field`.

Application statuses are edited privately in the spreadsheet: Új, Megkerestük, Interjú, Alkalmas, Képzés szükséges, Elutasítva.
