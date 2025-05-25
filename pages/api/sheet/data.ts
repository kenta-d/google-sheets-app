import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
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

    // データを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId as string,
      range: "A:Z",
    });

    const values = response.data.values || [];
    console.log("取得したデータ:", values);

    return res.status(200).json(values);
  } catch (error: any) {
    console.error("データ取得エラー:", error);
    return res.status(500).json({
      message: "データの取得中にエラーが発生しました",
      error: error.message,
      details: error.response?.data
    });
  }
} 