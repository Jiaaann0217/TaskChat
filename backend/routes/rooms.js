const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

// ルーム一覧
router.get("/", auth, async (req, res) => {
    const rooms = await prisma.room.findMany({
        orderBy: { createdAt: "asc" },
    });
    res.json(rooms);
});

// ルーム作成（チャット開始）
router.post("/", auth, async (req, res) => {
    const room = await prisma.room.create({
        data: { name: req.body.name },
    });
    res.json(room);
});

module.exports = router;