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
};

type BackendMessage = {
  id: number;
  body: string;
  createdAt: string;
  isRecruiting?: boolean;   // ← これを追加
  user?: {
    name?: string;
  };
};

type BackendPin = {
  id: number;
  createdAt: string;
  message?: {
    body?: string;
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

function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem("token");
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

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

function formatDateLabel(value: string | null | undefined) {
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

function avatarLabel(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "??";
}

export async function fetchRooms(): Promise<Room[]> {
  const rooms = await apiFetch<BackendRoom[]>("/api/rooms");
  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    icon: "ti-message-circle",
    unread: 0,
  }));
}

export async function fetchTasks(): Promise<Task[]> {
  const tasks = await apiFetch<BackendTask[]>("/api/tasks");
  return tasks.map((task, index) => ({
    id: task.id,
    title: task.title,
    due_label: formatDueLabel(task.dueDate),
    color: task.done ? "#9A9A94" : colors[index % colors.length],
    overdue: !task.done && isOverdue(task.dueDate),
  }));
}

export async function fetchMessages(roomId: number): Promise<Message[]> {
  const messages = await apiFetch<BackendMessage[]>(
    `/api/messages?roomId=${roomId}`,
  );

  return messages.map((message) => {
    const userName = message.user?.name || "User";
    return {
      id: message.id,
      body: message.body,
      user_name: userName,
      time_label: formatDateLabel(message.createdAt),
      avatar_bg: "#E6F1FB",
      avatar_fg: "#0C447C",
      avatar_label: avatarLabel(userName),
      needs_response: message.isRecruiting ?? false,
    };
    });
}

export async function sendMessage(roomId: number, body: string, isRecruiting = false): Promise<void> {
  await apiFetch("/api/messages", {
    method: "POST",
    body: JSON.stringify({ roomId, body, isRecruiting }),
  });
}

export async function fetchPins(roomId: number): Promise<Pin[]> {
  const pins = await apiFetch<BackendPin[]>(`/api/pins?roomId=${roomId}`);
  return pins.map((pin) => ({
    id: pin.id,
    body: pin.message?.body || "",
    created_by_name: "Pinned",
    date_label: formatDateLabel(pin.createdAt),
  }));
}

export async function fetchContributions(): Promise<Contribution[]> {
  const contributions = await apiFetch<BackendContribution[]>(
    "/api/contributions",
  );
  const maxCount = Math.max(
    1,
    ...contributions.map((contribution) => contribution._count?.tasks || 0),
  );

  return contributions.map((contribution, index) => {
    const count = contribution._count?.tasks || 0;
    return {
      user_id: contribution.id,
      name: contribution.name,
      pct: Math.round((count / maxCount) * 100),
      count,
      color: colors[index % colors.length],
      avatar_bg: "#E1F5EE",
      avatar_fg: "#04342C",
      avatar_label: avatarLabel(contribution.name),
    };
  });
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

export async function login(name: string, password: string): Promise<string> {
  const result = await apiFetch<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
  localStorage.setItem("token", result.token);
  return result.token;
}

export async function register(name: string, password: string): Promise<void> {
  await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
}
