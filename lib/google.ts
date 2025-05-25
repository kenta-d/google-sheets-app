// lib/google.ts
import { google } from "googleapis";

export const getSheetsClient = (accessToken: string) => {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ 
      access_token: accessToken,
      token_type: 'Bearer'
    });

    const sheets = google.sheets({ 
      version: "v4", 
      auth,
      timeout: 10000 // 10秒のタイムアウト
    });

    return sheets;
  } catch (error) {
    console.error("Error creating Sheets client:", error);
    throw error;
  }
};
