const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");
const ensureRoomAccess = require("../middleware/roomAccess");

router.get("/", auth, ensureRoomAccess, async (req, res) => {
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
        const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
        return {
            id: pin.id,
            message_id: pin.messageId,
            body: pin.message.body,
            created_by_name: pin.message.user.name,
            date_label: `${jstDate.getUTCMonth() + 1}/${jstDate.getUTCDate()}`,
        };
    });

    res.json(formatted);
});

router.post("/", auth, ensureRoomAccess, async (req, res) => {
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

// ピン解除
router.delete("/:messageId", auth, ensureRoomAccess, async (req, res) => {
    const messageId = Number(req.params.messageId);
    const roomId = Number(req.query.roomId);
    try {
        const pin = await prisma.pin.findUnique({ where: { messageId } });
        if (!pin || pin.roomId !== roomId) {
            return res.status(404).json({ error: "ピアが見つかりません" });
        }
        await prisma.pin.delete({ where: { messageId } });
        res.status(204).send();
    } catch (e) {
        if (e.code === "P2025") {
            return res.status(404).json({ error: "ピンが見つかりません" });
        }
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;