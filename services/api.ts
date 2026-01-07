
import { Transaction, User, AiParsingResult } from "../types";
import { parseTransaction as localAiParse } from "./geminiService";

// 关键修改：生产环境使用相对路径 '/api'
// 这样无论你的域名是什么，它都会自动请求当前域名下的 /api
const API_BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('gf_auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const api = {
    // Auth
    loginWeChat: async (code: string, userInfo: any): Promise<User> => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/wechat`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ code, userInfo })
            });
            if (!res.ok) throw new Error('Login failed');
            const data = await res.json();
            localStorage.setItem('gf_auth_token', data.token);
            return data.user;
        } catch (e) {
            console.warn("Backend unavailable, using mock login");
            return {
                id: `user_${Date.now()}`,
                name: userInfo.nickName || '微信用户',
                avatar: userInfo.avatarUrl || 'https://api.dicebear.com/7.x/notionists/svg?seed=wechat',
                isFamilyAdmin: true,
                isPremium: true
            };
        }
    },

    // Transactions
    getTransactions: async (): Promise<Transaction[]> => {
        try {
            const res = await fetch(`${API_BASE_URL}/sync`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                return data.transactions;
            }
        } catch (e) { /* ignore */ }
        
        // Fallback to LocalStorage
        const local = localStorage.getItem('gf_transactions');
        return local ? JSON.parse(local) : [];
    },

    saveTransaction: async (t: Transaction): Promise<void> => {
        // 1. Save locally first (Optimistic UI)
        const local = localStorage.getItem('gf_transactions');
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem('gf_transactions', JSON.stringify([t, ...list]));

        // 2. Try to sync to server
        try {
            await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(t)
            });
        } catch (e) {
            console.warn("Saved locally only (Backend offline)");
        }
    },

    // AI Parsing (Proxy to Server or Local Fallback)
    parseTransaction: async (text: string, imageBase64?: string): Promise<AiParsingResult> => {
        try {
            const res = await fetch(`${API_BASE_URL}/ai/parse`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ text, imageBase64 })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) { /* ignore */ }

        // Fallback to Client-Side Gemini (using geminiService.ts)
        return localAiParse(text, imageBase64);
    }
};
