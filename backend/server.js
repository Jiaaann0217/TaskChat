require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/rooms", require("./routes/rooms"));        // 追加
app.use("/api/messages", require("./routes/messages"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/pins", require("./routes/pins"));         // 追加
app.use("/api/contributions", require("./routes/contributions")); // 追加

app.listen(process.env.PORT || 3000, () => {
  console.log("サーバー起動 http://localhost:3000");
});