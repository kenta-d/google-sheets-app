import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const templatesDir = path.join(process.cwd(), "pages/api/templates");
    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith(".json"));

    const templates = files.map(file => {
      const content = fs.readFileSync(path.join(templatesDir, file), "utf-8");
      return JSON.parse(content);
    });

    res.status(200).json(templates);
  } catch (error) {
    console.error("テンプレート取得エラー:", error);
    res.status(500).json({ error: "テンプレートの取得に失敗しました" });
  }
} 