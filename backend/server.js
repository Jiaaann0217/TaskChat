const express = require("express");

const app = express();

app.get("/api/tasks", (req, res) => {
  res.json([
    {
      id: 1,
      title: "ログイン画面作成"
    }
  ]);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});