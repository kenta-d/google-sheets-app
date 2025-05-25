import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useToast } from "../../components/ui/use-toast";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

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

export default function Forms() {
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch("/api/forms");
        const data = await res.json();
        setForms(data);
      } catch (error) {
        console.error("フォーム取得エラー:", error);
        toast({
          variant: "destructive",
          title: "エラー",
          children: "フォームの取得に失敗しました",
        });
      }
    };
    fetchForms();
  }, []);

  const handleCreateForm = () => {
    router.push("/forms/new");
  };

  const handleEditForm = (formId: string) => {
    router.push(`/forms/${formId}`);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("このフォームを削除してもよろしいですか？")) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "成功",
          children: "フォームが削除されました",
        });
        setForms(forms.filter(form => form.id !== formId));
      } else {
        const error = await res.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "エラー",
        children: error.message || "フォームの削除に失敗しました",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>フォーム管理</CardTitle>
              <CardDescription>
                作成したフォームの一覧と管理
              </CardDescription>
            </div>
            <Button onClick={handleCreateForm}>
              + 新しいフォームを作成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {forms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>フォーム名</TableHead>
                  <TableHead>テンプレート</TableHead>
                  <TableHead>カラム数</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>{form.name}</TableCell>
                    <TableCell>{form.templateId}</TableCell>
                    <TableCell>{form.columns.length}</TableCell>
                    <TableCell>
                      {new Date(form.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/dashboard?formId=${form.id}`)}
                        >
                          ダッシュボード
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteForm(form.id)}
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
                フォームがまだ作成されていません。
                新しいフォームを作成してください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 