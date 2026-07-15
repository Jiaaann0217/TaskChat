const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");
const ensureRoomAccess = require("../middleware/roomAccess");

// ルーム一覧
router.get("/", auth, async (req, res) => {
    const rooms = await prisma.room.findMany({
        where: { workspaceId: req.user.workspaceId },
        orderBy: { createdAt: "asc" },
        include: { tasks: { select: { id: true, assignedToId: true } } },
    });

    const myParticipations = await prisma.taskParticipant.findMany({
        where: { userId: req.user.id },
        select: { taskId: true },
    });
    const joinedTaskIds = new Set(myParticipations.map((p) => p.taskId));

    const visibleRooms = rooms
        .filter((room) => {
            const task = room.tasks[0];
            if (!task) return true; // 通常のチャットは全員閲覧可
            return task.assignedToId === req.user.id || joinedTaskIds.has(task.id);
        })
        .map(({ id, name }) => ({ id, name }));
    res.json(visibleRooms);
});

// ルーム1件の情報を取得（チャットヘッダーの名前表示用）
router.get("/:roomId", auth, ensureRoomAccess, async (req, res) => {
    const room = await prisma.room.findUnique({ where: { id: Number(req.params.roomId) } });
    if (!room) return res.status(404).json({ error: "ルームが見つかりません" });
    res.json({ id: room.id, name: room.name });
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
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room || room.workspaceId !== req.user.workspaceId) {
            return res.status(404).json({ error: "ルームが見つかりません" });
        }
        // リレーションの順番通りに削除（Pin → Message → Room）
        await prisma.$transaction(async (tx) => {
            await tx.taskParticipant.deleteMany({ where: { task: { roomId } } });
            await tx.pin.deleteMany({ where: { roomId } });
            await tx.message.deleteMany({ where: { roomId } });
            await tx.task.deleteMany({ where: { roomId } });
            await tx.room.delete({ where: { id: roomId } });
        });
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "削除に失敗しました" });
    }
});
module.exports = router;
