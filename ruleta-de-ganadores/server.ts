import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1RFexMwM6S2iff-c5pX3rp5C9q28foFWSbqfZ6AwHZCA/edit?gid=1376844313#gid=1376844313";

// Helper to parse CSV string into headers and rows
function parseCSV(csvText: string) {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Header row is first row
  const headers = lines[0].map((h, idx) => h || `Columna ${idx + 1}`);
  const dataRows = lines.slice(1);

  const parsedRows = dataRows.map(row => {
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = row[idx] || '';
    });
    return rowObj;
  });

  return { headers, rows: parsedRows, rawLines: lines };
}

// Extract spreadsheet ID and GID from URL
function extractSheetInfo(urlStr: string) {
  let spreadsheetId = '';
  let gid = '0';

  const idMatch = urlStr.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch) {
    spreadsheetId = idMatch[1];
  }

  const gidMatch = urlStr.match(/[?&]gid=([0-9]+)/) || urlStr.match(/#gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return { spreadsheetId, gid };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint to fetch and parse Google Sheet CSV
  app.get("/api/fetch-sheet", async (req, res) => {
    try {
      const sheetUrl = (req.query.url as string) || DEFAULT_SHEET_URL;
      const selectedColumn = req.query.column as string | undefined;

      const { spreadsheetId, gid } = extractSheetInfo(sheetUrl);

      if (!spreadsheetId) {
        return res.status(400).json({
          error: "URL de Google Sheets inválida. Por favor ingresa un enlace válido."
        });
      }

      // Try multiple endpoints to retrieve CSV from Google Sheets
      const urlsToTry = [
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?gid=${gid}&single=true&output=csv`
      ];

      let csvText = '';
      let fetchError = '';

      for (const url of urlsToTry) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const text = await response.text();
            // Verify it's CSV and not an HTML error / login page
            if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
              csvText = text;
              break;
            }
          }
        } catch (e: any) {
          fetchError = e.message;
        }
      }

      if (!csvText) {
        return res.status(400).json({
          error: "No se pudo acceder a la hoja de Google Sheets. Asegúrate de que el documento esté compartido como 'Cualquier persona con el enlace puede ver'.",
          details: fetchError
        });
      }

      const { headers, rows, rawLines } = parseCSV(csvText);

      // Auto-detect participant column if not provided
      let nameHeader = selectedColumn;
      if (!nameHeader || !headers.includes(nameHeader)) {
        // Priority headers for participant names in Spanish & English
        const candidates = ['nombre', 'participante', 'nombres', 'participantes', 'name', 'nombre completo', 'persona', 'jugador', 'integrantes', 'usuario', 'asistente'];
        const matched = headers.find(h => candidates.includes(h.toLowerCase().trim()));

        if (matched) {
          nameHeader = matched;
        } else if (headers.length > 0) {
          nameHeader = headers[0]; // fallback to 1st column
        }
      }

      // Extract participants list
      const participants: string[] = [];
      if (nameHeader) {
        rows.forEach(r => {
          const val = (r[nameHeader!] || '').trim();
          if (val) {
            participants.push(val);
          }
        });
      }

      return res.json({
        success: true,
        spreadsheetId,
        gid,
        headers,
        selectedColumn: nameHeader || '',
        participants,
        totalRows: rows.length,
        rows,
        rawLinesCount: rawLines.length,
        lastSynced: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Error fetching Google Sheet:", err);
      return res.status(500).json({
        error: "Error interno al obtener datos de Google Sheets",
        details: err.message
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
