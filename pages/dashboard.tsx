import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastDescription } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SortConfig = {
  key: number;
  direction: 'ascending' | 'descending';
};

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
    view?: {
      filterable?: boolean;
    };
  }[];
  view: {
    layout: string;
    searchable: boolean;
    filterable: boolean;
  };
};

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
};

type FormData = {
  [key: string]: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { formId } = router.query;
  const [form, setForm] = useState<Form | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 0, direction: 'ascending' });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFormData, setNewFormData] = useState<FormData>({});

  useEffect(() => {
    if (!formId) {
      router.push('/forms');
      return;
    }

    const fetchFormAndData = async () => {
      try {
        // フォーム情報の取得
        const formRes = await fetch(`/api/forms/${formId}`);
        if (!formRes.ok) throw new Error("フォームが見つかりません");
        const formData = await formRes.json();
        setForm(formData);

        // スプレッドシートデータの取得
        const dataRes = await fetch(`/api/sheet/data?spreadsheetId=${formData.spreadsheetId}`);
        if (!dataRes.ok) throw new Error("データの取得に失敗しました");
        const sheetData = await dataRes.json();
        setData(sheetData);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "エラー",
          children: error.message || "データの取得に失敗しました",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFormAndData();
  }, [formId]);

  // テンプレートの取得
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        setTemplates(data);
      } catch (error) {
        console.error("テンプレート取得エラー:", error);
      }
    };
    fetchTemplates();
  }, []);

  // テンプレートの適用
  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      
      // ヘッダー行を自動的に作成
      try {
        const res = await fetch("/api/sheet/create-header", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headers: template.columns.map(col => col.name)
          }),
        });
        const result = await res.json();
        if (res.ok) {
          toast({
            title: "✅ ヘッダー行作成成功",
            children: <ToastDescription>テンプレートのヘッダー行が作成されました</ToastDescription>
          });
          // データを再取得
          const updated = await fetch("/api/sheet/read");
          const json = await updated.json();
          if (json.data && Array.isArray(json.data)) {
            setData(json.data);
          }
        } else {
          toast({
            variant: "destructive",
            title: "❌ ヘッダー行作成失敗",
            children: <ToastDescription>{result.error}</ToastDescription>
          });
        }
      } catch (error: any) {
        console.error("ヘッダー行作成エラー:", error);
        toast({
          variant: "destructive",
          title: "❌ エラー",
          children: <ToastDescription>
            ヘッダー行の作成中にエラーが発生しました
            <div className="text-sm mt-1">{error.message}</div>
          </ToastDescription>
        });
      }

      // フォームの初期化
      const initialFormData: FormData = {};
      template.columns.forEach(col => {
        if (col.input) {
          initialFormData[col.name] = "";
        }
      });
      setNewFormData(initialFormData);
    }
  };

  // 検索とソートを適用したデータを取得
  const getFilteredAndSortedData = () => {
    let filteredData = [...data];
    
    // 検索フィルター
    if (searchQuery) {
      filteredData = filteredData.filter(row =>
        row.some((cell: string) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // ソート
    filteredData.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'ascending') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    
    return filteredData;
  };

  // ソート処理
  const handleSort = (columnIndex: number) => {
    setSortConfig(current => ({
      key: columnIndex,
      direction: current.key === columnIndex && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  // データ取得
  useEffect(() => {
    if (form?.spreadsheetId) {
      const fetchData = async () => {
        try {
          const res = await fetch(`/api/sheet/data?spreadsheetId=${form.spreadsheetId}`);
          const json = await res.json();
          console.log("取得したデータ:", json);
          if (json && Array.isArray(json)) {
            setData(json);
          } else {
            console.error("データが配列ではありません:", json);
            setData([]);
          }
        } catch (error) {
          console.error("データ取得エラー:", error);
          toast({
            variant: "destructive",
            title: "エラー",
            children: "データの取得に失敗しました",
          });
        }
      };
      fetchData();
    }
  }, [form?.spreadsheetId]);

  // 入力変更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewFormData({ ...newFormData, [e.target.name]: e.target.value });
  };

  // 行の削除
  const handleDelete = async (rowIndex: number) => {
    const confirmed = confirm("この行を削除しますか？");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/sheet/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rowIndex: rowIndex,
          spreadsheetId: form?.spreadsheetId 
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({
          title: "✅ 削除成功",
          children: "データが削除されました"
        });
        // データを再取得
        const dataRes = await fetch(`/api/sheet/data?spreadsheetId=${form?.spreadsheetId}`);
        if (dataRes.ok) {
          const sheetData = await dataRes.json();
          setData(sheetData);
        }
      } else {
        toast({
          variant: "destructive",
          title: "❌ 削除失敗",
          children: result.error || "データの削除に失敗しました"
        });
      }
    } catch (error: any) {
      console.error("削除エラー:", error);
      toast({
        variant: "destructive",
        title: "❌ エラー",
        children: "削除中にエラーが発生しました"
      });
    }
  };

  // 追加処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const formValues: string[] = selectedTemplate.columns
      .filter(col => col.input)
      .map(col => newFormData[col.name] || "");

    const res = await fetch("/api/sheet/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues),
    });
    const result = await res.json();
    if (res.ok) {
      toast({ 
        title: "✅ 追加成功",
        children: <ToastDescription>データが追加されました</ToastDescription>
      });
      setNewFormData({});
      const updated = await fetch("/api/sheet/read");
      const json = await updated.json();
      setData(json.data || []);
    } else {
      toast({
        variant: "destructive",
        title: "❌ 追加失敗",
        children: <ToastDescription>{result.error}</ToastDescription>
      });
    }
  };

  // カラムの追加
  const handleAddColumn = () => {
    setData([...data, ["", "", ""]]);
  };

  // カラムの削除
  const handleRemoveColumn = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  // カラム名の更新
  const handleColumnNameChange = (index: number, value: string) => {
    const newData = [...data];
    newData[index] = [value, "", ""];
    setData(newData);
  };

  // セッション確認中
  if (status === "loading") return <p>読み込み中...</p>;

  // 未ログイン時
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={() => signIn("google")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Googleでログイン
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">フォームが見つかりません</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>フォームデータ</CardTitle>
              <CardDescription>
                {form?.name}のデータ管理
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/forms")}
              >
                フォーム一覧に戻る
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
              >
                + 新しいデータを追加
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {form?.columns.map((column, index) => (
                    <TableHead key={index}>{column.name}</TableHead>
                  ))}
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {form?.columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {row[colIndex] || ""}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(rowIndex)}
                        >
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                データがまだありません。
                新しいデータを追加してください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* データ追加フォーム */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>新しいデータを追加</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {form?.columns.map((column, index) => (
                  column.input && (
                    <div key={index}>
                      <label className="block text-sm font-medium mb-2">
                        {column.name}
                        {column.required && <span className="text-red-500">*</span>}
                      </label>
                      {column.type === 'textarea' ? (
                        <textarea
                          className="w-full p-2 border rounded"
                          value={newFormData[column.name] || ''}
                          onChange={handleChange}
                          required={column.required}
                        />
                      ) : (
                        <Input
                          type={column.type === 'date' ? 'date' : 'text'}
                          value={newFormData[column.name] || ''}
                          onChange={handleChange}
                          required={column.required}
                        />
                      )}
                    </div>
                  )
                ))}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit">
                    保存
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
