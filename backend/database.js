
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize DB
const dbPath = path.resolve(__dirname, 'meiriji.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        openid TEXT,
        is_family_admin INTEGER DEFAULT 0,
        is_premium INTEGER DEFAULT 0,
        created_at TEXT
    )`);

    // Transactions
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount REAL,
        type TEXT,
        category TEXT,
        note TEXT,
        date TEXT,
        baby_id TEXT,
        card_id TEXT,
        loan_id TEXT,
        created_at TEXT
    )`);

    // Generic Assets Storage (Cards/Loans) - Storing JSON for flexibility
    db.run(`CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        type TEXT, 
        user_id TEXT,
        data TEXT, 
        created_at TEXT
    )`);
    
    // Goals
    db.run(`CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        target_amount REAL,
        current_amount REAL,
        icon TEXT,
        color TEXT,
        created_at TEXT
    )`);
    
    // Notes
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_avatar TEXT,
        content TEXT,
        emoji TEXT,
        color TEXT,
        created_at TEXT
    )`);
    
    // Babies
    db.run(`CREATE TABLE IF NOT EXISTS babies (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        avatar TEXT,
        birth_date TEXT,
        created_at TEXT
    )`);
});

module.exports = db;
