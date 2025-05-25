import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import fs from 'fs';
import path from 'path';

type Form = {
  id: string;
  name: string;
  templateId: string;
  spreadsheetId: string;
  columns: {
    name: string;
    type: string;
    input: boolean;
    editable: boolean;
    required?: boolean;
    options?: string[];
  }[];
  createdAt: string;
  updatedAt: string;
};

const FORMS_FILE = path.join(process.cwd(), 'data', 'forms.json');

// フォームデータの保存
function saveForms(forms: Form[]) {
  try {
    const dir = path.dirname(FORMS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = JSON.stringify(forms, null, 2);
    fs.writeFileSync(FORMS_FILE, data, 'utf-8');
    console.log('フォームデータを保存しました:', FORMS_FILE);
  } catch (error) {
    console.error('フォームデータの保存エラー:', error);
    throw new Error('フォームデータの保存に失敗しました');
  }
}

// フォームデータの読み込み
function loadForms(): Form[] {
  try {
    if (fs.existsSync(FORMS_FILE)) {
      const data = fs.readFileSync(FORMS_FILE, 'utf-8');
      const forms = JSON.parse(data);
      console.log('フォームデータを読み込みました:', forms.length, '件');
      return forms;
    }
    console.log('フォームデータファイルが存在しません:', FORMS_FILE);
    return [];
  } catch (error) {
    console.error('フォームデータの読み込みエラー:', error);
    return [];
  }
}

// フォームデータの初期化
let forms: Form[] = loadForms();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  switch (req.method) {
    case "GET":
      return handleGet(req, res);
    case "POST":
      return handlePost(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json(forms);
  } catch (error: any) {
    console.error("フォーム一覧取得エラー:", error);
    res.status(500).json({ error: "フォーム一覧の取得に失敗しました" });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, templateId, spreadsheetId, columns } = req.body;
    console.log("受信したデータ:", { name, templateId, spreadsheetId, columns });

    // 必須パラメータのチェック
    if (!name || !templateId || !spreadsheetId || !columns) {
      console.error("必須パラメータが不足:", { name, templateId, spreadsheetId, columns });
      return res.status(400).json({ error: "必須パラメータが不足しています" });
    }

    // Google Sheets APIの認証情報の確認
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Google Sheets APIの認証情報が設定されていません");
      return res.status(500).json({ error: "Google Sheets APIの認証情報が設定されていません" });
    }

    // Google Sheets APIの認証
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // スプレッドシートの存在確認
    try {
      await sheets.spreadsheets.get({
        spreadsheetId,
      });
    } catch (error: any) {
      console.error("スプレッドシートの存在確認エラー:", error);
      if (error.code === 403) {
        return res.status(403).json({ error: "スプレッドシートへのアクセス権限がありません" });
      }
      return res.status(400).json({ error: "無効なスプレッドシートIDです" });
    }

    // 新しいフォームの作成
    const newForm: Form = {
      id: Date.now().toString(),
      name,
      templateId,
      spreadsheetId,
      columns,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      forms.push(newForm);
      saveForms(forms);
      console.log('新しいフォームを作成しました:', newForm);
      res.status(201).json(newForm);
    } catch (error: any) {
      console.error('フォームの保存に失敗しました:', error);
      res.status(500).json({ error: error.message || "フォームの保存に失敗しました" });
    }
  } catch (error: any) {
    console.error("フォーム作成エラー:", error);
    res.status(500).json({ error: "フォームの作成に失敗しました" });
  }
} 