import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category, User, SavingsGoal, FamilyNote, CreditCardAccount, LoanAccount, Baby } from '../../types';
import { TransactionCard } from '../TransactionCard';
import { 
  Home, Wallet, Plus, ChevronRight, StickyNote, X, Clock, Check, ScanLine, 
  TrendingUp, TrendingDown, PiggyBank, Pencil, Trash2, CreditCard, Landmark, 
  Eye, EyeOff, Baby as BabyIcon 
} from '../Icons';

interface HomeViewProps {
  currentUser: User;
  transactions: Transaction[];
  users: User[];
  monthlyBudget: number;
  familyNotes: FamilyNote[];
  goals: SavingsGoal[];
  creditCards: CreditCardAccount[];
  loans: LoanAccount[];
  babies: Baby[];
  hideAmount: boolean;
  canEdit: boolean;
  onSetHideAmount: (hide: boolean) => void;
  onAddTransaction: () => void;
  onAddNote: () => void;
  onDeleteNote: (note: FamilyNote) => void;
  onQuickPay: (data: any) => void;
  onEditBudget: () => void;
  onOpenModule: (module: string) => void; // 'GOALS', 'DEBT', 'BABY_LIST'
  onAddGoal: () => void;
  onSelectGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goal: SavingsGoal) => void;
  onOpenTransactionDetail: (t: Transaction) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
    currentUser, transactions, users, monthlyBudget, familyNotes, goals,
    creditCards, loans, babies, hideAmount, canEdit,
    onSetHideAmount, onAddTransaction, onAddNote, onDeleteNote, onQuickPay,
    onEditBudget, onOpenModule, onAddGoal, onSelectGoal, onDeleteGoal, onOpenTransactionDetail
}) => {
    
    // --- Helper Functions ---
    const displayAmount = (amount: number) => {
        return hideAmount ? '****' : `¥${amount.toLocaleString()}`;
    };

    // --- Computed State ---
    const isCurrentMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    
    const currentMonthExpense = useMemo(() => 
        transactions
          .filter(t => t.type === TransactionType.EXPENSE && isCurrentMonth(t.date))
          .reduce((acc, t) => acc + t.amount, 0),
    [transactions]);
    
    const currentMonthIncome = useMemo(() => 
        transactions
          .filter(t => t.type === TransactionType.INCOME && isCurrentMonth(t.date))
          .reduce((acc, t) => acc + t.amount, 0),
    [transactions]);

    const remainingBudget = monthlyBudget - currentMonthExpense;
    const budgetHealth = Math.max(0, Math.min(100, (remainingBudget / monthlyBudget) * 100));

    const currentStreak = useMemo(() => {
        const days = new Set(transactions.map(t => t.date.split('T')[0]));
        return days.size;
    }, [transactions]);

    const creditCardDebt = useMemo(() => {
        return transactions
          .filter(t => t.category === Category.CREDIT_CARD || t.cardId)
          .reduce((acc, t) => t.type === TransactionType.DEBT ? acc + t.amount : acc - t.amount, 0);
    }, [transactions]);
    
    const totalBabySpend = useMemo(() => {
        const babyCats = [Category.BABY, Category.EDUCATION, Category.DAILY, Category.TOYS, Category.ALLOWANCE];
        return transactions
          .filter(t => t.babyId || babyCats.includes(t.category as Category))
          .reduce((acc, t) => acc + t.amount, 0);
    }, [transactions]);

    // Enhanced Reminder Logic
    const upcomingRepayments = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();

        const alerts: Array<{ 
            id: string,
            title: string, 
            subTitle: string,
            days: number, 
            amount?: number, 
            type: 'CARD_BILL' | 'CARD_REPAY' | 'LOAN',
            actionData: any
        }> = [];

        const getDaysDiff = (targetDay: number) => {
            let targetDate = new Date(currentYear, currentMonth, targetDay);
            if (targetDay < currentDay) {
                 targetDate = new Date(currentYear, currentMonth + 1, targetDay);
            }
            const diffTime = targetDate.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        };

        creditCards.forEach(card => {
            if (card.billDay) {
                 const diff = getDaysDiff(card.billDay);
                 if (diff >= 0 && diff <= 3) {
                     alerts.push({ 
                         id: `bill_${card.id}`,
                         title: `${card.bankName}出账日`, 
                         subTitle: `尾号${card.last4Digits} · 等待账单更新`,
                         days: diff, 
                         type: 'CARD_BILL',
                         actionData: null 
                     });
                 }
            }
            if (card.repaymentDay && card.balance > 0) {
                 const diff = getDaysDiff(card.repaymentDay);
                 if (diff >= 0 && diff <= 10) { 
                     alerts.push({ 
                         id: `repay_${card.id}`,
                         title: `还款: ${card.bankName}`, 
                         subTitle: `尾号${card.last4Digits} · 剩余应还`,
                         days: diff, 
                         amount: card.balance, 
                         type: 'CARD_REPAY',
                         actionData: {
                             type: TransactionType.REPAYMENT,
                             category: Category.CREDIT_CARD,
                             amount: card.balance.toString(),
                             note: `偿还${card.bankName}信用卡`,
                             cardId: card.id
                         }
                     });
                 }
            }
        });

        loans.forEach(loan => {
            if (loan.interestDay) {
                const diff = getDaysDiff(loan.interestDay);
                if (diff >= 0 && diff <= 7) {
                     alerts.push({ 
                         id: `loan_${loan.id}`,
                         title: `还款: ${loan.name}`, 
                         subTitle: `${loan.bankName} · 本期月供`,
                         days: diff, 
                         amount: loan.monthlyRepayment, 
                         type: 'LOAN',
                         actionData: {
                             type: TransactionType.REPAYMENT,
                             category: loan.category,
                             amount: loan.monthlyRepayment.toString(),
                             note: `偿还${loan.name}`,
                             loanId: loan.id
                         }
                     });
                }
            }
        });

        return alerts.sort((a,b) => a.days - b.days);
    }, [creditCards, loans]);

    return (
        <div className="pb-32 lg:pb-10 relative">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 px-6 md:px-10 py-4 mb-6 flex justify-between items-center transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src={currentUser.avatar} alt="avatar" />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900">早安，{currentUser.name}</h1>
                    <span className="text-xl animate-bounce">
                       {budgetHealth > 50 ? '🥰' : budgetHealth > 20 ? '😬' : '😱'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">连续记账第 {currentStreak} 天</p>
               </div>
            </div>
            
            <div className="flex gap-3">
               <button onClick={() => onSetHideAmount(!hideAmount)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm">
                  {hideAmount ? <EyeOff size={18}/> : <Eye size={18}/>}
               </button>
               {canEdit && (
                   <button onClick={onAddTransaction} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200/50">
                       <Plus size={18}/> <span className="hidden sm:inline">记一笔</span>
                   </button>
               )}
            </div>
        </div>
        
        <div className="px-6 md:px-10 space-y-8">
            
            {/* 1. Family Sticky Notes Widget */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <StickyNote size={14} className="text-yellow-500"/> 家庭便利贴
                     </h3>
                     {canEdit && <button onClick={onAddNote} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100">+ 贴一张</button>}
                 </div>
                 <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar snap-x">
                     {familyNotes.map(note => (
                         <div key={note.id} className={`min-w-[200px] ${note.color} p-4 rounded-2xl shadow-sm relative group snap-start border border-black/5 transform rotate-1 hover:rotate-0 transition-all`}>
                             {(canEdit || note.userId === currentUser.id) && (
                                 <button onClick={() => onDeleteNote(note)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"><X size={14}/></button>
                             )}
                             <div className="flex items-center gap-2 mb-2">
                                 <img src={note.userAvatar} className="w-6 h-6 rounded-full border border-white" />
                                 <span className="text-xs font-bold text-slate-700">{note.userName}</span>
                                 <span className="ml-auto text-lg">{note.emoji}</span>
                             </div>
                             <p className="text-sm font-medium text-slate-800 leading-snug">{note.content}</p>
                             <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(note.createdAt).toLocaleDateString()}</p>
                         </div>
                     ))}
                     {/* Empty State */}
                     {familyNotes.length === 0 && (
                        <div className="min-w-[200px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <StickyNote size={24} className="opacity-20"/>
                            <span className="text-xs font-bold">还没有留言哦</span>
                        </div>
                     )}
                 </div>
            </div>

            {/* 2. Intelligent Reminder Widget */}
            {upcomingRepayments.length > 0 && (
               <div className="animate-in fade-in slide-in-from-top-4">
                   <div className="flex items-center justify-between mb-3 px-1">
                       <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Clock size={14} className="text-indigo-500"/> 待办提醒
                       </h3>
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">{upcomingRepayments.length} 项</span>
                   </div>
                   
                   <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar">
                       {upcomingRepayments.map((alert) => (
                           <div key={alert.id} className={`min-w-[260px] p-4 rounded-2xl border flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md ${
                               alert.type === 'CARD_BILL' ? 'bg-white border-slate-200' : 'bg-white border-red-100'
                           }`}>
                               <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                   alert.days <= 3 ? 'bg-red-500' : 'bg-indigo-500'
                               }`}></div>

                               <div className="pl-3 mb-3">
                                   <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{alert.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{alert.subTitle}</p>
                                        </div>
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                            alert.days === 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {alert.days === 0 ? '今天' : `${alert.days}天后`}
                                        </div>
                                   </div>
                                   
                                   {alert.amount !== undefined && (
                                       <div className="mt-2 text-xl font-bold text-slate-900">
                                           {displayAmount(alert.amount)}
                                       </div>
                                   )}
                               </div>

                               <div className="pl-3">
                                   {alert.actionData && canEdit ? (
                                       <button 
                                            onClick={() => onQuickPay(alert.actionData)}
                                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-95"
                                       >
                                           <Check size={14} /> 立即还款
                                       </button>
                                   ) : (
                                       <button className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold cursor-default border border-slate-100">
                                           {canEdit ? '等待出账' : '仅查看'}
                                       </button>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
            )}

            {/* 3. Gamified Net Asset Card (Health Bar) */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-between group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                             {budgetHealth > 50 ? '😎' : '😰'}
                         </div>
                         <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">家庭预算 HP</p>
                     </div>
                     <div className="opacity-50"><ScanLine size={24}/></div>
                  </div>
                  
                  <div className="mt-6 mb-2">
                      <h2 className="text-4xl font-bold tracking-tight">{displayAmount(remainingBudget)}</h2>
                      
                      <div 
                        onClick={onEditBudget}
                        className={`flex items-center gap-2 mt-1 w-fit rounded-lg px-2 -ml-2 py-1 transition-all ${canEdit ? 'hover:bg-white/10 cursor-pointer group/edit' : ''}`}
                      >
                          <p className="text-xs text-indigo-200">本月剩余预算 (月额度 {displayAmount(monthlyBudget)})</p>
                          {canEdit && (
                              <Pencil size={12} className="text-indigo-300 opacity-50 group-hover/edit:opacity-100 group-hover/edit:text-white transition-all" />
                          )}
                      </div>
                  </div>

                  {/* Health Bar */}
                  <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden border border-white/10 mt-2 relative">
                       <div 
                          className={`h-full transition-all duration-1000 ${
                              budgetHealth > 50 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 
                              budgetHealth > 20 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
                          }`} 
                          style={{ width: `${budgetHealth}%` }}
                       ></div>
                       <span className="absolute top-0 left-2 text-[10px] font-bold leading-4 text-white drop-shadow-md">HP: {budgetHealth.toFixed(0)}%</span>
                  </div>
                  
                  <div className="mt-8 flex gap-12">
                      <div>
                         <p className="text-indigo-200 text-[10px] font-bold mb-1">本月收入</p>
                         <p className="font-bold text-lg flex items-center gap-1"><TrendingUp size={14}/> {displayAmount(currentMonthIncome)}</p>
                      </div>
                      <div>
                         <p className="text-indigo-200 text-[10px] font-bold mb-1">本月支出</p>
                         <p className="font-bold text-lg flex items-center gap-1"><TrendingDown size={14}/> {displayAmount(currentMonthExpense)}</p>
                      </div>
                  </div>
                </div>
                {/* Decorative Background */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500 rounded-full blur-[60px] opacity-40"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500 rounded-full blur-[60px] opacity-40"></div>
            </div>

            {/* Goals Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 onClick={() => onOpenModule('GOALS')} className="font-bold text-lg text-slate-800 flex items-center gap-2 cursor-pointer group hover:text-indigo-600 transition-colors">
                        我的心愿 <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                    </h3>
                    {canEdit && <button onClick={onAddGoal} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                        + 添加
                    </button>}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar snap-x">
                    {goals.map(goal => {
                        const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        return (
                            <div key={goal.id} onClick={() => { if(canEdit) { onSelectGoal(goal); } }} className="min-w-[160px] w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-shrink-0 snap-start relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                                {canEdit && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onDeleteGoal(goal);
                                        }} 
                                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-20 shadow-sm"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${goal.color} opacity-10 rounded-bl-full -mr-2 -mt-2`}></div>
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl mb-3">{goal.icon}</div>
                                <h4 className="font-bold text-slate-800 text-sm truncate">{goal.name}</h4>
                                <div className="mt-2">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                                        <span>{percent.toFixed(0)}%</span>
                                        <span>{displayAmount(goal.targetAmount)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${goal.color}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 mt-2">{displayAmount(goal.currentAmount)}</p>
                                </div>
                            </div>
                        )
                    })}
                    {/* Add Goal Placeholder */}
                    {canEdit && (
                        <div onClick={onAddGoal} className="min-w-[100px] bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                            <Plus size={24} />
                            <span className="text-xs font-bold">新目标</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Debt & Baby Section - Detailed Split View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unified Debt Card */}
                <div onClick={() => onOpenModule('DEBT')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex -space-x-2">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border-2 border-white z-10"><CreditCard size={20}/></div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border-2 border-white"><Landmark size={20}/></div>
                        </div>
                        <div className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 group-hover:bg-slate-200 transition-colors">{creditCards.length + loans.length} 个账户</div>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase">负债总览</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{displayAmount(creditCardDebt + loans.reduce((a,l)=>a+l.balance,0))}</h3>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                       <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 卡片
                       <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span> 贷款
                    </p>
                </div>

                {/* Baby Spend */}
                <div onClick={() => onOpenModule('BABY_LIST')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                         <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center"><BabyIcon size={20}/></div>
                         <div className="flex -space-x-2">
                            {babies.map(b => (
                                <div key={b.id} className="w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-[10px]">{b.avatar}</div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-4">宝宝成长基金</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{displayAmount(totalBabySpend)}</h3>
                        <p className="text-xs text-pink-500 mt-2 font-bold flex items-center gap-1"><TrendingUp size={12}/> 本月支出</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-xl">最近账单</h3><button className="text-xs text-indigo-600 font-bold">查看全部</button></div>
                {transactions.slice(0, 5).map(t => <TransactionCard key={t.id} transaction={t} user={users.find(u => u.id === t.userId)} onClick={onOpenTransactionDetail} hideAmount={hideAmount} />)}
            </div>
        </div>
      </div>
    );
};