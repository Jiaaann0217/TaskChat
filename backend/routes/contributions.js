const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

// 貢献度（ユーザーごとの完了タスク数）
router.get("/", auth, async (req, res) => {
    const contributions = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: { tasks: { where: { done: true } } },
            },
        },
    });
    res.json(contributions);
});

module.exports = router;