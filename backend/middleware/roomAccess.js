const prisma = require("../prisma/client");

module.exports = async function ensureRoomAccess(req, res, next) {
    const roomId = Number(req.params.roomId ?? req.query.roomId ?? req.body.roomId);
    if (!roomId) return res.status(400).json({ error: "roomIdが必要です" });

    const task = await prisma.task.findFirst({ where: { roomId } });
    if (task) {
        const isOwner = task.assignedToId === req.user.id;
        if (!isOwner) {
            const participant = await prisma.taskParticipant.findUnique({
                where: { taskId_userId: { taskId: task.id, userId: req.user.id } },
            });
            if (!participant) {
                return res.status(403).json({ error: "この作業チャットに参加していません" });
            }
        }
    }
    next();
};