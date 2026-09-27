import { google } from "googleapis";
import fs from "fs";
import path from "path";

function getConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountKeyPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not defined.");
  }

  if (!serviceAccountKeyPath) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable is not defined."
    );
  }
  return {
    sheetId,
    serviceAccountKeyPath,
  };
}

/**
 * Initializes and returns a Google Sheets API Client
 */
export function getSheetsClient() {
  const { serviceAccountKeyPath } = getConfig();

  const absoluteKeyPath = path.isAbsolute(serviceAccountKeyPath)
    ? serviceAccountKeyPath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), serviceAccountKeyPath);

  if (!fs.existsSync(absoluteKeyPath)) {
    throw new Error(
      `Google Service Account key file not found at: ${absoluteKeyPath}`
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: absoluteKeyPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

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