export type Room = {
  id: number;
  name: string;
  icon: string;
  unread?: number;
};

export type Task = {
  id: number;
  title: string;
  due_label: string;
  color: string;
  overdue: boolean;
  roomId: number | null;
};

export type Message = {
  id: number;
  body: string;
  user_name: string;
  time_label: string;
  avatar_bg: string;
  avatar_fg: string;
  avatar_label: string;
  needs_response: boolean;
};

export type Pin = {
  id: number;
  message_id: number;
  body: string;
  created_by_name: string;
  date_label: string;
};

export type Contribution = {
  user_id: number;
  name: string;
  pct: number;
  count: number;
  color: string;
  avatar_bg: string;
  avatar_fg: string;
  avatar_label: string;
};

type BackendRoom = {
  id: number;
  name: string;
};

type BackendTask = {
  id: number;
  title: string;
  dueDate: string | null;
  done: boolean;
  roomId: number | null;
};

export type BackendMessage = {
  id: number;
  body: string;
  createdAt: string;
  isRecruiting?: boolean;   // ← これを追加
  user?: {
    name?: string;
  };
};

type BackendContribution = {
  id: number;
  name: string;
  _count?: {
    tasks?: number;
  };
};

const colors = ["#378ADD", "#02C39A", "#7F77DD", "#E24B4A"];
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("avatar_color");
  localStorage.removeItem("workspace_name");
  localStorage.removeItem("workspace_code");
  localStorage.removeItem("user_name");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDueLabel(value: string | null | undefined) {
  if (!value) return "期限なし";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function isOverdue(value: string | null | undefined) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function isDueSoon(value: string | null | undefined) {
  if (!value) return false;
  const due = new Date(value).getTime();
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  return due >= now && due - now <= threeDaysMs;
}

function taskColor(dueDate: string | null | undefined, done: boolean) {
  if (done) return "#9A9A94";
  if (isOverdue(dueDate)) return "#E24B4A";   // 赤（期限切れ）
  if (isDueSoon(dueDate)) return "#D97706";   // 黄（期限3日前）
  return "#378ADD";                            // 青（それ以外）
}

function avatarLabel(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "??";
}

export async function fetchRooms(): Promise<Room[]> {
  const rooms = await apiFetch<BackendRoom[]>("/api/rooms");
  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    icon: "ti-message-circle",

  }));
}

export async function fetchTasks(): Promise<Task[]> {
  const tasks = await apiFetch<BackendTask[]>("/api/tasks");
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    due_label: formatDueLabel(task.dueDate),
    color: taskColor(task.dueDate, task.done),
    overdue: !task.done && isOverdue(task.dueDate),
    roomId: task.roomId,
  }));
}

export async function fetchMessages(roomId: number): Promise<Message[]> {
  const messages = await apiFetch<Message[]>(
    `/api/messages?roomId=${roomId}`,
  );
  // バックエンドがすでにフォーマット済みで返しているのでそのまま使う
  return messages;
}

export async function sendMessage(roomId: number, body: string, isRecruiting = false): Promise<Message> {
  return apiFetch<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ roomId, body, isRecruiting }),
  });
}

export async function fetchPins(roomId: number): Promise<Pin[]> {
  return apiFetch<Pin[]>(`/api/pins?roomId=${roomId}`);
}

export async function fetchContributions(): Promise<Contribution[]> {
  return apiFetch<Contribution[]>("/api/contributions");
}

export async function createRoom(name = "新しいチャット"): Promise<Room> {
  const room = await apiFetch<BackendRoom>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  return {
    id: room.id,
    name: room.name,
    icon: "ti-message-circle",
    unread: 0,
  };
}

export async function deleteRoom(roomId: number): Promise<void> {
  await apiFetch(`/api/rooms/${roomId}`, { method: "DELETE" });
}

export async function createTask(
  title: string,
  dueDate: string | null = null,
  messageId: number | null = null
): Promise<{ id: number; roomId: number | null }> {
  const result = await apiFetch<{ success: boolean; task: { id: number; roomId: number | null } }>(
    "/api/tasks/from-message",
    {
      method: "POST",
      body: JSON.stringify({ title, dueDate, messageId }),
    }
  );
  return result.task;
}

// 「やります」ボタン用
export async function joinTaskByMessage(messageId: number): Promise<{ roomId: number | null }> {
  return apiFetch(`/api/tasks/join-by-message/${messageId}`, { method: "POST" });
}

export type RoomTask = {
  id: number;
  done: boolean;
  roomId: number | null;
};

export async function fetchTaskByRoom(roomId: number): Promise<RoomTask | null> {
  return apiFetch<RoomTask | null>(`/api/tasks/by-room/${roomId}`);
}

export async function completeTask(taskId: number): Promise<void> {
  await apiFetch(`/api/tasks/${taskId}/done`, { method: "PATCH" });
}

export async function createPin(roomId: number, messageId: number): Promise<void> {
  await apiFetch("/api/pins", {
    method: "POST",
    body: JSON.stringify({ roomId, messageId }),
  });
}

export async function deleteTask(taskId: number): Promise<void> {
  await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export async function login(
  name: string,
  password: string,
  workspaceCode: string
): Promise<{ name: string; avatarColor: string; workspaceName: string; workspaceCode: string }> {
  const result = await apiFetch<{
    token: string;
    name: string;
    avatarColor: string;
    workspaceName: string;
    workspaceCode: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password, workspaceCode }),
  });
  localStorage.setItem("token", result.token);
  localStorage.setItem("avatar_color", result.avatarColor);
  localStorage.setItem("workspace_name", result.workspaceName);
  localStorage.setItem("workspace_code", result.workspaceCode);
  return result;
}

export async function updateProfile(
  name: string | null,
  avatarColor: string | null
): Promise<{ name: string; avatarColor: string }> {
  const result = await apiFetch<{ token: string; name: string; avatarColor: string }>(
    "/api/auth/me",
    {
      method: "PATCH",
      body: JSON.stringify({ name, avatarColor }),
    }
  );
  localStorage.setItem("token", result.token);
  localStorage.setItem("avatar_color", result.avatarColor);
  return { name: result.name, avatarColor: result.avatarColor };
}

export async function register(name: string, password: string, workspaceCode: string): Promise<void> {
  await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, password, workspaceCode }),
  });
}

export async function createWorkspace(name: string): Promise<{ id: number; name: string; code: string }> {
  return apiFetch("/api/auth/workspaces", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function findWorkspace(code: string): Promise<{ id: number; name: string; code: string }> {
  return apiFetch(`/api/auth/workspaces/${code}`);
}


