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

router.patch("/:id/done", auth, async (req, res) => {
    const task = await prisma.task.update({
        where: { id: Number(req.params.id) },
        data: { done: true },
    });
    res.json(task);
});

module.exports = router;