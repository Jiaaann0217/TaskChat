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
  needs_response?: boolean; // trueのときやりますボタンを表示
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

export async function fetchRooms(): Promise<Room[]> {
  // const res = await fetch("/api/rooms");
  // return res.json();
  return [];
}

export async function fetchTasks(): Promise<Task[]> {
  // const res = await fetch("/api/tasks");
  // return res.json();
  return [];
}

export async function fetchMessages(roomId: number): Promise<Message[]> {
  // const res = await fetch(`/api/messages?roomId=${roomId}`);
  // return res.json();
  return [];
}

export async function sendMessage(roomId: number, body: string): Promise<void> {
  // await fetch("/api/messages", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ roomId, body }),
  // });
}

export async function fetchPins(roomId: number): Promise<Pin[]> {
  // const res = await fetch(`/api/pins?roomId=${roomId}`);
  // return res.json();
  return [];
}

export async function fetchContributions(): Promise<Contribution[]> {
  // const res = await fetch("/api/contributions");
  // return res.json();
  return [];
}
