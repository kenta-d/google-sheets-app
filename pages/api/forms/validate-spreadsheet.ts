import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { spreadsheetId } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ message: "スプレッドシートIDが必要です" });
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

    // スプレッドシートの存在確認とアクセス権限の確認
    await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return res.status(200).json({ message: "スプレッドシートの検証に成功しました" });
  } catch (error: any) {
    console.error("スプレッドシート検証エラー:", error);

    if (error.code === 403) {
      return res.status(403).json({
        message: "スプレッドシートへのアクセス権限がありません",
      });
    }

    if (error.code === 404) {
      return res.status(404).json({
        message: "スプレッドシートが見つかりません",
      });
    }

    return res.status(500).json({
      message: "スプレッドシートの検証中にエラーが発生しました",
    });
  }
} 