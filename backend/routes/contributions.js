const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
    const users = await prisma.user.findMany({
        where: { workspaceId: req.user.workspaceId },
        select: { id: true, name: true, avatarColor: true },
    });

    const totals = await prisma.contributionLog.groupBy({
        by: ["userId"],
        _count: { _all: true },
    });
    const completed = await prisma.contributionLog.groupBy({
        by: ["userId"],
        where: { done: true },
        _count: { _all: true },
    });

    const totalMap = Object.fromEntries(totals.map((t) => [t.userId, t._count._all]));
    const completedMap = Object.fromEntries(completed.map((c) => [c.userId, c._count._all]));

    const contributions = users.map((u) => {
        const total = totalMap[u.id] || 0;
        const done = completedMap[u.id] || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
            user_id: u.id,
            name: u.name,
            count: done,
            pct,
            color: u.avatarColor,
            avatar_label: u.name.slice(0, 2),
            avatar_bg: u.avatarColor,
            avatar_fg: "#FFFFFF",
        };
    });

    res.json(contributions);
});

module.exports = router;