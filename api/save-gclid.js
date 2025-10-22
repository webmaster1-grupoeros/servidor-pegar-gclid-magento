import { google } from "googleapis";

export default async function handler(req, res) {
  // CORS: permita seus domínios
  const ALLOW = [
    "https://www.brasilbanheiras.com.br",
    "https://brasilbanheiras.com.br"
  ];
  const origin = req.headers.origin;
  if (ALLOW.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-api-token");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method not allowed" });

  try {
    // (Opcional) Se quiser chave de API, descomente:
    // const got = String(req.headers["x-api-token"] || "").trim();
    // const allow = String(process.env.API_TOKEN || "").split(",").map(s=>s.trim()).filter(Boolean);
    // if (allow.length && !allow.includes(got)) return res.status(401).json({ ok:false, error:"unauthorized" });

    const { phone = "", gclid = "" } = req.body || {};
    const tel = String(phone).trim();
    const gid = String(gclid).trim();
    if (!tel && !gid) return res.status(400).json({ ok:false, error:"phone or gclid required" });

    // Auth com service account (JSON em variável de ambiente)
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Planilha/guia
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = process.env.SHEETS_RANGE || "gclid-numero-todos!A:B";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [[tel, gid]] }
    });

    return res.status(200).json({ ok:true });
  } catch (err) {
    console.error("sheet write error:", err);
    return res.status(500).json({ ok:false, error:"sheet write error" });
  }
}
