// pages/api/sheet/delete.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getSheetsClient } from "@/lib/google";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { rowIndex, spreadsheetId } = req.body;
  if (typeof rowIndex !== 'number') {
    return res.status(400).json({ error: "Row index must be a number" });
  }

  if (!spreadsheetId) {
    return res.status(400).json({ error: "Spreadsheet ID is required" });
  }

  try {
    const sheets = await getSheetsClient(session.accessToken);
    
    // 行を削除するリクエスト
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // シート1のID
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });

    res.status(200).json({ message: "Row deleted successfully" });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ 
      error: "Failed to delete row",
      details: error.message
    });
  }
}
