import React, { useState, useEffect } from 'react';
import { 
  Transaction, TransactionType, Category, User, Baby, 
  CreditCardAccount, LoanAccount, SavingsGoal, FamilyNote, AppTab
} from './types';
import { 
  MOCK_USERS, MOCK_BABIES, MOCK_GOALS, MOCK_CREDIT_CARDS, 
  MOCK_LOANS, INITIAL_TRANSACTIONS 
} from './constants';
import { TransactionCard } from './components/TransactionCard';
import { StatsView } from './components/StatsView';
import { VoiceAssistant } from './components/VoiceAssistant';
import { LandingPage } from './components/LandingPage';
import { HomeView } from './components/views/HomeView';
import { FamilyView } from './components/views/FamilyView';
import { ProfileView } from './components/views/ProfileView';
import { 
  Home, PieChart, Users, User as UserIcon, Sparkles, 
  Wallet, Plus, ChevronLeft, CreditCard, 
  X, Check, TrendingUp, TrendingDown, 
  Pencil, Trash2, Landmark, ArrowLeftRight, Smile, Trophy, CheckCircle2,
  BarChart3, Baby as BabyIcon, CalendarClock,
  PiggyBank, ShieldCheck, Target, Share2, Rocket
} from './components/Icons';

// Helper Hook for Sticky State (Local Storage)
function useStickyState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
        const stickyValue = window.localStorage.getItem(key);
        return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    }
    return defaultValue;
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);
  return [value, setValue];
}

// Simple Confetti Placeholder
const ConfettiEffect = () => (
  <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-start overflow-hidden">
    <div className="absolute top-0 w-full h-full flex justify-center pt-20">
       <div className="text-6xl animate-bounce">🎉</div>
    </div>
  </div>
);

