import React, { useState } from 'react';
import { 
  Wallet, 
  Mic, 
  Users, 
  PieChart, 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  ShieldCheck,
  CheckCircle2
} from './Icons';

interface Props {
  onLogin: (name: string) => void;
}

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Wallet size={20} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">每日记</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowInput(true)}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              创建账户
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles size={14} />
            <span>搭载 DeepSeek 智能语音引擎</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6">
            让家庭记账 <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">动动嘴 就能记</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8">
            告别繁琐的手动输入。按住说话，AI 自动识别金额、分类、备注。支持微信支付、支付宝账单语音录入，全家共享，让每一笔开支都清晰可见。
          </p>
          
          <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-10">
            {!showInput ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button 
                    onClick={() => setShowInput(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                    开启记账之旅 <ArrowRight size={20} />
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <Smartphone size={20} /> 小程序版
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 flex gap-2 animate-in zoom-in-95 duration-300">
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="输入您的昵称 (例如: 爸爸)" 
                        className="flex-1 px-4 py-3 bg-slate-50 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        autoFocus
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 whitespace-nowrap">
                        立即开启
                    </button>
                </form>
            )}
          </div>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200 rounded-full blur-3xl opacity-30 mix-blend-multiply animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-200 rounded-full blur-3xl opacity-30 mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-200 rounded-full blur-3xl opacity-30 mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">更懂中国家庭的记账软件</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">不仅仅是记账，更是您的家庭财富管家。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Mic className="text-white" size={24} />}
              color="bg-indigo-500"
              title="AI 语音秒记"
              description="支持中文口语识别。'昨天买菜花了30，还了老李200'，一句话搞定复杂记账。"
            />
            <FeatureCard 
              icon={<Users className="text-white" size={24} />}
              color="bg-pink-500"
              title="全家账本共享"
              description="一人记账，全家可见。专属宝宝账本，清晰记录奶粉、尿不湿、教育金等成长开销。"
            />
            <FeatureCard 
              icon={<PieChart className="text-white" size={24} />}
              color="bg-emerald-500"
              title="资产趋势分析"
              description="多维度收支报表，人情往来、房贷车贷一目了然。AI 顾问提供专业省钱建议。"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-slate-800">
                  <Wallet size={24} />
                  <span className="font-bold text-xl tracking-tight">每日记</span>
              </div>
              <div className="flex gap-8 text-sm font-bold text-slate-400">
                  <a href="#" className="hover:text-indigo-600">关于我们</a>
                  <a href="#" className="hover:text-indigo-600">隐私政策</a>
                  <a href="#" className="hover:text-indigo-600">联系客服</a>
              </div>
              <p className="text-xs text-slate-400">© 2024 每日记. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, color, title, description }: { icon: React.ReactNode, color: string, title: string, description: string }) => (
  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="font-bold text-xl text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
  </div>
);