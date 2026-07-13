const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

function generateCode() {
    return crypto.randomBytes(4).toString("hex").toUpperCase(); // 例: "A1B2C3D4"
}

// 新しいワークスペースを作成
router.post("/workspaces", async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "ワークスペース名を入力してください" });

    let code;
    for (let i = 0; i < 5; i++) {
        code = generateCode();
        const exists = await prisma.workspace.findUnique({ where: { code } });
        if (!exists) break;
    }

    const workspace = await prisma.workspace.create({
        data: { name: name.trim(), code },
    });
    res.json({ id: workspace.id, name: workspace.name, code: workspace.code });
});

// 招待コードでワークスペースを確認（登録・ログイン画面で使用）
router.get("/workspaces/:code", async (req, res) => {
    const workspace = await prisma.workspace.findUnique({ where: { code: req.params.code.toUpperCase() } });
    if (!workspace) return res.status(404).json({ error: "ワークスペースが見つかりません" });
    res.json({ id: workspace.id, name: workspace.name, code: workspace.code });
});

// ユーザー登録（招待コード必須）
router.post("/register", async (req, res) => {
    const { name, password, workspaceCode } = req.body;
    const workspace = await prisma.workspace.findUnique({ where: { code: (workspaceCode || "").toUpperCase() } });
    if (!workspace) return res.status(404).json({ error: "ワークスペースが見つかりません" });

    try {
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, password: hashed, workspaceId: workspace.id },
        });
        res.json({ message: "登録完了", id: user.id });
    } catch (e) {
        if (e.code === "P2002") {
            return res.status(409).json({ error: "その名前はこのワークスペースですでに使われています" });
        }
        res.status(500).json({ error: "登録に失敗しました" });
    }
});

// ログイン（招待コード必須）
router.post("/login", async (req, res) => {
    const { name, password, workspaceCode } = req.body;
    const workspace = await prisma.workspace.findUnique({ where: { code: (workspaceCode || "").toUpperCase() } });
    if (!workspace) return res.status(404).json({ error: "ワークスペースが見つかりません" });

    const user = await prisma.user.findUnique({
        where: { workspaceId_name: { workspaceId: workspace.id, name } },
    });
    if (!user) return res.status(401).json({ error: "ユーザーが見つかりません" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "パスワードが違います" });

    const token = jwt.sign(
        { id: user.id, name: user.name, workspaceId: user.workspaceId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.json({
        token,
        name: user.name,
        avatarColor: user.avatarColor,
        workspaceName: workspace.name,
        workspaceCode: workspace.code,
    });
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

        const token = jwt.sign(
            { id: user.id, name: user.name, workspaceId: user.workspaceId },
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