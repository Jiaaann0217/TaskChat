const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
    const messages = await prisma.message.findMany({
        where: { roomId: Number(req.query.roomId) },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
    });
    res.json(messages);
});

router.post("/", auth, async (req, res) => {
    const message = await prisma.message.create({
        data: {
            body: req.body.body,
            userId: req.user.id,
            roomId: Number(req.body.roomId),
        },
    });
    res.json(message);
});

module.exports = router;