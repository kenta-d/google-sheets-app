import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useToast } from "../../components/ui/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

type Template = {
  id: string;
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    input: boolean;
    editable: boolean;
    required?: boolean;
    options?: string[];
  }[];
};

type FormData = {
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
  name: string;
};

export default function NewForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState<FormData>({
    templateId: "",
    spreadsheetId: "",
    columns: [],
    name: "",
  });
  const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);

  // テンプレートの取得
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        setTemplates(data);
      } catch (error) {
        console.error("テンプレート取得エラー:", error);
        toast({
          variant: "destructive",
          title: "エラー",
          children: "テンプレートの取得に失敗しました",
        });
      }
    };
    fetchTemplates();
  }, []);

  // テンプレート選択時の処理
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        columns: template.columns,
      });
    }
  };

  // スプレッドシートIDの検証
  const handleSpreadsheetIdChange = async (value: string) => {
    setFormData(prev => ({ ...prev, spreadsheetId: value }));
    
    if (!value) {
      setSpreadsheetError("スプレッドシートIDを入力してください");
      return;
    }

    // URLからIDを抽出
    let spreadsheetId = value;
    const urlMatch = value.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      spreadsheetId = urlMatch[1];
    }

    try {
      const res = await fetch("/api/forms/validate-spreadsheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spreadsheetId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setSpreadsheetError("スプレッドシートへのアクセス権限がありません。共有設定を確認してください。");
        } else if (res.status === 404) {
          setSpreadsheetError("スプレッドシートが見つかりません。IDが正しいか確認してください。");
        } else {
          setSpreadsheetError(data.message || "スプレッドシートの検証に失敗しました");
        }
        return;
      }

      setSpreadsheetError(null);
      setFormData(prev => ({ ...prev, spreadsheetId }));
    } catch (error) {
      console.error("スプレッドシート検証エラー:", error);
      setSpreadsheetError("スプレッドシートの検証中にエラーが発生しました");
    }
  };

  // カラム名の更新
  const handleColumnNameChange = (index: number, value: string) => {
    const newColumns = [...formData.columns];
    newColumns[index] = {
      ...newColumns[index],
      name: value,
    };
    setFormData({
      ...formData,
      columns: newColumns,
    });
  };

  // フォームの保存
  const handleSave = async () => {
    try {
      // 必須項目のチェック
      if (!formData.name || !formData.templateId || !formData.spreadsheetId || !formData.columns.length) {
        toast({
          variant: "destructive",
          title: "エラー",
          children: "必須項目が入力されていません",
        });
        return;
      }

      console.log("保存するデータ:", formData);
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("APIレスポンス:", data);

      if (!res.ok) {
        throw new Error(data.error || "フォームの作成に失敗しました");
      }

      toast({
        title: "成功",
        children: "フォームが作成されました",
      });
      router.push("/forms");
    } catch (error: any) {
      console.error("保存エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        children: error.message || "フォームの作成に失敗しました",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>新しいフォームを作成</CardTitle>
              <CardDescription>
                ステップ {step}/4: {
                  step === 1 ? "テンプレート選択" :
                  step === 2 ? "スプレッドシート設定" :
                  step === 3 ? "カラム構成の確認" :
                  "フォームの保存"
                }
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/forms")}
            >
              フォーム一覧に戻る
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="テンプレートを選択" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.templateId && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">選択したテンプレート:</h3>
                  <p className="text-sm text-gray-600">
                    {templates.find(t => t.id === formData.templateId)?.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Google SheetsのURLまたはID
                </label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={formData.spreadsheetId}
                  onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">スプレッドシートの設定方法</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Google Driveで新しいスプレッドシートを作成</li>
                  <li>スプレッドシートのURLをコピー</li>
                  <li>URLまたはIDを上記の入力欄に貼り付け</li>
                  <li>スプレッドシートの共有設定で、サービスアカウントのメールアドレスに編集権限を付与</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-600">
                    注意: スプレッドシートは必ずサービスアカウントと共有してください。
                    共有設定で「編集者」として追加する必要があります。
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">カラム構成</h3>
              {formData.columns.map((column, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input
                    value={column.name}
                    onChange={(e) => handleColumnNameChange(index, e.target.value)}
                    placeholder="カラム名"
                  />
                  <span className="text-sm text-gray-600">
                    {column.type} {column.required ? "(必須)" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  フォーム名
                </label>
                <Input
                  placeholder="例: 予約管理フォーム"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">設定内容の確認</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-600">テンプレート</dt>
                    <dd>{templates.find(t => t.id === formData.templateId)?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">スプレッドシートID</dt>
                    <dd>{formData.spreadsheetId}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">カラム数</dt>
                    <dd>{formData.columns.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                戻る
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !formData.templateId) ||
                  (step === 2 && !formData.spreadsheetId)
                }
              >
                次へ
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!formData.name}
              >
                保存
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 