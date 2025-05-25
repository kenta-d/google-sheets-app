// components/AddForm.tsx
import { useState } from "react";

export default function AddForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/sheet/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, date }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("追加成功！");
      setName("");
      setEmail("");
      setDate("");
    } else {
      alert("エラー: " + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名前" className="border px-2 py-1" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メール" className="border px-2 py-1" />
      <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="日付" className="border px-2 py-1" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        追加
      </button>
    </form>
  );
}
