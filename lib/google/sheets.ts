import { google } from "googleapis";
import fs from "fs";
import path from "path";

function getConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not defined.");
  }

  return { sheetId };
}

/**
 * Initializes and returns a Google Sheets API Client.
 *
 * Authentication strategy:
 *   1. If GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars are set
 *      (Vercel / CI), use them directly — no filesystem access needed.
 *   2. Otherwise fall back to the local JSON key file referenced by
 *      GOOGLE_SERVICE_ACCOUNT_KEY_PATH (local development).
 */
export function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  let auth: InstanceType<typeof google.auth.GoogleAuth>;

  if (clientEmail && privateKeyRaw) {
    // ── Vercel / env-var path ──────────────────────────────────────────
    // Vercel stores the PEM key with literal "\n" — convert to real newlines.
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
        ...(process.env.GOOGLE_PROJECT_ID
          ? { project_id: process.env.GOOGLE_PROJECT_ID }
          : {}),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  } else {
    // ── Local development fallback (JSON key file) ─────────────────────
    const serviceAccountKeyPath =
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    if (!serviceAccountKeyPath) {
      throw new Error(
        "Google Sheets auth not configured. " +
          "Set GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY for production, " +
          "or GOOGLE_SERVICE_ACCOUNT_KEY_PATH for local development."
      );
    }

    const absoluteKeyPath = path.isAbsolute(serviceAccountKeyPath)
      ? serviceAccountKeyPath
      : path.join(/*turbopackIgnore: true*/ process.cwd(), serviceAccountKeyPath);

    if (!fs.existsSync(absoluteKeyPath)) {
      throw new Error(
        `Google Service Account key file not found at: ${absoluteKeyPath}`
      );
    }

    auth = new google.auth.GoogleAuth({
      keyFile: absoluteKeyPath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }

  return google.sheets({
    version: "v4",
    auth,
  });
}

/**
 * Fetches rows from a specific worksheet range
 */
export async function getSheetRows(
  range: string
): Promise<string[][]> {
  const { sheetId } = getConfig();

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  return response.data.values || [];
}

/**
 * Fetches rows with transient error retry logic
 */
export async function getSheetRowsWithRetry(
  range: string,
  retries = 3,
  delayMs = 1000
): Promise<string[][]> {
  let attempt = 0;
  let currentDelay = delayMs;

  while (attempt <= retries) {
    try {
      return await getSheetRows(range);
    } catch (error) {
      attempt++;

      if (attempt > retries) {
        throw error;
      }

      console.warn(
        `[Google Sheets API] Error fetching "${range}". Retrying in ${currentDelay}ms... (${attempt}/${retries})`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, currentDelay)
      );

      currentDelay *= 2;
    }
  }

  return [];
}