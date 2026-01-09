
import { Transaction, User, AiParsingResult } from "../types";
import { parseTransaction as localAiParse } from "./geminiService";
import { log, handleError } from "./errorHandler";

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
            log.info('Attempting WeChat login', { code: code.substring(0, 5) + '...' });
            const res = await fetch(`${API_BASE_URL}/auth/wechat`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ code, userInfo })
            });
            if (!res.ok) throw new Error('Login failed');
            const data = await res.json();
            localStorage.setItem('gf_auth_token', data.token);
            log.info('WeChat login successful', { userId: data.user.id });
            return data.user;
        } catch (e) {
            log.warn("Backend unavailable, using mock login", { error: handleError.api(e) });
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
            log.info('Fetching transactions from server');
            const res = await fetch(`${API_BASE_URL}/sync`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                log.info('Transactions fetched successfully', { count: data.transactions.length });
                return data.transactions;
            }
            throw new Error('Failed to fetch transactions');
        } catch (e) {
            log.warn("Failed to fetch transactions from server, falling back to localStorage", { error: handleError.api(e) });
            // Fallback to LocalStorage
            const local = localStorage.getItem('gf_transactions');
            const transactions = local ? JSON.parse(local) : [];
            log.info('Loaded transactions from localStorage', { count: transactions.length });
            return transactions;
        }
    },

    saveTransaction: async (t: Transaction): Promise<void> => {
        // 1. Save locally first (Optimistic UI)
        const local = localStorage.getItem('gf_transactions');
        const list = local ? JSON.parse(local) : [];
        localStorage.setItem('gf_transactions', JSON.stringify([t, ...list]));
        log.info('Transaction saved to localStorage', { transactionId: t.id, category: t.category });

        // 2. Try to sync to server
        try {
            log.info('Syncing transaction to server', { transactionId: t.id });
            await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(t)
            });
            log.info('Transaction synced to server successfully', { transactionId: t.id });
        } catch (e) {
            log.warn("Saved locally only (Backend offline)", { error: handleError.api(e), transactionId: t.id });
        }
    },

    // AI Parsing (Proxy to Server or Local Fallback)
    parseTransaction: async (text: string, imageBase64?: string): Promise<AiParsingResult> => {
        try {
            log.info('Sending text to server for AI parsing', { text: text.substring(0, 20) + '...' });
            const res = await fetch(`${API_BASE_URL}/ai/parse`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ text, imageBase64 })
            });
            if (res.ok) {
                const result = await res.json();
                log.info('AI parsing successful from server', { result: result.category });
                return result;
            }
            throw new Error('Failed to parse transaction from server');
        } catch (e) {
            log.warn("Failed to parse transaction from server, falling back to local AI", { error: handleError.api(e) });
            // Fallback to Client-Side Gemini (using geminiService.ts)
            log.info('Using local AI parsing service');
            return localAiParse(text, imageBase64);
        }
    }
};
