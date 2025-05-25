import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
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

  const { id } = req.query;

  switch (req.method) {
    case "GET":
      return handleGet(req, res, id as string);
    case "DELETE":
      return handleDelete(req, res, id as string);
    default:
      res.setHeader("Allow", ["GET", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const form = forms.find(f => f.id === id);
    if (!form) {
      return res.status(404).json({ error: "フォームが見つかりません" });
    }
    res.status(200).json(form);
  } catch (error: any) {
    console.error("フォーム取得エラー:", error);
    res.status(500).json({ error: "フォームの取得に失敗しました" });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const index = forms.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "フォームが見つかりません" });
    }
    forms.splice(index, 1);
    try {
      saveForms(forms);
      console.log('フォームを削除しました:', id);
      res.status(200).json({ message: "フォームが削除されました" });
    } catch (error: any) {
      console.error('フォームの削除に失敗しました:', error);
      res.status(500).json({ error: error.message || "フォームの削除に失敗しました" });
    }
  } catch (error: any) {
    console.error("フォーム削除エラー:", error);
    res.status(500).json({ error: "フォームの削除に失敗しました" });
  }
} 