require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/tasks", require("./routes/tasks"));

app.listen(process.env.PORT || 3000, () => {
  console.log("サーバー起動 http://localhost:3000");
});