export default function App() {
  // --- Global State ---
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  // Safe initialization for empty MOCK_USERS
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0] || {} as User);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [babies, setBabies] = useState<Baby[]>(MOCK_BABIES);
  const [goals, setGoals] = useState<SavingsGoal[]>(MOCK_GOALS);
  const [creditCards, setCreditCards] = useState<CreditCardAccount[]>(MOCK_CREDIT_CARDS);
  const [loans, setLoans] = useState<LoanAccount[]>(MOCK_LOANS);
  const [familyNotes, setFamilyNotes] = useState<FamilyNote[]>([]);
  
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [activeModule, setActiveModule] = useState<string>('NONE');
  
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [debtTab, setDebtTab] = useState<'CARDS' | 'LOANS' | 'BILLS'>('CARDS');
  
  const [hideAmount, setHideAmount] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Budget State
  const [monthlyBudget, setMonthlyBudget] = useStickyState('gf_monthly_budget', 20000);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showSharingSettings, setShowSharingSettings] = useState(false);

  // Sharing Settings State
  const [sharingSettings, setSharingSettings] = useStickyState('gf_sharing_config', {
      enabled: true,
      modules: {
          ledger: true,
          baby: true,
          assets: false, // Default to hidden for privacy
          goals: true
      }
  });

  // Transaction Detail & Edit States
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Editing States for Cards/Loans
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  // Baby Edit State
  const [editingBabyId, setEditingBabyId] = useState<string | null>(null);
  const [babyForm, setBabyForm] = useState({ name: '', birthDate: '', avatar: '👶' });

  // Forms
  const [addForm, setAddForm] = useState({
    amount: '', type: TransactionType.EXPENSE, category: Category.FOOD,
    note: '', date: new Date().toISOString().split('T')[0], dueDate: '', babyId: '', cardId: '', loanId: ''
  });
  const [newCardForm, setNewCardForm] = useState({ bankName: '', cardName: '', creditLimit: '', billDay: '', repaymentDay: '', last4Digits: '' });
  const [newLoanForm, setNewLoanForm] = useState({ name: '', bankName: '', totalAmount: '', balance: '', interestDay: '', monthlyRepayment: '', category: Category.MORTGAGE });
  const [newGoalForm, setNewGoalForm] = useState({ name: '', targetAmount: '', icon: '🌟' });
  const [inviteForm, setInviteForm] = useState({ name: '', role: 'member' });
  const [depositAmount, setDepositAmount] = useState('');
  const [newNoteForm, setNewNoteForm] = useState({ content: '', emoji: '📝', color: 'bg-yellow-100' });

  // Delete Confirmation States
  const [babyToDelete, setBabyToDelete] = useState<Baby | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCardAccount | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<LoanAccount | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<FamilyNote | null>(null);
  
  // Permissions derived state
  const isFamilyAdmin = currentUser.isFamilyAdmin;
  const canEdit = isFamilyAdmin || (currentUser.permissions?.canEdit ?? false);

  // --- Derived Data ---
  const visibleTransactions = transactions;

  const displayAmount = (amount: number) => {
    return hideAmount ? '****' : `¥${amount.toLocaleString()}`;
  };

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

  // --- Handlers ---

  const handleLogin = (name: string) => {
    // Test Version: Auto Premium
    const newUser: User = { id: `user_${Date.now()}`, name, avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`, isFamilyAdmin: true, isPremium: true };
    setUsers([newUser, ...users]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
  };

  const upgradeToPremium = () => {
    setCurrentUser({ ...currentUser, isPremium: true });
    setActiveModule('NONE');
    alert("测试版已解锁全部功能！");
  };

  const toggleMemberPermission = (userId: string) => {
    if (!isFamilyAdmin) return;
    setUsers(users.map(u => {
        if (u.id === userId) {
            const currentEdit = u.permissions?.canEdit ?? false;
            return { 
                ...u, 
                permissions: { 
                    ...u.permissions, 
                    canEdit: !currentEdit,
                    canView: true 
                } 
            };
        }
        return u;
    }));
  };
  
  const toggleSharingModule = (key: string) => {
    if (!isFamilyAdmin) return;
    setSharingSettings(prev => ({
        ...prev,
        modules: { ...prev.modules, [key]: !prev.modules[key as keyof typeof prev.modules] }
    }));
  };

  const openTransactionDetail = (t: Transaction) => {
      setSelectedTransaction(t);
      setIsEditingTransaction(false);
      setEditForm({ ...t, date: t.date.split('T')[0] });
  };

  const handleSaveTransactionEdit = () => {
      if (!selectedTransaction || !editForm.amount || !canEdit) return;
      const updatedTx: Transaction = {
          ...selectedTransaction,
          ...editForm as any, 
          amount: typeof editForm.amount === 'string' ? parseFloat(editForm.amount) : editForm.amount,
          date: new Date(editForm.date as string).toISOString()
      };
      setTransactions(transactions.map(t => t.id === selectedTransaction.id ? updatedTx : t));
      setSelectedTransaction(updatedTx); 
      setIsEditingTransaction(false);
  };

  const handleDeleteTransaction = () => {
      if (!selectedTransaction || !canEdit) return;
      setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
      setSelectedTransaction(null);
  };
  
  // Manual Transaction Add
  const handleAddTransaction = () => {
      if (!addForm.amount) return;
      const newTx: Transaction = {
          id: Date.now().toString(),
          amount: parseFloat(addForm.amount),
          type: addForm.type,
          category: addForm.category,
          note: addForm.note,
          date: new Date(addForm.date).toISOString(),
          dueDate: addForm.dueDate ? new Date(addForm.dueDate).toISOString() : undefined,
          userId: currentUser.id,
          babyId: addForm.babyId || undefined,
          cardId: addForm.cardId || undefined,
          loanId: addForm.loanId || undefined,
      };
      setTransactions([newTx, ...transactions]);
      setShowAddModal(false);
      setAddForm({ amount: '', type: TransactionType.EXPENSE, category: Category.FOOD, note: '', date: new Date().toISOString().split('T')[0], dueDate: '', babyId: '', cardId: '', loanId: '' });
  };

  const openBabyExpenseModal = () => {
      if (!selectedBaby) return;
      setAddForm({
          amount: '',
          type: TransactionType.EXPENSE, // Force Expense
          category: Category.BABY,       // Default to Baby General
          note: '',
          date: new Date().toISOString().split('T')[0],
          dueDate: '',
          babyId: selectedBaby.id,       // Lock to this baby
          cardId: '',
          loanId: ''
      });
      setShowAddModal(true);
  };

  // ... (Card and Loan handlers remain the same) ...
  const openAddCard = () => { setNewCardForm({ bankName: '', cardName: '', creditLimit: '', billDay: '', repaymentDay: '', last4Digits: '' }); setEditingCardId(null); setShowAddCardModal(true); };
  const openEditCard = (card: CreditCardAccount) => { setNewCardForm({ bankName: card.bankName, cardName: card.cardName, creditLimit: card.creditLimit.toString(), billDay: card.billDay.toString(), repaymentDay: card.repaymentDay.toString(), last4Digits: card.last4Digits }); setEditingCardId(card.id); setShowAddCardModal(true); };
  const handleSaveCard = () => { const cardData = { bankName: newCardForm.bankName, cardName: newCardForm.cardName, creditLimit: parseFloat(newCardForm.creditLimit), billDay: parseInt(newCardForm.billDay), repaymentDay: parseInt(newCardForm.repaymentDay), last4Digits: newCardForm.last4Digits, theme: 'from-indigo-600 to-blue-700' }; if (editingCardId) { setCreditCards(creditCards.map(c => c.id === editingCardId ? { ...c, ...cardData } : c)); } else { const newCard: CreditCardAccount = { id: `card_${Date.now()}`, balance: 0, ...cardData }; setCreditCards([...creditCards, newCard]); } setShowAddCardModal(false); };
  const openAddLoan = () => { setNewLoanForm({ name: '', bankName: '', totalAmount: '', balance: '', interestDay: '', monthlyRepayment: '', category: Category.MORTGAGE }); setEditingLoanId(null); setShowAddLoanModal(true); };
  const openEditLoan = (loan: LoanAccount) => { setNewLoanForm({ name: loan.name, bankName: loan.bankName, totalAmount: loan.totalAmount.toString(), balance: loan.balance.toString(), interestDay: loan.interestDay.toString(), monthlyRepayment: loan.monthlyRepayment.toString(), category: loan.category }); setEditingLoanId(loan.id); setShowAddLoanModal(true); };
  const handleSaveLoan = () => { const loanData = { name: newLoanForm.name, bankName: newLoanForm.bankName, totalAmount: parseFloat(newLoanForm.totalAmount), balance: parseFloat(newLoanForm.balance), interestDay: parseInt(newLoanForm.interestDay), monthlyRepayment: parseFloat(newLoanForm.monthlyRepayment), category: newLoanForm.category as Category }; if (editingLoanId) { setLoans(loans.map(l => l.id === editingLoanId ? { ...l, ...loanData } : l)); } else { const newLoan: LoanAccount = { id: `loan_${Date.now()}`, ...loanData }; setLoans([...loans, newLoan]); } setShowAddLoanModal(false); };
  
  const handleAddMember = () => { 
      if (!inviteForm.name) return; 

      // TEST MODE: LIMIT REMOVED
      // if (!currentUser.isPremium && users.length >= 2) { ... }

      const newUser: User = { 
          id: `user_${Date.now()}`, 
          name: inviteForm.name, 
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${inviteForm.name}`, 
          isFamilyAdmin: inviteForm.role === 'admin', 
          isPremium: true, // TEST MODE: Force Premium
          permissions: { canView: true, canEdit: inviteForm.role === 'admin' } 
      }; 
      setUsers([...users, newUser]); 
      setShowInviteModal(false); 
      setInviteForm({ name: '', role: 'member' }); 
      alert("模拟加入成功！请在'个人中心'切换用户进行体验。");
  };

  // --- Baby Handlers ---
  const openAddBabyModal = () => {
      setBabyForm({ name: '', birthDate: '', avatar: '👶' });
      setEditingBabyId(null);
      setShowAddBaby(true);
  };

  const openEditBabyModal = (e: React.MouseEvent, baby: Baby) => {
      e.stopPropagation();
      setBabyForm({ 
          name: baby.name, 
          birthDate: baby.birthDate || '', 
          avatar: baby.avatar 
      });
      setEditingBabyId(baby.id);
      setShowAddBaby(true);
  };

  const handleSaveBaby = () => {
      if (!babyForm.name) return;
      if (editingBabyId) {
          setBabies(babies.map(b => b.id === editingBabyId ? { ...b, ...babyForm } : b));
      } else {
          const newBaby: Baby = { id: `baby_${Date.now()}`, ...babyForm };
          setBabies([...babies, newBaby]);
      }
      setShowAddBaby(false);
  };

  // ... (Goal, Note, Deposit, QuickPay, etc. handlers remain the same) ...
  const handleAddGoal = () => { if (!newGoalForm.name || !newGoalForm.targetAmount) return; const newGoal: SavingsGoal = { id: `goal_${Date.now()}`, name: newGoalForm.name, targetAmount: parseFloat(newGoalForm.targetAmount), currentAmount: 0, icon: newGoalForm.icon, color: 'from-pink-500 to-rose-500' }; setGoals([...goals, newGoal]); setNewGoalForm({ name: '', targetAmount: '', icon: '🌟' }); setShowAddGoalModal(false); };
  const handleAddNote = () => { if (!newNoteForm.content) return; const newNote: FamilyNote = { id: `note_${Date.now()}`, userId: currentUser.id, userName: currentUser.name, userAvatar: currentUser.avatar, content: newNoteForm.content, emoji: newNoteForm.emoji, color: newNoteForm.color, createdAt: new Date().toISOString() }; setFamilyNotes([newNote, ...familyNotes]); setShowAddNoteModal(false); setNewNoteForm({ content: '', emoji: '📝', color: 'bg-yellow-100' }); };
  const handleDeposit = () => { if (!selectedGoal || !depositAmount) return; const amount = parseFloat(depositAmount); const updatedGoals = goals.map(g => g.id === selectedGoal.id ? { ...g, currentAmount: g.currentAmount + amount } : g ); setGoals(updatedGoals); const newTx: Transaction = { id: Date.now().toString(), amount: amount, type: TransactionType.EXPENSE, category: Category.INVESTMENT, date: new Date().toISOString(), note: `存入心愿: ${selectedGoal.name}`, userId: currentUser.id }; setTransactions([newTx, ...transactions]); setDepositAmount(''); setShowDepositModal(false); setSelectedGoal(null); triggerConfetti(); };
  const openDebtAddModal = (type: TransactionType) => { setAddForm({ ...addForm, type: type, category: type === TransactionType.DEBT ? Category.BORROWING : Category.CREDIT_CARD, amount: '', note: type === TransactionType.DEBT ? '借入一笔' : '偿还账单' }); setShowAddModal(true); };
  const handleQuickPay = (data: any) => { setAddForm({ ...addForm, type: data.type, category: data.category, amount: data.amount, note: data.note, cardId: data.cardId || '', loanId: data.loanId || '', }); setShowAddModal(true); };
  const triggerConfetti = () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 5000); };
  const confirmDeleteMember = () => { if (memberToDelete) { setUsers(users.filter(u => u.id !== memberToDelete.id)); setMemberToDelete(null); } };
  const confirmDeleteBaby = () => { if (babyToDelete) { setBabies(babies.filter(b => b.id !== babyToDelete.id)); setBabyToDelete(null); } };
  const confirmDeleteGoal = () => { if (goalToDelete) { setGoals(goals.filter(g => g.id !== goalToDelete.id)); setGoalToDelete(null); } };
  const confirmDeleteCard = () => { if (cardToDelete) { setCreditCards(creditCards.filter(c => c.id !== cardToDelete.id)); setCardToDelete(null); } };
  const confirmDeleteLoan = () => { if (loanToDelete) { setLoans(loans.filter(l => l.id !== loanToDelete.id)); setLoanToDelete(null); } };
  const confirmDeleteNote = () => { if (noteToDelete) { setFamilyNotes(familyNotes.filter(n => n.id !== noteToDelete.id)); setNoteToDelete(null); } };

  // --- Renders ---

  const renderBabyDetail = () => (
    <div className="p-6 h-full flex flex-col bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => setSelectedBaby(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><ChevronLeft/></button>
            <h2 className="text-xl font-bold">{selectedBaby?.avatar} {selectedBaby?.name} 的账本</h2>
        </div>
        {canEdit && (
            <button onClick={openBabyExpenseModal} className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all active:scale-95">
                <Plus size={16}/> 记一笔支出
            </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-24 no-scrollbar">
        {transactions.filter(t => t.babyId === selectedBaby?.id).map(t => (
          <TransactionCard key={t.id} transaction={t} user={users.find(u => u.id === t.userId)} onClick={openTransactionDetail} hideAmount={hideAmount} />
        ))}
      </div>
    </div>
  );

  const renderBabyListView = () => (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveModule('NONE')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50"><ChevronLeft/></button>
        <h2 className="text-2xl font-bold">宝宝成长账本</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {babies.map(b => (
          <div key={b.id} onClick={() => setSelectedBaby(b)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center cursor-pointer hover:shadow-md transition-all group relative overflow-hidden">
             {/* Edit/Delete Actions */}
             {isFamilyAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={(e) => openEditBabyModal(e, b)}
                        className="p-2 bg-slate-50 text-indigo-500 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        <Pencil size={14}/>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setBabyToDelete(b); }}
                        className="p-2 bg-slate-50 text-slate-300 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
             )}

            <div className="text-5xl mb-3">{b.avatar}</div>
            <p className="font-bold text-lg text-slate-800">{b.name}</p>
            <p className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-md inline-block mt-2">
                {getAge(b.birthDate)}
            </p>
          </div>
        ))}
        {/* Add Baby Card */}
        {isFamilyAdmin && (
            <div onClick={openAddBabyModal} className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[200px]">
                <Plus size={32} />
                <span className="font-bold">添加宝宝</span>
            </div>
        )}
      </div>
    </div>
  );

  const renderGoalsView = () => (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveModule('NONE')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50"><ChevronLeft/></button>
          <h2 className="text-2xl font-bold">心愿存钱</h2>
        </div>
        {canEdit && <button onClick={() => setShowAddGoalModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"><Plus size={16}/> 新建目标</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => { const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100); return ( <div key={goal.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group relative overflow-hidden transition-all hover:shadow-lg"> <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${goal.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150 group-hover:opacity-20`}></div> <div className="flex justify-between items-start mb-4 relative z-10"> <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{goal.icon}</div> {canEdit && <button onClick={() => setGoalToDelete(goal)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>} </div> <div className="relative z-10"> <h3 className="text-lg font-bold text-slate-800 mb-1">{goal.name}</h3> <div className="flex justify-between items-end mb-4"> <span className="text-2xl font-black text-slate-900">{hideAmount ? '****' : `¥${goal.currentAmount.toLocaleString()}`}</span> <span className="text-xs font-bold text-slate-400 mb-1">目标 ¥{goal.targetAmount.toLocaleString()}</span> </div> <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4"> <div className={`h-full rounded-full bg-gradient-to-r ${goal.color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div> </div> {canEdit && <button onClick={() => { setSelectedGoal(goal); setShowDepositModal(true); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-800" > <PiggyBank size={16} /> 存入一笔 </button>} </div> </div> ); })}
      </div>
    </div>
  );
  const renderDebtView = () => {
    const debtTransactions = transactions.filter(t => t.type === TransactionType.DEBT || t.type === TransactionType.REPAYMENT);
    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 pb-32">
          <div className="flex items-center gap-4 mb-4"> <button onClick={() => setActiveModule('NONE')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50"><ChevronLeft/></button> <h2 className="text-2xl font-bold">负债管理</h2> </div>
          <div className="bg-white p-1.5 rounded-2xl flex shadow-sm border border-slate-100"> <button onClick={() => setDebtTab('CARDS')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${debtTab === 'CARDS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}> <CreditCard size={18}/> 信用卡 </button> <button onClick={() => setDebtTab('LOANS')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${debtTab === 'LOANS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}> <Landmark size={18}/> 贷款 </button> <button onClick={() => setDebtTab('BILLS')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${debtTab === 'BILLS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}> <ArrowLeftRight size={18}/> 账单流水 </button> </div>
          {debtTab === 'CARDS' && ( <div className="space-y-4 animate-in fade-in slide-in-from-right-4"> <div className="flex justify-between items-center px-2"> <h3 className="font-bold text-slate-800">信用卡列表 ({creditCards.length})</h3> {canEdit && <button onClick={openAddCard} className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"><Plus size={14}/> 添加卡片</button>} </div> <div className="space-y-4"> {creditCards.map(c => ( <div key={c.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"> <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"> {canEdit && <button onClick={(e) => { e.stopPropagation(); openEditCard(c); }} className="p-2 bg-white text-indigo-600 rounded-full shadow-sm hover:bg-indigo-50"><Pencil size={16}/></button>} {canEdit && <button onClick={(e) => { e.stopPropagation(); setCardToDelete(c); }} className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={16}/></button>} </div> <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${c.theme}`}></div> <div className="pl-4"> <div className="flex justify-between items-start mb-4"> <div> <h4 className="font-bold text-lg text-slate-800">{c.bankName}</h4> <p className="text-xs text-slate-400">{c.cardName} (尾号 {c.last4Digits})</p> </div> <CreditCard className="text-slate-200" size={32}/> </div> <div className="flex justify-between items-end"> <div> <p className="text-xs text-slate-400 font-bold mb-1">信用额度</p> <p className="text-2xl font-black text-slate-800">{displayAmount(c.creditLimit)}</p> </div> <div className="text-right"> <p className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md mb-1"><CalendarClock size={10} className="inline mr-1"/>账单日 {c.billDay}号 / 还款日 {c.repaymentDay}号</p> <p className="text-xs font-bold text-indigo-600">剩余应还: {displayAmount(c.balance || 0)}</p> </div> </div> </div> </div> ))} </div> </div> )}
          {debtTab === 'LOANS' && ( <div className="space-y-4 animate-in fade-in slide-in-from-right-4"> <div className="flex justify-between items-center px-2"> <h3 className="font-bold text-slate-800">贷款账户 ({loans.length})</h3> {canEdit && <button onClick={openAddLoan} className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus size={14}/> 添加贷款</button>} </div> <div className="space-y-4"> {loans.map(l => ( <div key={l.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"> <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"> {canEdit && <button onClick={(e) => { e.stopPropagation(); openEditLoan(l); }} className="p-2 bg-slate-50 text-blue-600 rounded-full hover:bg-blue-50"><Pencil size={16}/></button>} {canEdit && <button onClick={(e) => { e.stopPropagation(); setLoanToDelete(l); }} className="p-2 bg-slate-50 text-red-500 rounded-full hover:bg-red-50"><Trash2 size={16}/></button>} </div> <div className="flex items-center gap-4 mb-4"> <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Landmark size={24}/></div> <div> <h4 className="font-bold text-lg text-slate-800">{l.name}</h4> <p className="text-xs text-slate-400 font-bold uppercase">{l.bankName} · {l.category}</p> </div> </div> <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center"> <div> <p className="text-xs text-slate-400 font-bold mb-1">当前余额</p> <p className="text-xl font-bold text-slate-800">{displayAmount(l.balance)}</p> </div> <div className="text-right"> <p className="text-xs text-slate-400 font-bold mb-1">每月{l.interestDay}号还款</p> <p className="text-sm font-bold text-blue-600">月供: {displayAmount(l.monthlyRepayment)}</p> </div> </div> </div> ))} </div> </div> )}
          {debtTab === 'BILLS' && ( <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4"> <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"> <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">账单流水</h3> {canEdit && <div className="flex gap-3 w-full sm:w-auto"> <button onClick={() => openDebtAddModal(TransactionType.DEBT)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"> <Plus size={14}/> 记借入 </button> <button onClick={() => openDebtAddModal(TransactionType.REPAYMENT)} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"> <Plus size={14}/> 记还款 </button> </div>} </div> <div className="space-y-3"> {debtTransactions.length > 0 ? ( debtTransactions.map(t => ( <TransactionCard key={t.id} transaction={t} user={users.find(u => u.id === t.userId)} onClick={openTransactionDetail} onDelete={canEdit ? (t) => setTransactionToDelete(t) : undefined} hideAmount={hideAmount} /> )) ) : ( <div className="text-center py-10 text-slate-400"> <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3"><Smile size={32} className="opacity-20"/></div> <p className="text-xs">暂无借贷或还款记录</p> </div> )} </div> </div> )}
        </div>
    );
  };
  const renderAssetManagement = () => ( <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8"> <div className="flex items-center gap-4"> <button onClick={() => setActiveModule('NONE')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50"><ChevronLeft/></button> <h2 className="text-2xl font-bold">我的钱包</h2> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"> <div className="flex justify-between items-center mb-6"> <h3 className="font-bold flex items-center gap-2"><CreditCard size={18}/> 信用卡</h3> {canEdit && <button onClick={() => setShowAddCardModal(true)} className="text-xs font-bold text-indigo-600">添加</button>} </div> <div className="space-y-3"> {creditCards.map(c => ( <div key={c.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group"> <div><p className="font-bold">{c.bankName}</p><p className="text-xs text-slate-400">尾号 {c.last4Digits}</p></div> <p className="font-bold">{displayAmount(c.creditLimit)}</p> </div> ))} </div> </div> <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"> <div className="flex justify-between items-center mb-6"> <h3 className="font-bold flex items-center gap-2"><Landmark size={18}/> 贷款账户</h3> {canEdit && <button onClick={() => setShowAddLoanModal(true)} className="text-xs font-bold text-blue-600">添加</button>} </div> <div className="space-y-3"> {loans.map(l => ( <div key={l.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center"> <div><p className="font-bold">{l.name}</p><p className="text-xs text-slate-400">{l.bankName}</p></div> <p className="font-bold">{displayAmount(l.balance)}</p> </div> ))} </div> </div> </div> </div> );
  
  // Update Payment Page to be "Test Mode" info page
  const renderPaymentPage = () => ( 
    <div className="p-10 max-w-xl mx-auto text-center space-y-8 animate-in zoom-in-95"> 
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto"><Rocket size={40}/></div> 
        <h2 className="text-3xl font-bold">开发者测试模式</h2> 
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-200 shadow-sm"> 
            <div className="inline-block bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold mb-4">功能全开</div>
            <p className="text-lg font-bold text-slate-700 mb-6">小程序体验版已自动解锁 VIP 权益</p> 
            <ul className="text-left space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl"> 
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 className="text-emerald-500" size={16}/> 无限制家庭成员共享</li> 
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 className="text-emerald-500" size={16}/> 解锁全部 AI 语音识别额度</li> 
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 className="text-emerald-500" size={16}/> 资产趋势高级报表</li> 
            </ul> 
            <button onClick={() => setActiveModule('NONE')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">开始体验</button> 
        </div> 
    </div> 
  );

  const renderContent = () => {
    if (selectedBaby) return renderBabyDetail();
    if (activeModule === 'DEBT') return renderDebtView();
    if (activeModule === 'BABY_LIST') return renderBabyListView();
    if (activeModule === 'ASSETS') return renderAssetManagement();
    if (activeModule === 'PAYMENT') return renderPaymentPage();
    if (activeModule === 'GOALS') return renderGoalsView();

    switch(activeTab) {
      case AppTab.HOME:
        return <HomeView 
          currentUser={currentUser}
          transactions={visibleTransactions}
          users={users}
          monthlyBudget={monthlyBudget}
          familyNotes={familyNotes}
          goals={goals}
          creditCards={creditCards}
          loans={loans}
          babies={babies}
          hideAmount={hideAmount}
          canEdit={canEdit}
          onSetHideAmount={setHideAmount}
          onAddTransaction={() => setShowAddModal(true)}
          onAddNote={() => setShowAddNoteModal(true)}
          onDeleteNote={(note) => setNoteToDelete(note)}
          onQuickPay={handleQuickPay}
          onEditBudget={() => { setNewBudgetAmount(monthlyBudget.toString()); setShowEditBudgetModal(true); }}
          onOpenModule={setActiveModule}
          onAddGoal={() => setShowAddGoalModal(true)}
          onSelectGoal={(goal) => { setSelectedGoal(goal); setShowDepositModal(true); }}
          onDeleteGoal={(goal) => setGoalToDelete(goal)}
          onOpenTransactionDetail={openTransactionDetail}
        />;
      case AppTab.STATS: return <StatsView transactions={visibleTransactions} />;
      case AppTab.AI_ASSISTANT: return <VoiceAssistant onAddTransaction={(data) => setTransactions([{...data, id: Date.now().toString(), userId: currentUser.id}, ...transactions])} currentUserId={currentUser.id} readOnly={!canEdit} />;
      case AppTab.FAMILY: return <FamilyView 
          users={users}
          currentUser={currentUser}
          babies={babies}
          sharingSettings={sharingSettings}
          isFamilyAdmin={isFamilyAdmin}
          onOpenSettings={() => setShowSharingSettings(true)}
          onOpenInvite={() => setShowInviteModal(true)}
          onTogglePermission={toggleMemberPermission}
          onDeleteMember={(u) => setMemberToDelete(u)}
          onAddBaby={openAddBabyModal}
          onEditBaby={openEditBabyModal}
          onDeleteBaby={(b) => setBabyToDelete(b)}
      />;
      case AppTab.PROFILE: return <ProfileView 
          currentUser={currentUser}
          users={users}
          monthlyBudget={monthlyBudget}
          isFamilyAdmin={isFamilyAdmin}
          canEdit={canEdit}
          onSwitchUser={(u) => { setCurrentUser(u); setActiveTab(AppTab.HOME); }}
          onOpenModule={setActiveModule}
          onEditBudget={() => { setNewBudgetAmount(monthlyBudget.toString()); setShowEditBudgetModal(true); }}
      />;
      default: return null;
    }
  };

  if (!isLoggedIn) return <LandingPage onLogin={handleLogin} />;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col p-8">
        <div className="flex items-center gap-3 text-indigo-600 mb-10">
          <div className="bg-indigo-600 text-white p-1.5 rounded-xl"><Wallet size={24} fill="currentColor" /></div>
          <span className="font-bold text-xl tracking-tight text-slate-900">每日记</span>
        </div>
        <nav className="space-y-2 flex-1">
          {[{ id: AppTab.HOME, icon: Home, label: '我的账本' }, { id: AppTab.STATS, icon: PieChart, label: '收支报表' }, { id: AppTab.AI_ASSISTANT, icon: Sparkles, label: 'AI 记账' }, { id: AppTab.FAMILY, icon: Users, label: '家庭共享' }, { id: AppTab.PROFILE, icon: UserIcon, label: '个人中心' }].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setActiveModule('NONE'); setSelectedBaby(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id && activeModule === 'NONE' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        {showConfetti && <ConfettiEffect />}
        {renderContent()}
      </main>

      {/* 移动端底部导航 */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl px-8 py-4 flex justify-between items-center shadow-2xl z-40">
        <button onClick={() => { setActiveTab(AppTab.HOME); setActiveModule('NONE'); setSelectedBaby(null); }} className={activeTab === AppTab.HOME ? 'text-indigo-600' : 'text-slate-400'}><Home/></button>
        <button onClick={() => { setActiveTab(AppTab.STATS); setActiveModule('NONE'); }} className={activeTab === AppTab.STATS ? 'text-indigo-600' : 'text-slate-400'}><BarChart3/></button>
        <button onClick={() => { setActiveTab(AppTab.AI_ASSISTANT); setActiveModule('NONE'); }} className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center -mt-12 border-4 border-slate-50 shadow-xl"><Sparkles/></button>
        <button onClick={() => { setActiveTab(AppTab.FAMILY); setActiveModule('NONE'); }} className={activeTab === AppTab.FAMILY ? 'text-indigo-600' : 'text-slate-400'}><Users/></button>
        <button onClick={() => { setActiveTab(AppTab.PROFILE); setActiveModule('NONE'); }} className={activeTab === AppTab.PROFILE ? 'text-indigo-600' : 'text-slate-400'}><UserIcon/></button>
      </nav>

      {/* Sharing Settings Modal */}
      {showSharingSettings && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={20}/> 共享权限管理
                    </h3>
                    <button onClick={() => setShowSharingSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                </div>

                {/* Master Switch */}
                <div className="bg-indigo-50 p-5 rounded-3xl mb-6 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-indigo-900">家庭数据共享</h4>
                        <p className="text-xs text-indigo-600/70 mt-1">总开关：控制所有成员的访问权限</p>
                    </div>
                    <button 
                        onClick={() => setSharingSettings({...sharingSettings, enabled: !sharingSettings.enabled})}
                        className={`w-14 h-8 rounded-full transition-all relative ${sharingSettings.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all ${sharingSettings.enabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Sub Switches */}
                <div className={`space-y-3 transition-all ${sharingSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <p className="text-xs font-bold text-slate-400 uppercase ml-2 mb-2">共享内容模块</p>
                    
                    {[
                        { key: 'ledger', label: '账本流水', icon: <Wallet size={18} />, desc: '允许查看收支明细' },
                        { key: 'baby', label: '宝宝档案', icon: <BabyIcon size={18} />, desc: '允许管理宝宝信息' },
                        { key: 'goals', label: '心愿目标', icon: <Target size={18} />, desc: '允许查看存钱进度' },
                        { key: 'assets', label: '资产账户', icon: <CreditCard size={18} />, desc: '允许查看信用卡与贷款 (敏感)', danger: true },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.danger ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleSharingModule(item.key)}
                                className={`w-11 h-6 rounded-full transition-all relative ${sharingSettings.modules[item.key as keyof typeof sharingSettings.modules] ? (item.danger ? 'bg-red-500' : 'bg-indigo-600') : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all ${sharingSettings.modules[item.key as keyof typeof sharingSettings.modules] ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">仅家庭管理员 ({currentUser.name}) 可修改此设置</p>
                </div>
            </div>
        </div>
      )}

      {/* Budget Edit Modal (NEW) */}
      {showEditBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="font-bold text-lg mb-4">设置月度预算</h3>
                <p className="text-xs text-slate-400 mb-6">合理的预算是家庭理财的第一步。该设置仅对家庭管理员可见。</p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-2 mb-6">
                    <span className="font-bold text-2xl">¥</span>
                    <input 
                        type="number" 
                        autoFocus 
                        placeholder="0" 
                        value={newBudgetAmount} 
                        onChange={e => setNewBudgetAmount(e.target.value)} 
                        className="bg-transparent text-3xl font-bold outline-none w-full" 
                    />
                </div>
                
                <button 
                    onClick={() => { 
                        const val = parseFloat(newBudgetAmount);
                        if (!isNaN(val) && val > 0) {
                            setMonthlyBudget(val);
                            setShowEditBudgetModal(false);
                        }
                    }} 
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                >
                    保存设置
                </button>
                <button onClick={() => setShowEditBudgetModal(false)} className="w-full text-slate-400 text-xs font-bold py-4 hover:text-slate-600">取消</button>
            </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Share2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">邀请家庭成员</h3>
                    <p className="text-xs text-slate-400 mt-2">对方扫码或点击链接即可加入家庭账本</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-center border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">邀请链接</p>
                    <p className="font-mono text-sm font-bold text-indigo-600 break-all">https://meiriji.app/join/f8a9s7</p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold text-slate-800 mb-3 text-center">-- 或 模拟添加 (Demo) --</p>
                    <div className="space-y-3">
                         <input 
                            type="text" 
                            placeholder="成员昵称 (如: 奶奶)" 
                            value={inviteForm.name}
                            onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                            className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200 focus:border-indigo-500 focus:outline-none"
                         />
                         <div className="flex gap-2">
                             <button 
                                onClick={() => setInviteForm({...inviteForm, role: 'member'})}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${inviteForm.role === 'member' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
                             >
                                 普通成员
                             </button>
                             <button 
                                onClick={() => setInviteForm({...inviteForm, role: 'admin'})}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${inviteForm.role === 'admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
                             >
                                 管理员
                             </button>
                         </div>
                         <button 
                            onClick={handleAddMember}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                         >
                             确认添加
                         </button>
                    </div>
                </div>
                
                <button onClick={() => setShowInviteModal(false)} className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-slate-600">取消</button>
            </div>
        </div>
      )}

      {/* ... (Other modals remain unchanged) ... */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold">交易详情</h3>
                     <button onClick={() => setSelectedTransaction(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={18}/></button>
                 </div>
                 <div className="p-6">
                     {isEditingTransaction ? (
                         <div className="space-y-4">
                             <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">交易类型</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.DEBT, TransactionType.REPAYMENT].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setEditForm({...editForm, type})}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${editForm.type === type ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {type === TransactionType.EXPENSE ? '支出' : type === TransactionType.INCOME ? '收入' : type === TransactionType.DEBT ? '借贷' : '还款'}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-slate-500 mb-1 block">金额</label>
                                 <input 
                                    type="number" 
                                    value={editForm.amount} 
                                    onChange={e => setEditForm({...editForm, amount: e.target.value})} 
                                    className="w-full bg-slate-50 p-3 rounded-xl font-bold"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 mb-1 block">备注</label>
                                 <input 
                                    type="text" 
                                    value={editForm.note} 
                                    onChange={e => setEditForm({...editForm, note: e.target.value})} 
                                    className="w-full bg-slate-50 p-3 rounded-xl"
                                 />
                             </div>
                             
                             <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">日期</label>
                                <input 
                                    type="date" 
                                    value={editForm.date} 
                                    onChange={e => setEditForm({...editForm, date: e.target.value})} 
                                    className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none" 
                                />
                             </div>

                             <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">分类</label>
                                <select 
                                    value={editForm.category} 
                                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                                    className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none"
                                >
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                             </div>

                             {/* Dynamic Editing Fields */}
                             {(editForm.category === Category.BABY || editForm.category === Category.EDUCATION || editForm.category === Category.TOYS) && (
                                <div>
                                    <label className="text-xs font-bold text-pink-500 mb-2 block flex items-center gap-1"><BabyIcon size={12}/> 归属宝宝</label>
                                    <select 
                                        value={editForm.babyId || ''} 
                                        onChange={e => setEditForm({...editForm, babyId: e.target.value})}
                                        className="w-full bg-pink-50 p-3 rounded-xl font-bold text-slate-700 outline-none border border-pink-100"
                                    >
                                        <option value="">不指定</option>
                                        {babies.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                             )}

                             {(editForm.type === TransactionType.DEBT || editForm.type === TransactionType.REPAYMENT || editForm.category === Category.CREDIT_CARD) && (
                                <div>
                                    <label className="text-xs font-bold text-indigo-600 mb-2 block flex items-center gap-1"><Wallet size={12}/> 关联账户</label>
                                    <select 
                                        value={editForm.cardId || editForm.loanId || ''} 
                                        onChange={e => {
                                            const id = e.target.value;
                                            const isCard = id.startsWith('card_');
                                            setEditForm({
                                                ...editForm, 
                                                cardId: isCard ? id : '', 
                                                loanId: !isCard ? id : ''
                                            });
                                        }}
                                        className="w-full bg-indigo-50 p-3 rounded-xl font-bold text-slate-700 outline-none border border-indigo-100"
                                    >
                                        <option value="">不关联</option>
                                        <optgroup label="信用卡">
                                            {creditCards.map(c => <option key={c.id} value={c.id}>{c.bankName}</option>)}
                                        </optgroup>
                                        <optgroup label="贷款">
                                            {loans.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                             )}

                             <div className="flex gap-3 mt-4">
                                 <button onClick={handleSaveTransactionEdit} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">保存</button>
                                 <button onClick={() => setIsEditingTransaction(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">取消</button>
                             </div>
                         </div>
                     ) : (
                         <div>
                             <div className="text-center mb-6">
                                 <div className={`inline-block p-4 rounded-full mb-3 ${selectedTransaction.type === TransactionType.INCOME ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                     {selectedTransaction.type === TransactionType.INCOME ? <TrendingUp size={32}/> : <TrendingDown size={32}/>}
                                 </div>
                                 <h2 className="text-3xl font-bold">{selectedTransaction.amount}</h2>
                                 <p className="text-slate-500 font-bold mt-1">{selectedTransaction.category}</p>
                             </div>
                             <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-6">
                                 <div className="flex justify-between text-sm">
                                     <span className="text-slate-400">时间</span>
                                     <span className="font-bold text-slate-700">{new Date(selectedTransaction.date).toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-slate-400">备注</span>
                                     <span className="font-bold text-slate-700">{selectedTransaction.note || '-'}</span>
                                 </div>
                                 {selectedTransaction.babyId && (
                                     <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">相关宝宝</span>
                                        <span className="font-bold text-pink-500">{babies.find(b => b.id === selectedTransaction.babyId)?.name || '未知'}</span>
                                     </div>
                                 )}
                                 {(selectedTransaction.cardId || selectedTransaction.loanId) && (
                                     <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">关联账户</span>
                                        <span className="font-bold text-indigo-600">
                                            {creditCards.find(c => c.id === selectedTransaction.cardId)?.bankName || 
                                             loans.find(l => l.id === selectedTransaction.loanId)?.name || '未知账户'}
                                        </span>
                                     </div>
                                 )}
                                 {users.find(u => u.id === selectedTransaction.userId) && (
                                     <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">操作人</span>
                                        <div className="flex items-center gap-1">
                                            <img src={users.find(u => u.id === selectedTransaction.userId)?.avatar} className="w-4 h-4 rounded-full"/>
                                            <span className="font-bold text-slate-700">{users.find(u => u.id === selectedTransaction.userId)?.name}</span>
                                        </div>
                                     </div>
                                 )}
                             </div>
                             {canEdit && (
                                 <div className="flex gap-3">
                                     <button onClick={() => setIsEditingTransaction(true)} className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Pencil size={16}/> 编辑</button>
                                     <button onClick={handleDeleteTransaction} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> 删除</button>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             </div>
        </div>
      )}

      {/* Manual Transaction Add Modal (Updated) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                     <h3 className="font-bold">记一笔</h3>
                     <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={18}/></button>
                 </div>
                 <div className="p-6 space-y-4">
                     {/* Show Type Switcher ONLY if NOT in specific baby mode (babyId pre-selected from context) */}
                     {(!selectedBaby || addForm.babyId !== selectedBaby.id) ? (
                         <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                            {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.DEBT, TransactionType.REPAYMENT].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setAddForm({...addForm, type, category: Object.values(Category)[0]})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${addForm.type === type ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                                >
                                    {type === TransactionType.EXPENSE ? '支出' : type === TransactionType.INCOME ? '收入' : type === TransactionType.DEBT ? '借贷' : '还款'}
                                </button>
                            ))}
                         </div>
                     ) : (
                         <div className="bg-pink-50 text-pink-600 font-bold p-3 rounded-xl text-center mb-4 border border-pink-100 text-sm flex items-center justify-center gap-2">
                             👶 记一笔: {selectedBaby.name} 支出
                         </div>
                     )}
                     
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-2">
                        <span className="font-bold text-xl">¥</span>
                        <input type="number" placeholder="0.00" value={addForm.amount} onChange={e => setAddForm({...addForm, amount: e.target.value})} className="bg-transparent text-3xl font-bold outline-none w-full" autoFocus />
                     </div>

                     <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">分类</label>
                        <select 
                            value={addForm.category} 
                            onChange={e => setAddForm({...addForm, category: e.target.value as Category})}
                            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold text-slate-700 outline-none"
                        >
                            {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>

                     {/* Dynamic Baby Selector */}
                     {(addForm.category === Category.BABY || addForm.category === Category.EDUCATION || addForm.category === Category.TOYS || addForm.category === Category.ALLOWANCE || (selectedBaby && addForm.babyId === selectedBaby.id)) && (
                        <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-pink-500 mb-2 block flex items-center gap-1"><BabyIcon size={12}/> 归属宝宝 (可选)</label>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {babies.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setAddForm({...addForm, babyId: addForm.babyId === b.id ? '' : b.id})}
                                        className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all shrink-0 ${addForm.babyId === b.id ? 'bg-white border-pink-500 shadow-sm text-pink-600' : 'bg-transparent border-transparent hover:bg-white/50 text-slate-500'}`}
                                    >
                                        <span className="text-lg">{b.avatar}</span>
                                        <span className="text-xs font-bold">{b.name}</span>
                                        {addForm.babyId === b.id && <CheckCircle2 size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                     )}

                     {/* Dynamic Account Selector for Debt/Repayment */}
                     {(addForm.type === TransactionType.DEBT || addForm.type === TransactionType.REPAYMENT || addForm.category === Category.CREDIT_CARD || addForm.category === Category.MORTGAGE) && (
                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-indigo-600 mb-1 block flex items-center gap-1"><Wallet size={12}/> 关联账户 (可选)</label>
                            
                            {/* Credit Cards */}
                            {creditCards.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 mb-2">信用卡</p>
                                    <div className="flex flex-wrap gap-2">
                                        {creditCards.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setAddForm({...addForm, cardId: addForm.cardId === c.id ? '' : c.id, loanId: ''})}
                                                className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all ${addForm.cardId === c.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                                            >
                                                {c.bankName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loans */}
                            {loans.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 mb-2">贷款账户</p>
                                    <div className="flex flex-wrap gap-2">
                                        {loans.map(l => (
                                            <button
                                                key={l.id}
                                                onClick={() => setAddForm({...addForm, loanId: addForm.loanId === l.id ? '' : l.id, cardId: ''})}
                                                className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all ${addForm.loanId === l.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                                            >
                                                {l.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {addForm.type === TransactionType.DEBT && (
                                <div>
                                     <label className="text-[10px] font-bold text-slate-400 mb-1 block">预计还款日 (到期日)</label>
                                     <input type="date" value={addForm.dueDate} onChange={e => setAddForm({...addForm, dueDate: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-indigo-200 text-xs font-bold" />
                                </div>
                            )}
                        </div>
                     )}

                     <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">时间</label>
                        <input type="date" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none font-medium" />
                     </div>

                     <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">备注</label>
                        <input type="text" placeholder="写点什么..." value={addForm.note} onChange={e => setAddForm({...addForm, note: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none" />
                     </div>

                     <button onClick={handleAddTransaction} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all mt-4">
                         确认记账
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Sticky Note Add Modal (Missing) */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">贴张便条</h3>
                    <button onClick={() => setShowAddNoteModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={18}/></button>
                </div>
                
                <textarea 
                    value={newNoteForm.content}
                    onChange={e => setNewNoteForm({...newNoteForm, content: e.target.value})}
                    placeholder="想对家人说什么..."
                    className={`w-full h-32 p-4 rounded-xl mb-4 border-none focus:ring-0 text-slate-800 font-medium resize-none ${newNoteForm.color}`}
                ></textarea>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                        {['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100'].map(c => (
                            <button 
                                key={c} 
                                onClick={() => setNewNoteForm({...newNoteForm, color: c})}
                                className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${c} ${newNoteForm.color === c ? 'scale-125 border-slate-400' : ''}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                         {['📝', '❤️', '⚠️', '🎉'].map(emoji => (
                             <button key={emoji} onClick={() => setNewNoteForm({...newNoteForm, emoji})} className={`text-xl hover:scale-110 transition-transform ${newNoteForm.emoji === emoji ? 'bg-slate-100 rounded-lg' : ''}`}>{emoji}</button>
                         ))}
                    </div>
                </div>

                <button onClick={handleAddNote} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all">
                    发布到家庭墙
                </button>
            </div>
        </div>
      )}

      {/* Add Baby Modal (Missing) */}
      {showAddBaby && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                 <h3 className="font-bold text-lg mb-4">{editingBabyId ? '编辑宝宝信息' : '添加宝宝'}</h3>
                 <div className="space-y-4">
                     <div className="flex justify-center mb-4">
                         <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-4xl border-2 border-slate-100">
                             {babyForm.avatar}
                         </div>
                     </div>
                     <input type="text" placeholder="宝宝昵称" value={babyForm.name} onChange={e => setBabyForm({...babyForm, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none" />
                     <div>
                         <label className="text-xs font-bold text-slate-400 ml-1">出生日期 (用于计算月龄)</label>
                         <input type="date" value={babyForm.birthDate} onChange={e => setBabyForm({...babyForm, birthDate: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none" />
                     </div>
                     <div className="flex gap-3 pt-2">
                         <button onClick={handleSaveBaby} className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-200">保存</button>
                         <button onClick={() => setShowAddBaby(false)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold">取消</button>
                     </div>
                 </div>
            </div>
        </div>
      )}

      {/* Add Card Modal (Missing) */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="font-bold text-lg mb-4">{editingCardId ? '编辑信用卡' : '添加信用卡'}</h3>
                <div className="space-y-3">
                    <input placeholder="银行名称 (如: 招商银行)" value={newCardForm.bankName} onChange={e => setNewCardForm({...newCardForm, bankName: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    <input placeholder="卡片别名/卡种" value={newCardForm.cardName} onChange={e => setNewCardForm({...newCardForm, cardName: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    <div className="flex gap-3">
                        <input type="number" placeholder="信用额度" value={newCardForm.creditLimit} onChange={e => setNewCardForm({...newCardForm, creditLimit: e.target.value})} className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100" />
                        <input placeholder="尾号后4位" maxLength={4} value={newCardForm.last4Digits} onChange={e => setNewCardForm({...newCardForm, last4Digits: e.target.value})} className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    </div>
                    <div className="flex gap-3">
                         <div className="flex-1">
                             <label className="text-[10px] font-bold text-slate-400">账单日 (每月几号)</label>
                             <input type="number" value={newCardForm.billDay} onChange={e => setNewCardForm({...newCardForm, billDay: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                         </div>
                         <div className="flex-1">
                             <label className="text-[10px] font-bold text-slate-400">还款日 (每月几号)</label>
                             <input type="number" value={newCardForm.repaymentDay} onChange={e => setNewCardForm({...newCardForm, repaymentDay: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                         </div>
                    </div>
                    <button onClick={handleSaveCard} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg mt-2">保存卡片</button>
                    <button onClick={() => setShowAddCardModal(false)} className="w-full text-slate-400 text-xs font-bold py-2">取消</button>
                </div>
            </div>
        </div>
      )}

      {/* Add Loan Modal (Missing) */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="font-bold text-lg mb-4">{editingLoanId ? '编辑贷款' : '添加贷款账户'}</h3>
                <div className="space-y-3">
                    <input placeholder="贷款名称 (如: 房贷)" value={newLoanForm.name} onChange={e => setNewLoanForm({...newLoanForm, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    <input placeholder="放款机构" value={newLoanForm.bankName} onChange={e => setNewLoanForm({...newLoanForm, bankName: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    <input type="number" placeholder="贷款总额" value={newLoanForm.totalAmount} onChange={e => setNewLoanForm({...newLoanForm, totalAmount: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    <div className="flex gap-3">
                         <input type="number" placeholder="当前余额" value={newLoanForm.balance} onChange={e => setNewLoanForm({...newLoanForm, balance: e.target.value})} className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100" />
                         <input type="number" placeholder="月供金额" value={newLoanForm.monthlyRepayment} onChange={e => setNewLoanForm({...newLoanForm, monthlyRepayment: e.target.value})} className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-slate-400">每月还款日</label>
                         <input type="number" placeholder="日" value={newLoanForm.interestDay} onChange={e => setNewLoanForm({...newLoanForm, interestDay: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                    </div>
                    <button onClick={handleSaveLoan} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg mt-2">保存贷款</button>
                    <button onClick={() => setShowAddLoanModal(false)} className="w-full text-slate-400 text-xs font-bold py-2">取消</button>
                </div>
            </div>
        </div>
      )}

      {/* Add Goal Modal (Missing) */}
      {showAddGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                  <h3 className="font-bold text-lg mb-4">新建存钱目标</h3>
                  <div className="space-y-4">
                      <div className="flex justify-center text-4xl mb-2">{newGoalForm.icon}</div>
                      <input placeholder="目标名称 (如: 买车)" value={newGoalForm.name} onChange={e => setNewGoalForm({...newGoalForm, name: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                      <input type="number" placeholder="目标金额" value={newGoalForm.targetAmount} onChange={e => setNewGoalForm({...newGoalForm, targetAmount: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100" />
                      <button onClick={handleAddGoal} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg">创建目标</button>
                      <button onClick={() => setShowAddGoalModal(false)} className="w-full text-slate-400 text-xs font-bold py-2">取消</button>
                  </div>
              </div>
          </div>
      )}

      {/* Deposit Modal (Missing) */}
      {showDepositModal && selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 text-center">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">{selectedGoal.icon}</div>
                  <h3 className="font-bold text-lg">为 "{selectedGoal.name}" 存入</h3>
                  <p className="text-xs text-slate-400 mb-6">离目标还差 ¥{(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}</p>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-2 mb-6">
                      <span className="font-bold text-2xl">¥</span>
                      <input type="number" autoFocus placeholder="0" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="bg-transparent text-3xl font-bold outline-none w-full" />
                  </div>
                  
                  <button onClick={handleDeposit} className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-200">存入储蓄金</button>
                  <button onClick={() => setShowDepositModal(false)} className="w-full text-slate-400 text-xs font-bold py-4">取消</button>
              </div>
          </div>
      )}

      {/* Goal Delete Confirmation (NEW) */}
      {goalToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">删除 "{goalToDelete.name}"?</h3>
                  <p className="text-xs text-slate-500 mb-6">删除后，已存入的资金记录不会消失，但目标进度将移除。</p>
                  <div className="flex gap-3">
                      <button onClick={confirmDeleteGoal} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200">确认删除</button>
                      <button onClick={() => setGoalToDelete(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold">取消</button>
                  </div>
              </div>
          </div>
      )}

      {/* Generic Delete Modals */}
      {(babyToDelete || memberToDelete || cardToDelete || loanToDelete || noteToDelete) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6">确定要删除吗？</h3>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => {
                            if (babyToDelete) confirmDeleteBaby();
                            if (memberToDelete) confirmDeleteMember();
                            if (cardToDelete) confirmDeleteCard();
                            if (loanToDelete) confirmDeleteLoan();
                            if (noteToDelete) confirmDeleteNote();
                        }} 
                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg"
                      >
                          确认
                      </button>
                      <button 
                        onClick={() => {
                            setBabyToDelete(null); setMemberToDelete(null); 
                            setCardToDelete(null); setLoanToDelete(null); setNoteToDelete(null);
                        }} 
                        className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-bold"
                      >
                          取消
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}