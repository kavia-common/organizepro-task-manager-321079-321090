/**
 * Minimal API client for the Task Manager backend.
 */

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:3001";

async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || data.message || JSON.stringify(data);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

// PUBLIC_INTERFACE
export const api = {
  /** Fetch categories list */
  listCategories: () => request("/categories"),
  /** Create category */
  createCategory: (payload) => request("/categories", { method: "POST", body: payload }),
  /** Update category */
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: "PUT", body: payload }),
  /** Delete category */
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  /** Fetch tasks with query params */
  listTasks: (params) => {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      usp.set(k, String(v));
    });
    const qs = usp.toString() ? `?${usp.toString()}` : "";
    return request(`/tasks${qs}`);
  },
  /** Create task */
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  /** Update task */
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: "PUT", body: payload }),
  /** Delete task */
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  /** Mark complete */
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: "PATCH" }),
  /** Reopen task */
  reopenTask: (id) => request(`/tasks/${id}/reopen`, { method: "PATCH" }),
};
