require('dotenv').config();
// ================== IMPORTS ==================
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================== DATABASE ==================
let db;

async function startServer() {
    try {
        await initDB();
        console.log("✅ MySQL Connected");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    } catch (err) {
        console.error("❌ DB Error:", err);
    }
}

startServer();
// ================== AUTH MIDDLEWARE ==================
function authMiddleware(req, res, next) {
    const username = req.cookies.username;
    if (!username) {
        return res.status(401).json({ success: false, message: "Login required" });
    }
    req.username = username;
    next();
}

// ================== ADMIN MIDDLEWARE ==================
async function adminMiddleware(req, res, next) {
    try {
        const username = req.cookies.username;
        if (!username) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const [rows] = await db.execute(
            "SELECT isAdmin FROM users WHERE username = ?",
            [username]
        );

        if (rows.length === 0 || rows[0].isAdmin === 0) {
            return res.status(403).json({ success: false, message: "Not admin" });
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// ================== AUTH ROUTES ==================

// 🔐 LOGIN
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0)
            return res.json({ success: false, message: "Invalid credentials" });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.json({ success: false, message: "Invalid credentials" });

        // update login time
        await db.execute("UPDATE users SET lastLogin = NOW() WHERE id = ?", [user.id]);

        // log activity
        await db.execute(
            "INSERT INTO user_activity (user_id, activity_type) VALUES (?, ?)",
            [user.id, "login"]
        );

        // set cookie
        res.cookie("username", user.username, {
            httpOnly: true,
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            isAdmin: user.isAdmin === 1,
            username: user.username
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Server error" });
    }
});

// 📝 SIGNUP
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const [exist] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (exist.length > 0) {
            return res.json({ success: false, message: "Email already used" });
        }

        const hash = await bcrypt.hash(password, 10);

        await db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hash]
        );

        res.json({ success: true, message: "Account created" });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Server error" });
    }
});

// 🔁 CHECK LOGIN
app.get("/profile", (req, res) => {
    const username = req.cookies.username;

    if (!username) return res.json({ loggedIn: false });

    res.json({ loggedIn: true, username });
});

// 🚪 LOGOUT
app.post("/logout", (req, res) => {
    res.clearCookie("username");
    res.json({ success: true, message: "Logged out" });
});

// 🔑 FORGOT PASSWORD
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.json({ success: false, message: "Email not found" });
        }

        const user = rows[0];

        await db.execute(
            "INSERT INTO user_activity (user_id, activity_type) VALUES (?, ?)",
            [user.id, "forgot-password"]
        );

        res.json({ success: true, message: "Request sent to admin" });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Server error" });
    }
});

// ================== MATERIAL ROUTES ==================

// 📚 GET MATERIALS (FOR USERS)
app.get("/materials", async (req, res) => {
    const { subject, type } = req.query;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM study_materials WHERE subject = ? AND type = ? ORDER BY uploaded_at DESC",
            [subject, type]
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ================== FILE UPLOAD ==================
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// 📤 UPLOAD MATERIAL (ADMIN)
const allowedTypes = ["Worksheet", "Question Paper", "NCERT Solution"];

app.post("/admin/upload-material", adminMiddleware, upload.single("file"), async (req, res) => {
    try {
        const { subject, chapter, type } = req.body;
        const file = req.file;

        // ✅ Validate type
        if (!allowedTypes.includes(type)) {
            return res.json({ success: false, message: "Invalid file type selected" });
        }

        if (!subject || !chapter || !type || !file) {
            return res.json({ success: false, message: "All fields required" });
        }

        await db.execute(
            "INSERT INTO study_materials (subject, chapter, type, filename) VALUES (?, ?, ?, ?)",
            [subject, chapter, type, file.filename]
        );

        res.json({ success: true, message: "Uploaded successfully" });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Upload failed" });
    }
});
// 📥 ADMIN VIEW MATERIALS
app.get("/admin/materials", adminMiddleware, async (req, res) => {
    const [rows] = await db.execute("SELECT * FROM study_materials ORDER BY uploaded_at DESC");
    res.json(rows);
});

// ❌ DELETE MATERIAL
app.delete("/admin/materials/:id", adminMiddleware, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.execute("SELECT filename FROM study_materials WHERE id = ?", [id]);
        if (rows.length === 0) return res.json({ success: false });

        const filePath = path.join(uploadDir, rows[0].filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.execute("DELETE FROM study_materials WHERE id = ?", [id]);

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

// ================== ADMIN EXTRA ==================

// 👥 LOGGED USERS
app.get("/admin/logged-in-users", adminMiddleware, async (req, res) => {
    const [rows] = await db.execute(
        "SELECT id, username, email, lastLogin FROM users WHERE lastLogin IS NOT NULL"
    );
    res.json(rows);
});

// 🔑 FORGOT REQUESTS
app.get("/admin/forgot-password-requests", adminMiddleware, async (req, res) => {
    const [rows] = await db.execute(`
        SELECT ua.id, u.username, u.email, ua.created_at AS requestTime
        FROM user_activity ua
        JOIN users u ON u.id = ua.user_id
        WHERE ua.activity_type = 'forgot-password'
        ORDER BY ua.created_at DESC
    `);

    res.json(rows);
});

// ❌ DELETE FORGOT REQUEST
app.delete("/admin/forgot-password/:id", adminMiddleware, async (req, res) => {
    await db.execute(
        "DELETE FROM user_activity WHERE id = ? AND activity_type = 'forgot-password'",
        [req.params.id]
    );

    res.json({ success: true });
});

