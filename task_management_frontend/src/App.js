import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api } from "./api";

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  const [categories, setCategories] = useState([]);
  const [tasksPage, setTasksPage] = useState({ items: [], total: 0, limit: 50, offset: 0 });

  const [status, setStatus] = useState("all"); // all | active | completed
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");

  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const activeCategory = useMemo(() => {
    if (!categoryId) return null;
    return categories.find((c) => String(c.id) === String(categoryId)) || null;
  }, [categories, categoryId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function refreshCategories() {
    const data = await api.listCategories();
    setCategories(data);
  }

  async function refreshTasks({ offset = 0 } = {}) {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTasks({
        status,
        category_id: categoryId || undefined,
        q: q || undefined,
        sort_by: sortBy,
        order,
        limit: tasksPage.limit || 50,
        offset,
      });
      setTasksPage(data);
    } catch (e) {
      setError(e.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    (async () => {
      try {
        await refreshCategories();
        await refreshTasks({ offset: 0 });
      } catch (e) {
        setError(e.message || "Failed to load data");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reload when filters change
    refreshTasks({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, categoryId, sortBy, order]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  function openCreateTask() {
    setEditingTask(null);
    setTaskModalOpen(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  async function handleDeleteTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      await refreshTasks({ offset: tasksPage.offset });
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  }

  async function handleToggleComplete(task) {
    try {
      if (task.is_completed) {
        await api.reopenTask(task.id);
      } else {
        await api.completeTask(task.id);
      }
      await refreshTasks({ offset: tasksPage.offset });
    } catch (e) {
      setError(e.message || "Update failed");
    }
  }

  async function handleSaveTask(payload) {
    setError("");
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }
      setTaskModalOpen(false);
      setEditingTask(null);
      await refreshTasks({ offset: 0 });
    } catch (e) {
      setError(e.message || "Save failed");
    }
  }

  const canPrev = tasksPage.offset > 0;
  const canNext = tasksPage.offset + tasksPage.limit < tasksPage.total;

  return (
    <div className="App">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">OP</div>
          <div className="brand-text">
            <div className="brand-title">OrganizePro</div>
            <div className="brand-subtitle">Task Manager</div>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks…"
              aria-label="Search tasks"
            />
            <button className="btn btn-secondary" onClick={() => refreshTasks({ offset: 0 })}>
              Search
            </button>
          </div>

          <button className="btn btn-primary" onClick={openCreateTask}>
            New Task
          </button>

          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title="Toggle theme"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar" aria-label="Sidebar filters">
          <div className="panel">
            <div className="panel-title">Status</div>
            <div className="segmented" role="group" aria-label="Task status filter">
              {["all", "active", "completed"].map((s) => (
                <button
                  key={s}
                  className={`segmented-btn ${status === s ? "active" : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {s === "all" ? "All" : s === "active" ? "Active" : "Completed"}
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Category</div>
            <select
              className="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Category filter"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="hint">
              {activeCategory ? (
                <span>
                  Viewing: <strong>{activeCategory.name}</strong>
                </span>
              ) : (
                <span>Choose a category to narrow results.</span>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Sort</div>
            <div className="row">
              <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="created_at">Created</option>
                <option value="due_date">Due date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
              <select className="select" value={order} onChange={(e) => setOrder(e.target.value)}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="content" aria-label="Tasks panel">
          <div className="content-header">
            <div>
              <div className="h1">Tasks</div>
              <div className="muted">
                {loading ? "Loading…" : `${tasksPage.total} total`}
              </div>
            </div>

            <div className="pager">
              <button
                className="btn btn-secondary"
                onClick={() => refreshTasks({ offset: Math.max(0, tasksPage.offset - tasksPage.limit) })}
                disabled={!canPrev || loading}
              >
                Prev
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => refreshTasks({ offset: tasksPage.offset + tasksPage.limit })}
                disabled={!canNext || loading}
              >
                Next
              </button>
            </div>
          </div>

          {error ? <div className="alert" role="alert">{error}</div> : null}

          <div className="task-list" role="list">
            {tasksPage.items.map((t) => (
              <div key={t.id} className={`task-card ${t.is_completed ? "completed" : ""}`} role="listitem">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={t.is_completed}
                    onChange={() => handleToggleComplete(t)}
                    aria-label={t.is_completed ? "Mark task as active" : "Mark task as complete"}
                  />
                  <span className="checkbox-label" />
                </label>

                <div className="task-main">
                  <div className="task-title-row">
                    <div className="task-title">{t.title}</div>
                    <span className={`pill pill-${t.priority}`}>{t.priority}</span>
                    {t.due_date ? <span className="pill pill-due">Due {t.due_date}</span> : null}
                  </div>
                  {t.description ? <div className="task-desc">{t.description}</div> : null}
                  <div className="task-meta">
                    <span className="muted">Category: {t.category_id ? `#${t.category_id}` : "—"}</span>
                  </div>
                </div>

                <div className="task-actions">
                  <button className="btn btn-secondary" onClick={() => openEditTask(t)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteTask(t)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {!loading && tasksPage.items.length === 0 ? (
              <div className="empty">
                <div className="empty-title">No tasks found</div>
                <div className="muted">Try changing filters or create a new task.</div>
                <button className="btn btn-primary" onClick={openCreateTask}>New Task</button>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      {taskModalOpen ? (
        <TaskModal
          categories={categories}
          editingTask={editingTask}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      ) : null}
    </div>
  );
}

function TaskModal({ categories, editingTask, onClose, onSave }) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [description, setDescription] = useState(editingTask?.description || "");
  const [dueDate, setDueDate] = useState(editingTask?.due_date || "");
  const [priority, setPriority] = useState(editingTask?.priority || "medium");
  const [categoryId, setCategoryId] = useState(
    editingTask?.category_id ? String(editingTask.category_id) : ""
  );

  const isEdit = Boolean(editingTask);

  function submit(e) {
    e.preventDefault();
    const payload = {
      title,
      description: description || null,
      due_date: dueDate || null,
      priority,
      category_id: categoryId ? Number(categoryId) : null,
    };
    onSave(payload);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? "Edit task" : "New task"}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? "Edit Task" : "New Task"}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <label className="field">
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} />
          </label>

          <div className="row">
            <label className="field">
              <span>Due date</span>
              <input type="date" value={dueDate || ""} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </label>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
