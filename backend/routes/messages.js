const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");
const ensureRoomAccess = require("../middleware/roomAccess");

function formatMessage(msg) {
    const date = new Date(msg.createdAt);
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

    return {
        id: msg.id,
        body: msg.body,
        roomId: msg.roomId,
        userId: msg.userId,
        user_name: msg.user.name,
        avatar_label: msg.user.name.slice(0, 2),
        avatar_bg: msg.user.avatarColor,
        avatar_fg: "#FFFFFF",
        time_label: time,
        needs_response: msg.isRecruiting ?? false,
        createdAt: msg.createdAt,
    };
}

// メッセージ一覧
router.get("/", auth, ensureRoomAccess, async (req, res) => {
    const msgs = await prisma.message.findMany({
        where: { roomId: Number(req.query.roomId) },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, avatarColor: true } } },
    });
    res.json(msgs.map(formatMessage));
});

// メッセージ送信
router.post("/", auth, ensureRoomAccess, async (req, res) => {
    const { roomId, body ,isRecruiting} = req.body;
    const roomIdNum = Number(roomId);

    const msg = await prisma.message.create({
        data: {
            body,
            userId: req.user.id,
            roomId: roomIdNum,
            isRecruiting: Boolean(isRecruiting), // 今後フラグを追加予定
        },
        include: { user: { select: { name: true, avatarColor: true } } },
    });

    const task = await prisma.task.findFirst({ where: { roomId: roomIdNum } });
    if (task) {
        await prisma.contributionLog.upsert({
            where: { userId_roomId: { userId: req.user.id, roomId: roomIdNum } },
            update: {},
            create: {
                userId: req.user.id,
                roomId: roomIdNum,
                done: task.done,
            },
        }); 
    }

    res.json(formatMessage(msg));
});

module.exports = router;
