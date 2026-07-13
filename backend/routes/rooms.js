const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

// ルーム一覧
router.get("/", auth, async (req, res) => {
    const rooms = await prisma.room.findMany({
        where: { workspaceId: req.user.workspaceId },
        orderBy: { createdAt: "asc" },
    });
    res.json(rooms);
});

// ルーム作成（チャット開始）
router.post("/", auth, async (req, res) => {
    const room = await prisma.room.create({
        data: { name: req.body.name, workspaceId: req.user.workspaceId },
    });
    res.json(room);
});

// ルーム削除
router.delete("/:id", auth, async (req, res) => {
    const roomId = Number(req.params.id);
    try {
        // リレーションの順番通りに削除（Pin → Message → Room）
        await prisma.pin.deleteMany({ where: { roomId } });
        await prisma.message.deleteMany({ where: { roomId } });
        await prisma.room.delete({ where: { id: roomId } });
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "削除に失敗しました" });
    }
});
module.exports = router;