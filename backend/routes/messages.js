const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

// アバターの背景色リスト
const COLORS = [
    { bg: "#E1F5EE", fg: "#085041" },
    { bg: "#E6F1FB", fg: "#0C447C" },
    { bg: "#FAEEDA", fg: "#633806" },
    { bg: "#EEEDFE", fg: "#3C3489" },
    { bg: "#FCEBEB", fg: "#791F1F" },
];

function formatMessage(msg, index) {
    const color = COLORS[msg.userId % COLORS.length];
    const date = new Date(msg.createdAt);
    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

    return {
        id: msg.id,
        body: msg.body,
        roomId: msg.roomId,
        userId: msg.userId,
        user_name: msg.user.name,
        avatar_label: msg.user.name.slice(0, 2), // 名前の最初の2文字
        avatar_bg: color.bg,
        avatar_fg: color.fg,
        time_label: time,
        needs_response: msg.isRecruiting ?? false, // 今後フラグを追加予定
        createdAt: msg.createdAt,
    };
}

// メッセージ一覧
router.get("/", auth, async (req, res) => {
    const msgs = await prisma.message.findMany({
        where: { roomId: Number(req.query.roomId) },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
    });
    res.json(msgs.map(formatMessage));
});

// メッセージ送信
router.post("/", auth, async (req, res) => {
    const { roomId, body ,isRecruiting} = req.body;
    const roomIdNum = Number(roomId);

    const msg = await prisma.message.create({
        data: {
            body,
            userId: req.user.id,
            roomId: roomIdNum,
            isRecruiting: Boolean(isRecruiting), // 今後フラグを追加予定
        },
        include: { user: { select: { name: true } } },
    });

    // このルームが作業チャット（Taskに紐づくRoom）なら参加記録を作成
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
