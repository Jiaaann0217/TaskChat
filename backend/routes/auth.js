const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

router.post("/register", async (req, res) => {
    const { name, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { name, password: hashed },
    });
    res.json({ message: "登録完了", id: user.id });
});

router.post("/login", async (req, res) => {
    const { name, password } = req.body;
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) return res.status(401).json({ error: "ユーザーが見つかりません" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "パスワードが違います" });

    const token = jwt.sign(
        { id: user.id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.json({ token, name: user.name, avatarColor: user.avatarColor });
});

// プロフィール更新（名前・アバターの色）
router.patch("/me", auth, async (req, res) => {
    const { name, avatarColor } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name ? { name } : {}),
                ...(avatarColor ? { avatarColor } : {}),
            },
        });

        // 名前を変更した場合、トークンを新しく発行し直す
        const token = jwt.sign(
            { id: user.id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, name: user.name, avatarColor: user.avatarColor });
    } catch (e) {
        if (e.code === "P2002") {
            return res.status(409).json({ error: "その名前はすでに使われています" });
        }
        res.status(500).json({ error: "更新に失敗しました" });
    }
});

module.exports = router;