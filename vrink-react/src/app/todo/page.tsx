"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ListChecks, Plus, Trash2 } from "lucide-react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const completedCount = useMemo(() => todos.filter((todo) => todo.completed).length, [todos]);

  const handleAddTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    setTodos((prev) => [
      {
        id: Date.now(),
        text: trimmed,
        completed: false,
      },
      ...prev,
    ]);
    setInput("");
  };

  const handleToggleTodo = (id: number) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const handleDeleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_45%,_#eef2ff_100%)] px-4 py-10 md:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_-30px_rgba(30,64,175,0.35)] backdrop-blur md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ListChecks className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">할 일 관리 앱</h1>
              <p className="text-sm text-slate-500">오늘 해야 할 일을 깔끔하게 정리해보세요.</p>
            </div>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 md:text-sm">
            완료 {completedCount} / 전체 {todos.length}
          </div>
        </div>

        <form onSubmit={handleAddTodo} className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="새로운 할 일을 입력하세요"
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none ring-blue-500 transition focus:ring-2"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <Plus className="size-4" />
            추가
          </button>
        </form>

        {todos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="font-medium text-slate-700">아직 등록된 할 일이 없어요.</p>
            <p className="mt-1 text-sm text-slate-500">위 입력창에 할 일을 적고 추가해보세요.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => handleToggleTodo(todo.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`${todo.text} 완료 상태 변경`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
                      todo.completed
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Check className="size-4" />
                  </span>
                  <span
                    className={`truncate text-base ${
                      todo.completed ? "text-slate-400 line-through" : "text-slate-800"
                    }`}
                  >
                    {todo.text}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label={`${todo.text} 삭제`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
