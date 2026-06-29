const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

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
    res.json({ token });
});

module.exports = router;