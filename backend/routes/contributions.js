const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#E24B4A", "#EF9F27"];
const AVATAR_COLORS = [
    { bg: "#E1F5EE", fg: "#085041" },
    { bg: "#E6F1FB", fg: "#0C447C" },
    { bg: "#EEEDFE", fg: "#3C3489" },
    { bg: "#FCEBEB", fg: "#791F1F" },
    { bg: "#FAEEDA", fg: "#633806" },
];

router.get("/", auth, async (req, res) => {
    const users = await prisma.user.findMany({
        select: { id: true, name: true },
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

    const contributions = users.map((u, i) => {
        const total = totalMap[u.id] || 0;
        const done = completedMap[u.id] || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
            user_id: u.id,
            name: u.name,
            count: done,
            pct,
            color: COLORS[i % COLORS.length],
            avatar_label: u.name.slice(0, 2),
            avatar_bg: AVATAR_COLORS[i % AVATAR_COLORS.length].bg,
            avatar_fg: AVATAR_COLORS[i % AVATAR_COLORS.length].fg,
        };
    });

    res.json(contributions);
});

module.exports = router;