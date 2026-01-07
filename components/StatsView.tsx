import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  ComposedChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Loader2,
  BarChart3,
  PieChart as PieIcon,
  CreditCard,
  Target,
  ArrowRight
} from './Icons';
import { getFinancialAdvice } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

type ViewMode = 'MONTH' | 'YEAR';
type VisualMode = 'CHARTS' | 'CALENDAR';

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs">
        <p className="font-bold mb-2 text-slate-300">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="opacity-80">{entry.name}:</span>
            <span className="font-mono font-bold">¥{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Calendar Sub-Component ---
const CalendarGrid = ({ currentDate, transactions }: { currentDate: Date, transactions: Transaction[] }) => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
    
    // Adjust for Monday start (China standard)
    // Sunday (0) becomes 6, Monday (1) becomes 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    for (let i = 0; i < startOffset; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getDailyTotal = (day: number) => {
        const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Simple check: same year, month, date
        const dailyTxs = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });
        
        const expense = dailyTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((a,b) => a + b.amount, 0);
        const income = dailyTxs.filter(t => t.type === TransactionType.INCOME).reduce((a,b) => a + b.amount, 0);
        
        return { expense, income, count: dailyTxs.length };
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                    <div key={d} className="text-xs text-slate-400 font-bold py-2">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    
                    const { expense, income, count } = getDailyTotal(day);
                    const hasActivity = count > 0;
                    
                    return (
                        <div key={day} className={`aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center relative ${hasActivity ? 'bg-slate-50 border-slate-200' : 'bg-white border-transparent'}`}>
                            <span className={`text-xs font-bold mb-1 ${hasActivity ? 'text-slate-800' : 'text-slate-300'}`}>{day}</span>
                            {hasActivity && (
                                <div className="flex flex-col items-center">
                                    {expense > 0 && <span className="text-[10px] text-slate-500 font-medium">-{(expense > 1000 ? (expense/1000).toFixed(1) + 'k' : expense.toFixed(0))}</span>}
                                    {income > 0 && <span className="text-[10px] text-emerald-500 font-medium">+{(income > 1000 ? (income/1000).toFixed(1) + 'k' : income.toFixed(0))}</span>}
                                </div>
                            )}
                            {!hasActivity && <div className="w-1 h-1 rounded-full bg-slate-100"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export const StatsView: React.FC<Props> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [visualMode, setVisualMode] = useState<VisualMode>('CHARTS');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // AI Advice State
  const [advice, setAdvice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Helpers for Date Manipulation ---
  
  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
    setAdvice(null); // Clear advice when date changes
  };

  const isSamePeriod = (dateStr: string, targetDate: Date, mode: ViewMode) => {
    const d = new Date(dateStr);
    if (mode === 'MONTH') {
      return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
    }
    return d.getFullYear() === targetDate.getFullYear();
  };

  const getPreviousPeriodDate = (date: Date, mode: ViewMode) => {
    const d = new Date(date);
    if (mode === 'MONTH') d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    return d;
  };

  const formatDateLabel = (date: Date, mode: ViewMode) => {
    if (mode === 'MONTH') {
      return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
    }
    return `${date.getFullYear()}年`;
  };

  // --- Data Calculation ---

  const { currentStats, prevStats, chartData, trendData } = useMemo(() => {
    const prevDate = getPreviousPeriodDate(currentDate, viewMode);
    
    // Filter transactions
    const currentTx = transactions.filter(t => isSamePeriod(t.date, currentDate, viewMode));
    const prevTx = transactions.filter(t => isSamePeriod(t.date, prevDate, viewMode));

    // Calculate Totals (Expense, Income, Debt)
    const calcTotal = (txs: Transaction[]) => {
        return {
            expense: txs.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0),
            income: txs.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0),
            debt: txs.filter(t => t.type === TransactionType.DEBT).reduce((a, b) => a + b.amount, 0)
        };
    };

    const currentTotal = calcTotal(currentTx);
    const prevTotal = calcTotal(prevTx);

    // Pie Chart Data (Expense Category Distribution)
    const categoryMap = new Map<string, number>();
    currentTx.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
       categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });
    
    const pieData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Trend Chart Data (Income, Expense, Debt)
    let barData = [];
    if (viewMode === 'MONTH') {
        // Daily breakdown
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayTxs = currentTx.filter(t => new Date(t.date).getDate() === i);
            barData.push({ 
                name: `${i}`, 
                expense: dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0),
                income: dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0),
                debt: dayTxs.filter(t => t.type === TransactionType.DEBT).reduce((a, b) => a + b.amount, 0),
            });
        }
    } else {
        // Monthly breakdown
        for (let i = 0; i < 12; i++) {
            const monthTxs = currentTx.filter(t => new Date(t.date).getMonth() === i);
            barData.push({ 
                name: `${i+1}月`, 
                expense: monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0),
                income: monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0),
                debt: monthTxs.filter(t => t.type === TransactionType.DEBT).reduce((a, b) => a + b.amount, 0),
            });
        }
    }

    return {
        currentStats: currentTotal,
        prevStats: prevTotal,
        chartData: pieData,
        trendData: barData
    };
  }, [transactions, currentDate, viewMode]);

  // Comparison Logic helpers
  const getDiff = (current: number, prev: number) => {
      const diff = current - prev;
      const percent = prev > 0 ? (diff / prev) * 100 : 0;
      return { diff, percent };
  };

  const expenseDiff = getDiff(currentStats.expense, prevStats.expense);
  const incomeDiff = getDiff(currentStats.income, prevStats.income);
  const debtDiff = getDiff(currentStats.debt, prevStats.debt);

  // --- AI Handler ---

  const handleGetAdvice = async () => {
    setIsAnalyzing(true);
    const periodStr = viewMode === 'MONTH' ? '本月' : '今年';
    const prevPeriodStr = viewMode === 'MONTH' ? '上月' : '去年';
    
    // Construct Top Categories string
    const topCategories = chartData.slice(0, 3).map(c => `${c.name}(¥${c.value})`).join(', ');

    const summaryPrompt = `
      我正在进行家庭财务分析。
      时间范围: ${formatDateLabel(currentDate, viewMode)}。
      
      【收支概况】
      1. 总支出: ¥${currentStats.expense.toFixed(0)}。对比${prevPeriodStr}: ${expenseDiff.diff > 0 ? '增加了' : '减少了'} ¥${Math.abs(expenseDiff.diff).toFixed(0)}。
      2. 总收入: ¥${currentStats.income.toFixed(0)}。对比${prevPeriodStr}: ${incomeDiff.diff > 0 ? '增加了' : '减少了'} ¥${Math.abs(incomeDiff.diff).toFixed(0)}。
      3. 新增负债: ¥${currentStats.debt.toFixed(0)}。对比${prevPeriodStr}: ${debtDiff.diff > 0 ? '增加了' : '减少了'} ¥${Math.abs(debtDiff.diff).toFixed(0)}。
      
      【支出构成】
      前三名支出: ${topCategories || '无数据'}。
      
      【分析要求】
      请根据以上数据进行多维度分析：
      1. **收支平衡**：评价我的储蓄能力。
      2. **趋势预警**：如果本期支出大于上期，请特别指出并提醒节约；如果负债增加，请提醒控制债务。
      3. **具体建议**：给出2条简短、可执行的理财或省钱建议。
      
      请用亲切、专业的口吻回答。
    `;

    try {
        const result = await getFinancialAdvice(summaryPrompt);
        setAdvice(result);
    } catch (e) {
        setAdvice("AI 暂时无法连接，请稍后再试。");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const netSavings = currentStats.income - currentStats.expense;
  const savingsRate = currentStats.income > 0 ? (netSavings / currentStats.income) * 100 : 0;

  return (
    <div className="pb-32 lg:pb-10 relative">
       {/* Sticky Header - Matched HomeView style */}
       <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 px-6 md:px-10 py-4 mb-6 transition-all">
          <div className="max-w-7xl mx-auto w-full">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 {/* Mode Toggle */}
                 <div className="bg-slate-100 p-1 rounded-2xl flex font-bold text-xs relative shadow-inner">
                      <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out ${viewMode === 'YEAR' ? 'translate-x-[100%] translate-x-2' : 'translate-x-0'}`} style={{ left: viewMode === 'YEAR' ? '2px' : '4px' }}></div>
                      <button onClick={() => { setViewMode('MONTH'); setVisualMode('CHARTS'); }} className={`px-8 py-2 rounded-xl z-10 transition-colors duration-300 ${viewMode === 'MONTH' ? 'text-slate-800' : 'text-slate-400'}`}>按月</button>
                      <button onClick={() => { setViewMode('YEAR'); setVisualMode('CHARTS'); }} className={`px-8 py-2 rounded-xl z-10 transition-colors duration-300 ${viewMode === 'YEAR' ? 'text-slate-800' : 'text-slate-400'}`}>按年</button>
                  </div>

                  {/* Date Navigator */}
                  <div className="flex items-center gap-6">
                      <button onClick={() => navigateDate(-1)} className="p-2.5 bg-white border border-slate-100 rounded-full hover:bg-slate-50 text-slate-500 shadow-sm active:scale-95 transition-all">
                          <ChevronLeft size={18} />
                      </button>
                      <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 w-32">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{viewMode === 'MONTH' ? 'Current Period' : 'Yearly View'}</span>
                          <div className="flex items-center gap-2 font-bold text-xl text-slate-800 whitespace-nowrap">
                              {formatDateLabel(currentDate, viewMode)}
                          </div>
                      </div>
                      <button onClick={() => navigateDate(1)} className="p-2.5 bg-white border border-slate-100 rounded-full hover:bg-slate-50 text-slate-500 shadow-sm active:scale-95 transition-all">
                          <ChevronRight size={18} />
                      </button>
                  </div>
              </div>
          </div>
       </div>

       {/* Natural Content Flow (Removed h-full & overflow-y-auto) */}
       <div className="px-6 md:px-10 space-y-6 max-w-7xl mx-auto w-full">
           
           {/* Visual Mode Switcher (Charts vs Calendar) - Only show in Month view */}
           {viewMode === 'MONTH' && (
               <div className="flex justify-center">
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                       <button onClick={() => setVisualMode('CHARTS')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${visualMode === 'CHARTS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}><BarChart3 size={16} /></button>
                       <button onClick={() => setVisualMode('CALENDAR')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${visualMode === 'CALENDAR' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}><CalendarDays size={16} /></button>
                   </div>
               </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Net Surplus Card */}
               <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-300 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-4">
                           <div>
                               <p className="text-slate-400 text-xs font-bold mb-1">本期结余 (收入 - 支出)</p>
                               <h2 className="text-4xl font-bold tracking-tight">
                                   {netSavings >= 0 ? '+' : ''}¥{netSavings.toLocaleString()}
                               </h2>
                           </div>
                           <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                               <Target size={24} className="text-emerald-400" />
                           </div>
                       </div>
                       
                       <div className="mb-2">
                           <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                               <span>收支比</span>
                               <span>{Math.min(Math.max((currentStats.expense / (currentStats.income || 1)) * 100, 0), 100).toFixed(0)}%</span>
                           </div>
                           <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/5">
                               <div 
                                  className={`h-full rounded-full transition-all duration-1000 ease-out ${netSavings >= 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} 
                                  style={{width: `${currentStats.income > 0 ? Math.min((currentStats.expense / currentStats.income) * 100, 100) : 0}%`}}
                               ></div>
                           </div>
                       </div>
                       
                       <p className="text-xs text-slate-400 mt-3 font-medium">
                           {netSavings > 0 
                             ? `太棒了！您存下了 ${(savingsRate).toFixed(1)}% 的收入。` 
                             : "本期支出超标，请注意控制预算。"}
                       </p>
                   </div>
               </div>

               {/* Metrics Grid */}
               <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                       <div className="flex items-center gap-2 mb-3"><div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><TrendingUp size={16} /></div><span className="text-xs font-bold text-slate-500">总收入</span></div>
                       <div><h3 className="text-xl font-bold text-slate-800">¥{currentStats.income.toLocaleString()}</h3><div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${incomeDiff.diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{incomeDiff.diff >= 0 ? '+' : ''}{incomeDiff.percent.toFixed(0)}% <span className="text-slate-300 font-normal">vs 上期</span></div></div>
                   </div>
                   <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
                       <div className="flex items-center gap-2 mb-3"><div className="p-2 bg-red-100 text-red-500 rounded-full"><TrendingDown size={16} /></div><span className="text-xs font-bold text-slate-500">总支出</span></div>
                       <div><h3 className="text-xl font-bold text-slate-800">¥{currentStats.expense.toLocaleString()}</h3><div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${expenseDiff.diff <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{expenseDiff.diff > 0 ? '+' : ''}{expenseDiff.percent.toFixed(0)}% <span className="text-slate-300 font-normal">vs 上期</span></div></div>
                   </div>
                   <div className="col-span-2 bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><CreditCard size={20} /></div><div><p className="text-xs font-bold text-slate-400">本期新增负债</p><h3 className="text-2xl font-bold text-slate-800">¥{currentStats.debt.toLocaleString()}</h3></div></div>
                       <div className="text-right"><p className={`text-xs font-bold ${debtDiff.diff <= 0 ? 'text-emerald-500' : 'text-purple-500'}`}>{debtDiff.diff > 0 ? '增加' : '减少'} ¥{Math.abs(debtDiff.diff).toLocaleString()}</p></div>
                   </div>
               </div>
           </div>
           
           {/* Visual Content (Charts or Calendar) */}
           {viewMode === 'MONTH' && visualMode === 'CALENDAR' ? (
               <CalendarGrid currentDate={currentDate} transactions={transactions} />
           ) : (
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {/* Trend Chart */}
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                     <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><BarChart3 size={20} /></div>
                             <div>
                                 <h3 className="font-bold text-slate-800">收支趋势</h3>
                                 <p className="text-xs text-slate-400 font-medium">每日流水分析</p>
                             </div>
                         </div>
                     </div>
                     <div className="h-[220px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={viewMode === 'MONTH' ? 4 : 0} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(value) => `${value/1000}k`} />
                              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
                              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                          </ComposedChart>
                       </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Category Chart */}
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                     <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><PieIcon size={20} /></div>
                         <div>
                             <h3 className="font-bold text-slate-800">支出构成</h3>
                             <p className="text-xs text-slate-400 font-medium">按分类统计</p>
                         </div>
                     </div>
                     
                     <div className="h-[260px] w-full relative">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" cornerRadius={6}>
                              {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-300"><div className="bg-slate-50 p-4 rounded-full mb-3"><PieIcon size={32} className="opacity-20" /></div><span className="text-xs font-bold">本期暂无支出数据</span></div>
                      )}
                      {chartData.length > 0 && (
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-[25%] sm:pr-[15%]">
                             <span className="text-xs text-slate-400 font-bold block">Top 1</span>
                             <span className="text-sm font-bold text-slate-800 truncate max-w-[80px] block">{chartData[0].name}</span>
                         </div>
                      )}
                     </div>
                 </div>
             </div>
           )}

           {/* AI Advice Section */}
           <div className="relative overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 shadow-xl shadow-indigo-100/50">
               <div className="bg-white rounded-[calc(2rem-1px)] p-6 relative z-10 h-full">
                   <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 text-white">
                           <Sparkles size={24} className="animate-pulse" />
                       </div>
                       <div className="flex-1">
                           <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                               DeepSeek 财务顾问
                           </h3>
                           
                           <div className="mt-4 min-h-[60px]">
                               {advice ? (
                                   <div className="animate-in fade-in slide-in-from-bottom-2">
                                       <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            {advice}
                                       </div>
                                       <div className="mt-4 flex justify-end">
                                            <button onClick={handleGetAdvice} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">刷新建议 <ArrowRight size={12} /></button>
                                       </div>
                                   </div>
                               ) : (
                                   <div>
                                       <p className="text-slate-500 text-sm mb-4 leading-relaxed">基于 <span className="font-bold text-slate-700">{formatDateLabel(currentDate, viewMode)}</span> 的大数据分析，为您提供个性化理财建议。</p>
                                       <button onClick={handleGetAdvice} disabled={isAnalyzing} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">{isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> 深度分析中...</> : '生成 AI 报告'}</button>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};