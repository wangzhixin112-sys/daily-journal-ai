import React, { useState } from 'react';
import { User } from '../../types';
import { Users, Wallet, ChevronRight, Calculator, Zap, Settings, X, Globe, Key } from '../Icons';

interface ProfileViewProps {
    currentUser: User;
    users: User[];
    monthlyBudget: number;
    isFamilyAdmin: boolean;
    canEdit: boolean;
    onSwitchUser: (user: User) => void;
    onOpenModule: (module: string) => void;
    onEditBudget: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    currentUser, users, monthlyBudget, isFamilyAdmin, canEdit,
    onSwitchUser, onOpenModule, onEditBudget
}) => {
    const [showDevSettings, setShowDevSettings] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gf_user_api_key') || '');
    const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem('gf_user_base_url') || '');

    const handleSaveDevSettings = () => {
        if (apiKey.trim()) localStorage.setItem('gf_user_api_key', apiKey.trim());
        else localStorage.removeItem('gf_user_api_key');

        if (proxyUrl.trim()) localStorage.setItem('gf_user_base_url', proxyUrl.trim());
        else localStorage.removeItem('gf_user_base_url');

        setShowDevSettings(false);
        alert("网络设置已保存，下次 AI 请求将生效。");
    };

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-10">
            <div className="flex items-center gap-6">
              <img src={currentUser.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-xl" />
              <div>
                <h2 className="text-3xl font-bold">{currentUser.name} {currentUser.isPremium && "👑"}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-sm">{isFamilyAdmin ? "家庭管理员" : "家庭成员"}</span>
                    {!canEdit && <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md font-bold">仅查看</span>}
                </div>
              </div>
            </div>
            
            {/* User Switcher Demo */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="font-bold text-slate-600 mb-4 text-sm flex items-center gap-2"><Users size={16}/> 切换账号 (模拟多用户)</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {users.map(u => (
                        <button key={u.id} onClick={() => onSwitchUser(u)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[80px] border transition-all ${currentUser.id === u.id ? 'bg-white border-indigo-500 shadow-md scale-105' : 'bg-white border-slate-200 opacity-60 hover:opacity-100'}`}>
                            <div className="relative">
                                <img src={u.avatar} className="w-10 h-10 rounded-full"/>
                                {u.isFamilyAdmin && <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-[8px] text-white px-1 rounded">Admin</div>}
                            </div>
                            <span className="text-xs font-bold truncate max-w-full">{u.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => onOpenModule('ASSETS')} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-all group">
                <span className="font-bold flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Wallet size={20}/></div> 我的钱包 (卡片/贷款)</span>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onEditBudget} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-all group">
                <span className="font-bold flex items-center gap-3"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Calculator size={20}/></div> 家庭预算设置</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">¥{monthlyBudget.toLocaleString()}</span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
              <button onClick={() => onOpenModule('PAYMENT')} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-all group">
                <span className="font-bold flex items-center gap-3"><div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Zap size={20}/></div> 会员权益中心</span>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Developer Settings Button */}
              <button onClick={() => setShowDevSettings(true)} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-all group mt-2">
                <span className="font-bold flex items-center gap-3"><div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><Settings size={20}/></div> 网络设置 (测试版专用)</span>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Config Modal */}
            {showDevSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">AI 网络配置</h3>
                            <button onClick={() => setShowDevSettings(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={18}/></button>
                        </div>
                        
                        <div className="space-y-4">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 mb-2 block flex items-center gap-1"><Key size={12}/> Gemini API Key</label>
                                 <input 
                                    type="password" 
                                    value={apiKey} 
                                    onChange={e => setApiKey(e.target.value)} 
                                    placeholder="输入您的 API Key" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-mono"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 mb-2 block flex items-center gap-1"><Globe size={12}/> Proxy Base URL (国内必填)</label>
                                 <input 
                                    type="text" 
                                    value={proxyUrl} 
                                    onChange={e => setProxyUrl(e.target.value)} 
                                    placeholder="例如: https://my-proxy.worker.dev" 
                                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-mono"
                                 />
                                 <p className="text-[10px] text-slate-400 mt-1">留空则使用默认 Google 官方地址 (需魔法上网)</p>
                             </div>

                             <button 
                                onClick={handleSaveDevSettings} 
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg mt-2 active:scale-95 transition-all"
                             >
                                 保存配置
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};