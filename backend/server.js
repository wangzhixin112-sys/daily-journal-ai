
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const { GoogleGenAI } = require("@google/genai");
const path = require('path');
const util = require('util');

const app = express();
// 端口改为 3000
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY; 

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// --- Middleware ---
const getUserId = (req) => req.headers['x-user-id'];

// --- DB Helpers ---
const dbRun = util.promisify(db.run.bind(db));
const dbAll = util.promisify(db.all.bind(db));

// --- API Routes (Prefix /api) ---

app.post('/api/auth/wechat', async (req, res) => {
    const { userInfo } = req.body;
    // Mock Login Logic for Simplicity
    const userId = `user_${Date.now()}`;
    await dbRun(
        "INSERT OR IGNORE INTO users (id, name, avatar, is_family_admin, is_premium, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, userInfo.nickName || '用户', userInfo.avatarUrl, 1, 1, new Date().toISOString()]
    );
    res.json({ user: { id: userId, name: userInfo.nickName, isFamilyAdmin: true }, token: userId });
});

app.get('/api/sync', async (req, res) => {
    try {
        const transactions = await dbAll("SELECT * FROM transactions");
        res.json({ transactions: transactions.map(r => ({...r, userId: r.user_id, babyId: r.baby_id, cardId: r.card_id, loanId: r.loan_id })), creditCards: [], loans: [], goals: [], babies: [], notes: [] });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const t = req.body;
        await dbRun(`INSERT OR REPLACE INTO transactions (id, user_id, amount, type, category, note, date, baby_id, card_id, loan_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [t.id, t.userId, t.amount, t.type, t.category, t.note, t.date, t.babyId, t.cardId, t.loanId, new Date().toISOString()]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/ai/parse', async (req, res) => {
    const { text, imageBase64 } = req.body;
    if (!API_KEY) return res.status(500).json({ error: "Missing API Key" });
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        let contents = imageBase64 ? [{ inlineData: { mimeType: "image/jpeg", data: imageBase64 } }, { text: "Analyze receipt JSON." }] : `Analyze text: "${text}". Return JSON.`;
        const model = imageBase64 ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
        const response = await ai.models.generateContent({
            model, contents,
            config: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { amount: {type:"NUMBER"}, type: {type:"STRING"}, category: {type:"STRING"}, note: {type:"STRING"}, date: {type:"STRING"} } } }
        });
        res.json(response.text ? JSON.parse(response.text) : {});
    } catch (e) { res.status(500).json({ error: "AI Failed" }); }
});

// --- 托管前端静态文件 ---
// 指向 backend 文件夹上一级的 dist 文件夹
app.use(express.static(path.join(__dirname, '../dist')));

// 任何其他请求返回 index.html (支持 React 路由)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
