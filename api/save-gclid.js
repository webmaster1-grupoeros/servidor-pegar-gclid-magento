// api/save-gclid.js
import { google } from "googleapis";

export default async function handler(req, res) {
  // CORS básico (ajuste o domínio se quiser travar)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type, x-api-token");
    return res.status(200).end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.headers["x-api-token"] !== process.env.API_TOKEN) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method not allowed" });
  }

  try {
    const { phone = "", gclid = "" } = req.body || {};
    if (!phone && !gclid) {
      return res.status(400).json({ ok: false, error: "phone or gclid required" });
    }

    // Service Account vem inteira por env var (string JSON)
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: process.env.SHEETS_RANGE || "gclid-numero-todos!A:B",
      valueInputOption: "RAW",
      requestBody: { values: [[String(phone).trim(), String(gclid).trim()]] },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "sheet write error" });
  }
}
