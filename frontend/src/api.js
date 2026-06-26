// バックエンド接続前はすべて空データを返す
// 接続時は各関数内のコメントを外して使う

export async function fetchRooms() {
  // const res = await fetch("/api/rooms");
  // return res.json();
  return [];
}

export async function fetchTasks() {
  // const res = await fetch("/api/tasks");
  // return res.json();
  return [];
}

export async function fetchMessages(roomId) {
  // const res = await fetch(`/api/messages?roomId=${roomId}`);
  // return res.json();
  return [];
}

export async function sendMessage(roomId, body) {
  // const res = await fetch("/api/messages", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ roomId, body }),
  // });
  // return res.json();
  return null;
}

export async function fetchPins(roomId) {
  // const res = await fetch(`/api/pins?roomId=${roomId}`);
  // return res.json();
  return [];
}

export async function fetchContributions() {
  // const res = await fetch("/api/contributions");
  // return res.json();
  return [];
}
