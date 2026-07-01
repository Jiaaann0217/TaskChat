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
        select: {
            id: true,
            name: true,
            _count: {
                select: { tasks: { where: { done: true } } },
            },
        },
    });

    // 最大値を基準にパーセントを計算
    const max = Math.max(...users.map((u) => u._count.tasks), 1);

    const contributions = users.map((u, i) => ({
        user_id: u.id,
        name: u.name,
        count: u._count.tasks,
        pct: Math.round((u._count.tasks / max) * 100),
        color: COLORS[i % COLORS.length],
        avatar_label: u.name.slice(0, 2),
        avatar_bg: AVATAR_COLORS[i % AVATAR_COLORS.length].bg,
        avatar_fg: AVATAR_COLORS[i % AVATAR_COLORS.length].fg,
    }));

    res.json(contributions);
});

module.exports = router;