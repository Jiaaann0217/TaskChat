const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
    const pins = await prisma.pin.findMany({
        where: { roomId: Number(req.query.roomId) },
        include: {
            message: {
                include: { user: { select: { name: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const formatted = pins.map((pin) => {
        const date = new Date(pin.createdAt);
        return {
            id: pin.id,
            body: pin.message.body,
            created_by_name: pin.message.user.name,
            date_label: `${date.getMonth() + 1}/${date.getDate()}`,
        };
    });

    res.json(formatted);
});

router.post("/", auth, async (req, res) => {
    try {
        const pin = await prisma.pin.create({
            data: {
                messageId: Number(req.body.messageId),
                roomId: Number(req.body.roomId),
            },
            include: { message: true },
        });
        res.json(pin);
    } catch (e) {
        if (e.code === "P2002") {
            return res.status(409).json({ error: "すでにピン止めされています" });
        }
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;