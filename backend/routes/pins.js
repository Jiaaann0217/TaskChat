const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

// ピン一覧（roomIdで絞り込み）
router.get("/", auth, async (req, res) => {
    const pins = await prisma.pin.findMany({
        where: { roomId: Number(req.query.roomId) },
        include: { message: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(pins);
});

// ピン止め
router.post("/", auth, async (req, res) => {
    const pin = await prisma.pin.create({
        data: {
            messageId: Number(req.body.messageId),
            roomId: Number(req.body.roomId),
        },
    });
    res.json(pin);
});

module.exports = router;