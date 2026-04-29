import { useEffect, useState } from "react";

const BACKEND_LB = "http://34.95.108.50";

const SERVERS = [
  { id: "fastapi", label: "FastAPI", path: "/fastapi", color: "#009688"},
  { id: "django",  label: "Django",  path: "/django",  color: "#2e7d32"},
  { id: "node",    label: "Node.js", path: "/node",    color: "#f57c00"},
  { id: "dotnet",  label: ".NET",    path: "/dotnet",  color: "#7b1fa2"},
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Syne', sans-serif;
    background: #0a0a0f;
    color: #e8e8f0;
    min-height: 100vh;
  }

  .app {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  .header {
    margin-bottom: 40px;
  }

  .header h1 {
    font-size: 2.8rem;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1;
    color: #fff;
  }

  .header p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: #555;
    margin-top: 8px;
    letter-spacing: 0.05em;
  }

  .server-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 36px;
  }

  .server-btn {
    background: #111118;
    border: 1.5px solid #1e1e2e;
    border-radius: 12px;
    padding: 14px 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    font-family: 'Syne', sans-serif;
  }

  .server-btn:hover {
    border-color: #333;
    background: #161622;
    transform: translateY(-2px);
  }

  .server-btn.active {
    border-color: var(--server-color);
    background: #161622;
    box-shadow: 0 0 20px -4px var(--server-color);
  }

  .server-btn .emoji {
    font-size: 1.4rem;
    display: block;
    margin-bottom: 6px;
  }

  .server-btn .name {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #aaa;
    text-transform: uppercase;
  }

  .server-btn.active .name {
    color: var(--server-color);
  }

  .active-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #555;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .active-badge span {
    color: var(--active-color);
    font-weight: 600;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--active-color);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .input-row {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
  }

  .input-row input {
    flex: 1;
    background: #111118;
    border: 1.5px solid #1e1e2e;
    border-radius: 10px;
    padding: 12px 16px;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    color: #e8e8f0;
    outline: none;
    transition: border-color 0.2s;
  }

  .input-row input:focus {
    border-color: var(--active-color);
  }

  .input-row input::placeholder { color: #444; }

  .add-btn {
    background: var(--active-color);
    border: none;
    border-radius: 10px;
    padding: 12px 22px;
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.03em;
  }

  .add-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .add-btn:active { transform: translateY(0); }

  .todos-header {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #444;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .todo-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .todo-item {
    background: #111118;
    border: 1.5px solid #1e1e2e;
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .todo-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--active-color);
    flex-shrink: 0;
    opacity: 0.7;
  }

  .todo-title {
    font-size: 0.95rem;
    color: #ccc;
    flex: 1;
  }

  .todo-status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 4px;
    background: #1a1a28;
    color: #555;
  }

  .todo-status.done {
    color: #4caf50;
    background: #0d1f0d;
  }

  .empty {
    text-align: center;
    padding: 48px 0;
    color: #333;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
  }

  .loading {
    text-align: center;
    padding: 48px 0;
    color: #444;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .error {
    background: #1a0a0a;
    border: 1.5px solid #3d1515;
    border-radius: 10px;
    padding: 14px 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: #ef5350;
    margin-bottom: 16px;
  }
`;

export default function App() {
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAPI = (server) => `${BACKEND_LB}${server.path}`;

  const fetchTodos = async (server = selectedServer) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getAPI(server)}/todos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTodos(data);
    } catch (e) {
      setError(`Failed to fetch from ${server.label}: ${e.message}`);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!title.trim()) return;
    try {
      await fetch(`${getAPI(selectedServer)}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, completed: false }),
      });
      setTitle("");
      fetchTodos();
    } catch (e) {
      setError(`Failed to add todo: ${e.message}`);
    }
  };

  const handleServerChange = (server) => {
    setSelectedServer(server);
    fetchTodos(server);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTodo();
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div
        className="app"
        style={{ "--active-color": selectedServer.color }}
      >
        <div className="header">
          <h1>Todo App | Subhakshan Chakraborty</h1>
            <p>multi-backend · gcp capstone project</p>
        </div>

        <div className="server-selector">
          {SERVERS.map((s) => (
            <button
              key={s.id}
              className={`server-btn ${selectedServer.id === s.id ? "active" : ""}`}
              style={{ "--server-color": s.color }}
              onClick={() => handleServerChange(s)}
            >
              <span className="emoji">{s.emoji}</span>
              <span className="name">{s.label}</span>
            </button>
          ))}
        </div>

        <div
          className="active-badge"
          style={{ "--active-color": selectedServer.color }}
        >
          <div className="dot" />
          serving via <span>{selectedServer.label}</span>
          &nbsp;·&nbsp;
          <span style={{ color: "#333" }}>{BACKEND_LB}{selectedServer.path}</span>
        </div>

        {error && <div className="error">⚠ {error}</div>}

        <div className="input-row" style={{ "--active-color": selectedServer.color }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
          />
          <button
            className="add-btn"
            style={{ background: selectedServer.color }}
            onClick={addTodo}
          >
            Add
          </button>
        </div>

        <div className="todos-header">
          {todos.length} task{todos.length !== 1 ? "s" : ""}
        </div>

        {loading ? (
          <div className="loading">fetching from {selectedServer.label}...</div>
        ) : todos.length === 0 ? (
          <div className="empty">no todos yet. add one above ↑</div>
        ) : (
          <ul className="todo-list">
            {todos.map((t, i) => (
              <li key={t.id ?? i} className="todo-item">
                <div
                  className="todo-dot"
                  style={{ background: selectedServer.color }}
                />
                <span className="todo-title">{t.title}</span>
                <span className={`todo-status ${t.completed ? "done" : ""}`}>
                  {t.completed ? "done" : "pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}