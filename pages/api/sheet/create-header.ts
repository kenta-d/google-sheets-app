import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { google } from "googleapis";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    if (!session.accessToken) {
      console.error("アクセストークンがありません");
      return res.status(401).json({ error: "アクセストークンがありません" });
    }

    const { headers } = req.body;
    console.log("ヘッダー行作成リクエスト:", { headers });

    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ error: "無効なリクエストです" });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google"
    );

    auth.setCredentials({
      access_token: session.accessToken,
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      console.error("スプレッドシートIDが設定されていません");
      return res.status(500).json({ error: "スプレッドシートIDが設定されていません" });
    }

    console.log("スプレッドシートID:", spreadsheetId);

    try {
      // スプレッドシートの情報を取得
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      console.log("スプレッドシート情報:", spreadsheet.data);

      // シートIDを取得
      const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "シート1");
      if (!sheet?.properties?.sheetId) {
        throw new Error("シート1が見つかりません");
      }
      const sheetId = sheet.properties.sheetId;
      console.log("シートID:", sheetId);

      // 現在のデータを確認
      const currentData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `シート1!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      });
      console.log("現在のヘッダー行:", currentData.data.values);

      // ヘッダー行が既に存在する場合は更新、存在しない場合は新規作成
      const updateRequest = {
        range: `シート1!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        values: [headers],
      };

      const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: updateRequest.range,
        valueInputOption: "RAW",
        requestBody: {
          values: updateRequest.values,
        },
      });

      console.log("更新レスポンス:", response.data);

      if (response.status === 200) {
        res.status(200).json({ 
          message: "ヘッダー行が作成されました",
          headers: headers
        });
      } else {
        throw new Error("ヘッダー行の作成に失敗しました");
      }
    } catch (sheetsError: any) {
      console.error("Google Sheets API エラー:", {
        message: sheetsError.message,
        code: sheetsError.code,
        errors: sheetsError.errors,
        status: sheetsError.status,
        statusText: sheetsError.statusText,
      });
      throw sheetsError;
    }
  } catch (error: any) {
    console.error("ヘッダー行作成エラーの詳細:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "ヘッダー行の作成に失敗しました",
      details: error.message,
      code: error.code
    });
  }
} 