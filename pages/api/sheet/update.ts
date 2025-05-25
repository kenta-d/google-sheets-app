import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
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
    const { rowIndex, data } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({ message: "スプレッドシートIDが必要です" });
    }

    if (!rowIndex || !data) {
      return res.status(400).json({ message: "行インデックスとデータが必要です" });
    }

    console.log("更新するデータ:", { rowIndex, data });
    console.log("スプレッドシートID:", spreadsheetId);

    // データを更新
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId as string,
      range: `A${rowIndex}:Z${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [data],
      },
    });

    console.log("更新レスポンス:", response.data);

    return res.status(200).json({
      message: "データが更新されました",
      data: response.data
    });
  } catch (error: any) {
    console.error("データ更新エラー:", error);
    return res.status(500).json({
      message: "データの更新中にエラーが発生しました",
      error: error.message,
      details: error.response?.data
    });
  }
}
