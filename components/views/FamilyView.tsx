import React from 'react';
import { User, Baby } from '../../types';
import { Settings, Wallet, Baby as BabyIcon, Target, CreditCard, X, ShieldCheck, Share2, Pencil, Trash2 } from '../Icons';

interface FamilyViewProps {
  users: User[];
  currentUser: User;
  babies: Baby[];
  sharingSettings: { enabled: boolean; modules: any };
  isFamilyAdmin: boolean;
  onOpenSettings: () => void;
  onOpenInvite: () => void;
  onTogglePermission: (userId: string) => void;
  onDeleteMember: (user: User) => void;
  onAddBaby: () => void;
  onEditBaby: (e: React.MouseEvent, baby: Baby) => void;
  onDeleteBaby: (baby: Baby) => void;
}

export const FamilyView: React.FC<FamilyViewProps> = ({ 
    users, currentUser, babies, sharingSettings, isFamilyAdmin,
    onOpenSettings, onOpenInvite, onTogglePermission, onDeleteMember,
    onAddBaby, onEditBaby, onDeleteBaby
}) => {
    
    // Helper
    const getAge = (dateString?: string) => {
        if (!dateString) return '未设置生日';
        const today = new Date();
        const birthDate = new Date(dateString);
        if (isNaN(birthDate.getTime())) return '日期无效';
        
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        if (today.getDate() < birthDate.getDate()) months--;
        
        if (months < 0) return '即将出生';
        if (months < 12) return `${months}个月`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return `${years}岁${remainingMonths > 0 ? remainingMonths + '个月' : ''}`;
    };

    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-32">
         <div className="flex justify-between items-center">
             <div>
                <h2 className="text-3xl font-bold text-slate-800">家庭空间</h2>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    {sharingSettings.enabled ? (
                        <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 共享已开启</>
                    ) : (
                        <><span className="w-2 h-2 rounded-full bg-slate-300"></span> 共享已暂停</>
                    )}
                </p>
             </div>
             {isFamilyAdmin && (
                 <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95"
                >
                    <Settings size={18} /> <span className="hidden sm:inline">共享设置</span>
                </button>
             )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 text-lg">家庭成员</h3>
                     {isFamilyAdmin && <button onClick={onOpenInvite} className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">添加成员 +</button>}
                 </div>
                 <div className="space-y-3">
                    {users.map((u) => {
                        const isCurrentUser = u.id === currentUser.id;
                        const canManage = isFamilyAdmin && !isCurrentUser;
                        const roleLabel = u.isFamilyAdmin ? '管理员' : (u.permissions?.canEdit ? '编辑者' : '观察员');
                        const roleColor = u.isFamilyAdmin ? 'bg-indigo-100 text-indigo-600' : (u.permissions?.canEdit ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500');

                        return (
                            <div key={u.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${isCurrentUser ? 'bg-indigo-50/50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                                <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold ${isCurrentUser ? 'text-indigo-900' : 'text-slate-800'}`}>{u.name}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${roleColor}`}>{roleLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-slate-400 font-medium">{isCurrentUser ? '当前登录' : (u.permissions?.canEdit ? '可编辑账本' : '仅查看权限')}</p>
                                        {canManage && (
                                            <button 
                                                onClick={() => onTogglePermission(u.id)}
                                                className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                                            >
                                                {u.permissions?.canEdit ? '设为只读' : '允许编辑'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isFamilyAdmin && !isCurrentUser && (
                                    <button onClick={() => onDeleteMember(u)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16} /></button>
                                )}
                            </div>
                        )
                    })}
                 </div>
             </div>
             
             {/* Baby Section (With Edit) */}
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 text-lg">宝宝档案</h3>
                     {isFamilyAdmin && <button onClick={onAddBaby} className="text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-pink-100 transition-colors">添加宝宝 +</button>}
                 </div>
                 <div className="space-y-3">
                    {babies.map((b) => (
                        <div key={b.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group relative">
                            {/* Actions on Hover */}
                            {isFamilyAdmin && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => onEditBaby(e, b)}
                                        className="p-1.5 bg-white shadow-sm border border-slate-100 text-indigo-500 rounded-full hover:bg-indigo-50"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteBaby(b); }}
                                        className="p-1.5 bg-white shadow-sm border border-slate-100 text-red-500 rounded-full hover:bg-red-50"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}

                            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">
                                {b.avatar}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800">{b.name}</p>
                                    <span className="text-[10px] bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded font-bold">
                                        {getAge(b.birthDate)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{b.birthDate || '未设置生日'}</p>
                            </div>
                        </div>
                    ))}
                    {babies.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <BabyIcon size={32} className="opacity-20" />
                            </div>
                            <p className="text-xs">还没有添加宝宝信息</p>
                        </div>
                    )}
                 </div>
             </div>
         </div>
      </div>
    );
}