require("dotenv").config();
const express = require("express");
const expressWs = require("express-ws");
const cors = require("cors");

const app = express();
expressWs(app); // expressにWebSocketを追加

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// 接続中のクライアントをルームごとに管理
const rooms = {};

// WebSocketエンドポイント
app.ws("/ws/:roomId", (ws, req) => {
  const roomId = req.params.roomId;

  // ルームに追加
  if (!rooms[roomId]) rooms[roomId] = new Set();
  rooms[roomId].add(ws);
  console.log(`ルーム${roomId}に接続 (${rooms[roomId].size}人)`);

  // メッセージを受信したら同じルーム全員に送信
ws.on("message", (data) => {
  const message = JSON.parse(data);
  rooms[roomId].forEach((client) => {
    // 送信者自身には返さない
    if (client !== ws && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
});

  // 切断したらルームから削除
  ws.on("close", () => {
    rooms[roomId].delete(ws);
    console.log(`ルーム${roomId}から切断 (${rooms[roomId].size}人)`);
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/pins", require("./routes/pins"));
app.use("/api/contributions", require("./routes/contributions"));

app.listen(process.env.PORT || 3000, () => {
  console.log("サーバー起動 http://localhost:3000");
});