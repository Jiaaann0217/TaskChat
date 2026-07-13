const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
    const tasks = await prisma.task.findMany({
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
    const { title, dueDate } = req.body;
    const { room, task } = await prisma.$transaction(async (tx) => {
        const room = await tx.room.create({ data: { name: `Task: ${title}` } });
        const task = await tx.task.create({
            data: {
                title,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedToId: req.user.id,
                roomId: room.id,
            },
        });
        return { room, task };
    });

    res.json({ success: true, task, room });
});

router.patch("/:id/done", auth, async (req, res) => {
    const task = await prisma.task.update({
        where: { id: Number(req.params.id) },
        data: { done: true },
    });
    res.json(task);
});

router.delete("/:id", auth, async (req, res) => {
    const taskId = Number(req.params.id);
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return res.status(404).json({ error: "Task not found" });

        await prisma.$transaction(async (tx) => {
            if (task.roomId) {
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

module.exports = router;
