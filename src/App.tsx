import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ========== 日付ヘルパー（トップレベルに移動） ========== */
const jpWeekday = ["日", "月", "火", "水", "木", "金", "土"];

const formatYmdPretty = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00`);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = jpWeekday[d.getDay()];
  return `${m}/${day}（${wd}）`;
};

const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const ymdToDate = (ymd: string) => new Date(`${ymd}T00:00:00`);

const daysLeft = (ymd: string): number => {
  const start = ymdToDate(todayYmd()); // 今日の0時
  const dueDate = ymdToDate(ymd);
  const diffMs = dueDate.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)); // 今日=0, 明日=+1
};

// 見やすいラベル（相対表記）
const formatDueLabel = (ymd: string) => {
  const d = ymdToDate(ymd);
  const wl = daysLeft(ymd);
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const wd = jpWeekday[d.getDay()];

  if (wl < -7) return { text: `期限切れ（${month}/${date}・${wd}）`, tone: "danger" as const };
  if (wl < -1) return { text: `期限切れ（${-wl}日前）`, tone: "danger" as const };
  if (wl === -1) return { text: "昨日まで", tone: "danger" as const };
  if (wl === 0) return { text: "今日まで", tone: "warn" as const };
  if (wl === 1) return { text: "明日まで", tone: "warn" as const };
  if (wl <= 3) return { text: `あと${wl}日`, tone: "warn" as const };
  return { text: `${month}/${date}（${wd}）`, tone: "normal" as const };
};

/* ========== 型・定数 ========== */
type Todo = {
  id: number;
  title: string;
  done: boolean;
  due: string | null; // "YYYY-MM-DD" or null
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todoapp:v2:todos";

/* ========== App ========== */
function App() {
  const [text, setText] = useState<string>("");
  const [due, setDue] = useState<string>(""); // 空 = 期限なし
  const [filter, setFilter] = useState<Filter>("all");

  // 初期読み込み（v1→v2移行）
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Todo[];

      const old = localStorage.getItem("todoapp:v1:todos");
      const parsed = old ? (JSON.parse(old) as any[]) : [];
      return parsed.map((t) => ({
        id: t.id,
        title: t.title,
        done: !!t.done,
        due: null,
      })) as Todo[];
    } catch {
      return [];
    }
  });

  // 保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {}
  }, [todos]);

  // 追加
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;

    const newTodo: Todo = {
      id: Date.now(),
      title,
      done: false,
      due: due ? due : null,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setText("");
    setDue(""); // 入力欄クリア
  };

  // 完了トグル
  const toggle = (id: number) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  // 削除（完了済みのみ）
  const remove = (id: number) => setTodos((prev) => prev.filter((t) => t.id !== id));

  // フィルター＆並び替え
  const filtered = useMemo(() => {
    const list =
      filter === "active"
        ? todos.filter((t) => !t.done)
        : filter === "completed"
        ? todos.filter((t) => t.done)
        : todos;

    const undone = list.filter((t) => !t.done);
    const done = list.filter((t) => t.done);

    undone.sort((a, b) => {
      if (a.due && b.due) return a.due.localeCompare(b.due);
      if (a.due && !b.due) return -1;
      if (!a.due && b.due) return 1;
      return 0;
    });

    return [...undone, ...done];
  }, [filter, todos]);

  const remainingCount = todos.filter((t) => !t.done).length;

  return (
    <div className="app">
      <h1>ToDo</h1>

      {/* 入力フォーム：タイトル + 期限 */}
      <form onSubmit={onSubmit} className="add-form">
        <input
          className="text-input"
          type="text"
          placeholder="Add a new task"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* 期限（任意） */}
        <input
          className="date-input"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          min={todayYmd()}
          aria-label="期限"
          title="期限（任意）"
        />
        {/* 過去日も選ばせたい場合は ↑ の min を削除 */}

        <button type="submit" className="primary-btn">Add</button>
      </form>

      {/* フィルター切替 */}
      <div className="toolbar">
        <span className="counter">未完了: {remainingCount}</span>
        <div className="filter-group">
          <button
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={`filter-btn ${filter === "all" ? "is-active" : ""}`}
            title="全部の項目を表示"
          >
            全部
          </button>
          <button
            onClick={() => setFilter("active")}
            aria-pressed={filter === "active"}
            className={`filter-btn ${filter === "active" ? "is-active" : ""}`}
            title="未完了（チェックなし）のみ表示"
          >
            未完了
          </button>
          <button
            onClick={() => setFilter("completed")}
            aria-pressed={filter === "completed"}
            className={`filter-btn ${filter === "completed" ? "is-active" : ""}`}
            title="完了（チェックあり）のみ表示"
          >
            完了
          </button>
        </div>
      </div>

      {/* 一覧 */}
      <ul className="todo-list">
        {filtered.map((t) => (
          <li key={t.id} className="todo-item">
            <input
              id={`todo-${t.id}`}
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              className="check"
            />

            <label
              htmlFor={`todo-${t.id}`}
              className={`title ${t.done ? "is-done" : ""}`}
            >
              {t.title}
            </label>

            <DueBadge t={t} />

            {/* 完了済みだけ削除可（仕様維持） */}
            <button
              onClick={() => t.done && remove(t.id)}
              disabled={!t.done}
              className="delete-btn"
              aria-disabled={!t.done}
              aria-label={`「${t.title}」を削除`}
              title={t.done ? "削除" : "完了にチェックすると削除できます"}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ========== 期限バッジ（表記統一 & クラスベース） ========== */
function DueBadge({ t }: { t: Todo }) {
  if (!t.due) return null;

  const { text, tone } = t.done
    ? { text: `完了（${formatYmdPretty(t.due)}）`, tone: "muted" as const }
    : formatDueLabel(t.due); // 今日まで / 明日まで / あと◯日 / M/D（曜）

  return (
    <span className={`due-badge tone-${tone}`} title={t.due}>
      {text}
    </span>
  );
}

export default App;
