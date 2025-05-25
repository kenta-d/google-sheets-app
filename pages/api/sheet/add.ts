// pages/api/sheet/add.ts
import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const { spreadsheetId } = req.query;

    if (!spreadsheetId) {
      return res.status(400).json({ message: "スプレッドシートIDが必要です" });
    }

    // リクエストボディからデータを取得
    const values = req.body;
    if (!Array.isArray(values)) {
      return res.status(400).json({ message: "データが配列形式ではありません" });
    }

    console.log("追加するデータ:", values);
    console.log("スプレッドシートID:", spreadsheetId);

    // データを追加
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId as string,
      range: "A:Z",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [values],
      },
    });

    console.log("追加レスポンス:", response.data);

    return res.status(200).json({
      message: "データが追加されました",
      data: response.data
    });
  } catch (error: any) {
    console.error("データ追加エラー:", error);
    return res.status(500).json({
      message: "データの追加中にエラーが発生しました",
      error: error.message,
      details: error.response?.data
    });
  }
}
