// استدعاء المكتبات
import express from "express";
import dotenv from "dotenv";

import playersRoutes from './routes/player.js';
// تحميل متغيرات البيئة
dotenv.config();

// تهيئة Express
const app = express();
app.use(express.json());

// استخدام الراوت
app.use("/players", playersRoutes);

// تشغيل السيرفر
/*const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on 192.168.1.104:${PORT}`);
});



