import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

// Configurações
const SPREADSHEET_ID = "1x2kV3l_002KGYtqwAm5Z_6VfFZzNUF_VtaEeAAtYhik";
const RANGE = "gclid-numero-todos!A:B"; // A = telefone, B = gclid

// Autenticação com service account (use GOOGLE_APPLICATION_CREDENTIALS ou carregue via Secret Manager)
async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

app.post("/api/save-gclid", async (req, res) => {
  try {
    const { phone = "", gclid = "" } = req.body || {};
    // sanitize simples
    const tel = String(phone).trim();
    const gid = String(gclid).trim();

    // Não bloqueie por ausência de telefone; ele é opcional
    // (se quiser, exija ao menos gclid: if (!gid) ...)

    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: "RAW",
      requestBody: {
        values: [[tel, gid]],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao gravar no Sheets:", err);
    return res.status(500).send("Erro ao gravar no Sheets");
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API on :${port}`));
