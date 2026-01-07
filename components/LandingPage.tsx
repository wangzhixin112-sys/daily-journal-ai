
import React, { useState, useEffect } from 'react';
import { Wallet, Sparkles, ArrowRight, Smartphone, MessageSquare } from './Icons';
import { api } from '../services/api';

interface Props { onLogin: (user: any) => void; }

// Inline WeChat Icon for specific branding color
const WeChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.9994 13.9168C8.93297 13.9168 8.86877 13.9213 8.80789 13.9298C9.56309 15.0039 10.9701 15.7497 12.636 15.7497C12.9238 15.7497 13.2033 15.7275 13.4735 15.6853C13.8296 16.5915 14.9351 17.2796 16.2731 17.2796C16.5161 17.2796 16.7513 17.2536 16.9765 17.2046L17.7951 17.659C17.9103 17.7229 18.0519 17.7225 18.1667 17.6579C18.2815 17.5932 18.3514 17.4746 18.3503 17.3429V16.6338C18.8951 16.1834 19.2731 15.5348 19.2731 14.8055C19.2731 13.3377 17.9299 12.1477 16.2731 12.1477C14.6163 12.1477 13.2731 13.3377 13.2731 14.8055C13.2731 15.1186 13.3425 15.4172 13.4697 15.6934C13.1979 15.6318 12.9197 15.5997 12.636 15.5997C9.91428 15.5997 7.70825 13.7865 7.70825 11.55C7.70825 9.31352 9.91428 7.50024 12.636 7.50024C15.3577 7.50024 17.5637 9.31352 17.5637 11.55C17.5637 11.6915 17.556 11.831 17.541 11.9681C18.2801 11.6669 18.7916 10.9429 18.7916 10.125C18.7916 7.58555 16.0355 5.52734 12.636 5.52734C9.23651 5.52734 6.48047 7.58555 6.48047 10.125C6.48047 11.3789 7.15582 12.5152 8.21909 13.3087V14.391C8.22019 14.5209 8.15286 14.638 8.04077 14.7042C7.92868 14.7705 7.78912 14.7758 7.67252 14.7183L6.8042 14.2852C6.27503 14.5123 5.68884 14.6401 5.07135 14.6401C4.84755 14.6401 4.62772 14.6291 4.41295 14.6079C4.66827 15.8202 5.92243 16.7497 7.41113 16.7497C8.16781 16.7497 8.86801 16.5135 9.42663 16.1159V15.6593C9.42774 15.5283 9.35889 15.4102 9.24522 15.3452C9.13155 15.2803 8.99158 15.2789 8.87687 15.3418L8.14022 15.7461C7.79471 15.5487 7.48529 15.3039 7.22737 15.0232C8.28972 14.3642 8.9994 13.1932 8.9994 11.875C8.9994 13.003 8.9994 13.9168 8.9994 13.9168Z" fill="currentColor"/>
  </svg>
);

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  const [showInput, setShowInput] = useState(false);
  const [method, setMethod] = useState<'WECHAT' | 'PHONE'>('WECHAT');
  const [isLoading, setIsLoading] = useState(false);
  
  // Phone Login State
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
      let timer: any;
      if (countdown > 0) {
          timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      }
      return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = () => {
      if (!phone || phone.length !== 11) {
          alert("请输入正确的11位手机号");
          return;
      }
      setCountdown(60);
      alert(`验证码已发送至 ${phone} (测试码: 8888)`);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phone || !code) return;
      setIsLoading(true);
      // Simulate Phone Login via API wrapper (mocked in api.ts)
      const user = await api.loginWeChat("MOCK_PHONE_CODE", { nickName: `用户${phone.slice(-4)}` });
      onLogin(user);
      setIsLoading(false);
  };

  const handleWeChatLogin = async () => {
      setIsLoading(true);
      // In real Mini Program, this uses wx.login() -> get code -> api.loginWeChat(code)
      const user = await api.loginWeChat("MOCK_WX_CODE", { nickName: "微信用户", avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix" });
      onLogin(user);
      setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 w-full flex flex-col overflow-x-hidden">
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600"><div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Wallet size={20} fill="currentColor" /></div><span className="font-bold text-lg tracking-tight text-slate-900">每日记</span></div>
        {!showInput && (
            <button onClick={() => setShowInput(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg">登录 / 注册</button>
        )}
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 relative">
        <div className="max-w-4xl w-full text-center z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold mb-8 animate-bounce">
            <Sparkles size={14} /> <span>已搭载 Gemini 3 Pro 智能模型</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            家庭财富，<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">说句话就能记</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12">
            下一代 AI 家庭理财助手。支持语音秒级识别、信用卡/房贷自动追踪、全家共享账本。
          </p>
          
          <div className="w-full flex justify-center">
            {!showInput ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={() => setShowInput(true)} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-indigo-200 hover:scale-105 transition-all flex items-center gap-3">
                  免费开始使用 <ArrowRight />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 animate-in zoom-in-95">
                  {/* Tabs */}
                  <div className="flex mb-6 p-1 bg-slate-50 rounded-xl">
                      <button 
                        onClick={() => setMethod('WECHAT')} 
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${method === 'WECHAT' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}
                      >
                          <WeChatIcon /> 微信登录
                      </button>
                      <button 
                        onClick={() => setMethod('PHONE')} 
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${method === 'PHONE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                      >
                          <Smartphone size={18} /> 手机号
                      </button>
                  </div>

                  {method === 'WECHAT' && (
                      <div className="text-center py-4 space-y-6 animate-in fade-in slide-in-from-right-4">
                          <button 
                             onClick={handleWeChatLogin} 
                             disabled={isLoading}
                             className="w-full bg-[#07C160] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-[#06ad56] disabled:opacity-70"
                          >
                             {isLoading ? '登录中...' : <><WeChatIcon /> 一键授权登录</>}
                          </button>
                          <p className="text-xs text-slate-400">
                             点击即代表同意 <a href="#" className="text-slate-600 font-bold">用户协议</a> 和 <a href="#" className="text-slate-600 font-bold">隐私政策</a>
                             <br/>未注册微信将自动关联创建账户
                          </p>
                      </div>
                  )}

                  {method === 'PHONE' && (
                      <form onSubmit={handlePhoneLogin} className="space-y-4 animate-in fade-in slide-in-from-left-4">
                          <div className="relative">
                              <span className="absolute left-4 top-4 text-slate-400 font-bold border-r border-slate-200 pr-3">+86</span>
                              <input 
                                  type="tel" 
                                  value={phone} 
                                  onChange={e => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      if (val.length <= 11) setPhone(val);
                                  }} 
                                  placeholder="请输入手机号" 
                                  className="w-full bg-slate-50 pl-20 pr-4 py-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:border-indigo-100" 
                              />
                          </div>
                          <div className="flex gap-3">
                              <div className="relative flex-1">
                                  <input 
                                      type="number" 
                                      value={code} 
                                      onChange={e => setCode(e.target.value.slice(0,6))} 
                                      placeholder="验证码" 
                                      className="w-full bg-slate-50 px-4 py-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:border-indigo-100" 
                                  />
                                  <MessageSquare size={16} className="absolute right-4 top-4.5 text-slate-300" />
                              </div>
                              <button 
                                  type="button" 
                                  disabled={countdown > 0 || phone.length !== 11}
                                  onClick={handleSendCode}
                                  className="w-28 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400"
                              >
                                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                              </button>
                          </div>
                          <button disabled={!phone || !code || isLoading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700">
                              {isLoading ? '登录中...' : '登录 / 注册'}
                          </button>
                          <p className="text-xs text-slate-400 text-center">
                             登录即代表同意 <a href="#" className="text-slate-600 font-bold">用户协议</a> 和 <a href="#" className="text-slate-600 font-bold">隐私政策</a>
                          </p>
                      </form>
                  )}
              </div>
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
