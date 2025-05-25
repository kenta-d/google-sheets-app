// pages/api/sheet/read.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getSheetsClient } from "@/lib/google";
import type { NextApiRequest, NextApiResponse } from "next";

const SHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = "シート1"; // 例：Sheet1

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!SHEET_ID) {
    return res.status(500).json({ error: "Spreadsheet ID not configured" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sheets = getSheetsClient(session.accessToken as string);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:Z1000`,
    });

    const rows = response.data.values || [];
    return res.status(200).json({ data: rows });
  } catch (error: any) {
    console.error("Sheets API error (read):", error);
    return res.status(500).json({ error: "Sheets API failed" });
  }
}
