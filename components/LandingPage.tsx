
import React, { useState } from 'react';
import { Wallet, Mic, Users, PieChart, Sparkles, ArrowRight, Smartphone } from './Icons';

interface Props { onLogin: (name: string) => void; }

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [showInput, setShowInput] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 w-full flex flex-col overflow-x-hidden">
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600"><div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Wallet size={20} fill="currentColor" /></div><span className="font-bold text-lg tracking-tight text-slate-900">每日记</span></div>
        <button onClick={() => setShowInput(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg">登录 / 注册</button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 relative">
        <div className="max-w-4xl text-center z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold mb-8 animate-bounce">
            <Sparkles size={14} /> <span>已搭载 Gemini 3 Pro 智能模型</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            家庭财富，<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">说句话就能记</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12">
            下一代 AI 家庭理财助手。支持语音秒级识别、信用卡/房贷自动追踪、全家共享账本。
          </p>
          
          <div className="flex flex-col items-center gap-4">
            {!showInput ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={() => setShowInput(true)} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-indigo-200 hover:scale-105 transition-all flex items-center gap-3">
                  免费开始使用 <ArrowRight />
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if(name) onLogin(name); }} className="w-full max-w-sm bg-white p-3 rounded-[2rem] shadow-2xl border border-slate-100 flex gap-2 animate-in zoom-in-95">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="输入您的昵称 (如: 爸爸)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100" autoFocus />
                <button className="bg-indigo-600 text-white px-8 rounded-2xl font-bold shadow-lg">进入</button>
              </form>
            )}
          </div>
        </div>
        
        {/* Decorative elements... */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-200 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
