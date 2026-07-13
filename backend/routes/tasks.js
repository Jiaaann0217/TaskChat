const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");
const ensureRoomAccess = require("../middleware/roomAccess");

router.get("/", auth, async (req, res) => {
    const tasks = await prisma.task.findMany({
        where: { room: { workspaceId: req.user.workspaceId } },
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { name: true } } },
    });
    res.json(tasks);
});

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

router.post("/from-message", auth, async (req, res) => {
    const { title, dueDate, messageId } = req.body;
    const { room, task } = await prisma.$transaction(async (tx) => {
        const room = await tx.room.create({
            data: {
                name: `Task: ${title}`,
                workspace: { connect: { id: req.user.workspaceId } },
            },
        });
        const task = await tx.task.create({
            data: {
                title,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedToId: req.user.id,
                roomId: room.id,
                sourceMessageId: messageId ? Number(messageId) : null,
            },
        });
        // 募集者自身は自動的に参加者として登録
        await tx.taskParticipant.create({
            data: { taskId: task.id, userId: req.user.id },
        });
        return { room, task };
    });

    res.json({ success: true, task, room });
});

// 「やります」ボタン → 元メッセージから該当タスクを特定して参加登録
router.post("/join-by-message/:messageId", auth, async (req, res) => {
    const messageId = Number(req.params.messageId);
    const task = await prisma.task.findUnique({ where: { sourceMessageId: messageId } });
    if (!task) return res.status(404).json({ error: "対応する作業が見つかりません" });

    try {
        await prisma.taskParticipant.upsert({
            where: { taskId_userId: { taskId: task.id, userId: req.user.id } },
            update: {},
            create: { taskId: task.id, userId: req.user.id },
        });
        res.json({ success: true, roomId: task.roomId });
    } catch (e) {
        res.status(500).json({ error: "参加に失敗しました" });
    }
});

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
                    create: { userId: p.userId, roomId: task.roomId, done: true },
                })
            )
        );
    }

    res.json(task);
});

router.delete("/:id", auth, async (req, res) => {
    const taskId = Number(req.params.id);
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return res.status(404).json({ error: "Task not found" });

        await prisma.$transaction(async (tx) => {
            if (task.roomId) {
                await tx.taskParticipant.deleteMany({ where: { taskId } });
                await tx.pin.deleteMany({ where: { roomId: task.roomId } });
                await tx.message.deleteMany({ where: { roomId: task.roomId } });
            }
            await tx.task.delete({ where: { id: taskId } });
            if (task.roomId) await tx.room.delete({ where: { id: task.roomId } });
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete task" });
    }
});

router.get("/by-room/:roomId", auth, ensureRoomAccess, async (req, res) => {
    const roomId = Number(req.params.roomId);
    const task = await prisma.task.findFirst({ where: { roomId } });
    res.json(task);
});

module.exports = router;