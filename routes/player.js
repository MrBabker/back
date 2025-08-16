import express from 'express';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.J_SECRET; // حط مفتاح قوي وسري جدا، وحافظ عليه في env
const router = express.Router();



// Middleware للتحقق من التوكن
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id; // نخزن ID اللاعب
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
}














// مثال API: جلب بيانات من جدول players
router.get("/players", async (req, res) => {

    try {
        const { data, error } = await supabase
            .from("Players")
            .select("*");

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

});

// مثال API: إضافة لاعب جديد
router.post("/register", async (req, res) => {
    const { name, email, password, lvl = 0, avatar = 0, rank = 0, xp = 0, quests } = req.body;


    // تحقق أساسي من المدخلات
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
    }

    try {
        // تشفير كلمة المرور قبل التخزين
        const hashedPassword = await bcrypt.hash(password, 10);

        // إدخال السجل في جدول Supabase
        const { data, error } = await supabase
            .from("Players") // يفضل الأحرف الصغيرة لجدول Postgres
            .insert([{
                name: name,
                email: email,
                password: hashedPassword,
                lvl: lvl,
                avatar: avatar,
                rank: rank,
                xp: xp,
                quests: quests
            }])
            .select(); // تخلي Supabase يرجّع الصف المُضاف

        // معالجة أخطاء Supabase
        if (error) return res.status(500).json({ error: error.message });

        // إرجاع النتيجة للعميل
        return res.status(200).json({ success: true, message: "register successful", player: data });
    } catch (err) {
        // أي خطأ غير متوقع
        return res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    const { name, email, password } = req.body; // identifier = إيميل أو اسم
    const user = req.body;
    try {
        const { data, error } = await supabase
            .from("Players")
            .select("*")
            .or(`email.eq.${email},name.eq.${name}`)
            .single();

        if (!data) {
            return res.status(404).json({ message: "This account not exist !" });
        }

        if (error) {
            return res.status(401).json({ message: "email or username or password wrong" });
        }

        const pass = await bcrypt.compare(password, data.password);
        if (!pass) {
            return res.status(401).json({ message: "email or username or password wrong" });
        }

        // 🔹 توليد التوكن
        const token = jwt.sign(
            { id: data.id, email: data.email }, // البيانات اللي تخزنها بالتوكن
            JWT_SECRET,
            { expiresIn: "300d" } // مدة الصلاحية (مثال: 7 أيام)
        );

        //return res.status(200).json({ email: data.email, username: data.username });
        return res.status(200).json({ success: true, message: "Login successful", token, player: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


router.put("/name", authMiddleware, async (req, res) => {
    const { playername } = req.body;

    if (!playername) {
        return res.status(400).json({ message: "playername is required" });
    }

    try {
        const { data, error } = await supabase
            .from("Players")
            .update({ playername })
            .eq("id", req.userId) // التعديل فقط على اللاعب الحالي
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Player not found" });
        }

        return res.status(200).json({
            message: "Name updated successfully",
            player: { playername: data[0].playername }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});




export default router;




