const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

// タスク一覧
router.get("/", auth, async (req, res) => {
    const tasks = await prisma.task.findMany({
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { name: true } } },
    });
    res.json(tasks);
});

// タスク作成（「やります」ボタン）
router.post("/", auth, async (req, res) => {
    const task = await prisma.task.create({
        data: {
            title: req.body.title,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
            assignedToId: req.user.id,
        },
    });
    res.json(task);
});

// やります（messageIdからタスク化）→ 同時に専用チャットルームも作成
router.post("/from-message", auth, async (req, res) => {
    const room = await prisma.room.create({
        data: { name: `作業: ${req.body.title}` },
    });

    const task = await prisma.task.create({
        data: {
            title: req.body.title,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
            assignedToId: req.user.id,
            roomId: room.id,
        },
    });

    res.json({ success: true, task, room });
});

// タスク完了（完了ボタン）→ 参加者の記録をdone:trueに更新
router.patch("/:id/done", auth, async (req, res) => {
    const task = await prisma.task.update({
        where: { id: Number(req.params.id) },
        data: { done: true },
    });

    if (task.roomId) {
        const participants = await prisma.message.findMany({
            where: { roomId: task.roomId },
            select: { userId: true },
            distinct: ["userId"],
        });

        await Promise.all(
            participants.map((p) =>
                prisma.contributionLog.upsert({
                    where: { userId_roomId: { userId: p.userId, roomId: task.roomId } },
                    update: { done: true },
                    create: {
                        userId: p.userId,
                        roomId: task.roomId,
                        done: true,
                    },
                })
            )
        );
    }

    res.json(task);
});

// タスク削除（紐づく作業チャットも削除）
router.delete("/:id", auth, async (req, res) => {
    const taskId = Number(req.params.id);
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return res.status(404).json({ error: "タスクが見つかりません" });

        if (task.roomId) {
            await prisma.pin.deleteMany({ where: { roomId: task.roomId } });
            await prisma.message.deleteMany({ where: { roomId: task.roomId } });
        }

        await prisma.task.delete({ where: { id: taskId } });

        if (task.roomId) {
            await prisma.room.delete({ where: { id: task.roomId } });
        }

        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "削除に失敗しました" });
    }
});

// ルームIDから紐づくタスクを取得（作業チャット用）
router.get("/by-room/:roomId", auth, async (req, res) => {
    const roomId = Number(req.params.roomId);
    const task = await prisma.task.findFirst({ where: { roomId } });
    res.json(task);
});

module.exports = router;