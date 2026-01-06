
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AppTab, Transaction, User, TransactionType, Category, 
  Baby, CreditCardAccount, LoanAccount, SavingsGoal, FamilyNote
} from './types';
import { 
  MOCK_USERS, MOCK_BABIES, INITIAL_TRANSACTIONS, 
  MOCK_CREDIT_CARDS, MOCK_LOANS, MOCK_GOALS 
} from './constants';
import { TransactionCard } from './components/TransactionCard';
import { StatsView } from './components/StatsView';
import { VoiceAssistant } from './components/VoiceAssistant';
import { LandingPage } from './components/LandingPage';
import { 
  Home, PieChart, Users, User as UserIcon, Wallet, 
  X, CreditCard,  
  Baby as BabyIcon, Sparkles, Share2, Landmark, 
  Smile, Plus, ChevronRight, Trash2, 
  BarChart3, ChevronLeft, Target, 
  Trophy, Zap, CheckCircle2, PiggyBank, Pencil, CalendarDays, ArrowLeftRight,
  Eye, EyeOff, QrCode, ScanLine, TrendingUp, TrendingDown,
  AlertCircle, Bell, Edit3, CalendarClock, Check, Clock,
  StickyNote, MessageSquare, Heart, PartyPopper
} from './components/Icons';

const useStickyState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
};

// --- Confetti Component ---
const ConfettiEffect = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-5%`,
                        animationDuration: `${Math.random() * 3 + 2}s`,
                        animationDelay: `${Math.random() * 2}s`,
                    }}
                >
                    <div
                        className={`w-3 h-3 transform rotate-45 ${
                            ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500'][
                                Math.floor(Math.random() * 5)
                            ]
                        }`}
                        style={{
                            transform: `rotate(${Math.random() * 360}deg)`,
                        }}
                    ></div>
                </div>
            ))}
             <style dangerouslySetInnerHTML={{__html: `
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                .animate-fall { animation-name: fall; animation-timing-function: linear; }
            `}} />
        </div>
    );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);

  // Data States
  const [users, setUsers] = useStickyState<User[]>('gf_users', MOCK_USERS);
  const [babies, setBabies] = useStickyState<Baby[]>('gf_babies', MOCK_BABIES);
  const [transactions, setTransactions] = useStickyState<Transaction[]>('gf_transactions', INITIAL_TRANSACTIONS);
  const [creditCards, setCreditCards] = useStickyState<CreditCardAccount[]>('gf_cards', MOCK_CREDIT_CARDS);
  const [loans, setLoans] = useStickyState<LoanAccount[]>('gf_loans', MOCK_LOANS);
  const [goals, setGoals] = useStickyState<SavingsGoal[]>('gf_goals', MOCK_GOALS);
  
  // New: Family Notes State
  const [familyNotes, setFamilyNotes] = useStickyState<FamilyNote[]>('gf_notes', [
      { id: 'n1', userId: 'user_2', userName: 'Sarah', userAvatar: 'https://picsum.photos/101/101', content: '记得给米粒买尿不湿~', emoji: '👶', color: 'bg-yellow-100', createdAt: new Date().toISOString() },
      { id: 'n2', userId: 'user_1', userName: 'Alex', userAvatar: 'https://picsum.photos/100/100', content: '工资已上交，请查收! ❤️', emoji: '💰', color: 'bg-green-100', createdAt: new Date().toISOString() }
  ]);

  // View States
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [activeModule, setActiveModule] = useState<'NONE' | 'DEBT' | 'BABY_LIST' | 'ASSETS' | 'PAYMENT' | 'GOALS'>('NONE');
  const [selectedDebtGroup, setSelectedDebtGroup] = useState<'CREDIT' | 'BANK' | 'PRIVATE' | null>(null);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  
  // UI Effects
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Debt Module Sub-tabs
  const [debtTab, setDebtTab] = useState<'CARDS' | 'LOANS' | 'BILLS'>('CARDS');

  // Privacy Mode State
  const [hideAmount, setHideAmount] = useStickyState<boolean>('gf_privacy_mode', false);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false); // New

  // Transaction Detail & Edit States
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  // Editing States for Cards/Loans
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({
    amount: '', type: TransactionType.EXPENSE, category: Category.FOOD,
    note: '', date: new Date().toISOString().split('T')[0], dueDate: '', babyId: '', cardId: '', loanId: ''
  });
  const [newCardForm, setNewCardForm] = useState({ bankName: '', cardName: '', creditLimit: '', billDay: '', repaymentDay: '', last4Digits: '' });
  const [newLoanForm, setNewLoanForm] = useState({ name: '', bankName: '', totalAmount: '', balance: '', interestDay: '', monthlyRepayment: '', category: Category.MORTGAGE });
  const [newGoalForm, setNewGoalForm] = useState({ name: '', targetAmount: '', icon: '🌟' });
  const [inviteForm, setInviteForm] = useState({ name: '', role: 'member' });
  const [newBabyName, setNewBabyName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [newNoteForm, setNewNoteForm] = useState({ content: '', emoji: '📝', color: 'bg-yellow-100' }); // New

  // Delete Confirmation States
  const [babyToDelete, setBabyToDelete] = useState<Baby | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCardAccount | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<LoanAccount | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<FamilyNote | null>(null); // New
  
  const [familyMode, setFamilyMode] = useState(false);

  // --- Derived Data ---
  const visibleTransactions = transactions;

  const income = useMemo(() => 
    visibleTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0),
  [visibleTransactions]);

  const expense = useMemo(() => 
    visibleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0),
  [visibleTransactions]);

  const cashBalance = useMemo(() => income - expense, [income, expense]);

  // Gamification: Budget Health Bar Logic
  const monthlyBudget = 20000; // Mock budget
  const budgetHealth = Math.max(0, Math.min(100, ((monthlyBudget - expense) / monthlyBudget) * 100));

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

    // Helper to calculate days diff, handling month wrap
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


  const displayAmount = (amount: number) => {
    return hideAmount ? '****' : `¥${amount.toLocaleString()}`;
  };

  // --- Handlers ---

  const handleLogin = (name: string) => {
    const newUser: User = { id: `user_${Date.now()}`, name, avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`, isFamilyAdmin: true, isPremium: false };
    setUsers([newUser, ...users]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
  };

  const upgradeToPremium = () => {
    setCurrentUser({ ...currentUser, isPremium: true });
    setActiveModule('NONE');
    alert("恭喜！支付成功，已升级为专业版。");
  };

  const toggleMemberPermission = (userId: string) => {
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

  const openTransactionDetail = (t: Transaction) => {
      setSelectedTransaction(t);
      setIsEditingTransaction(false);
      setEditForm({ ...t, date: t.date.split('T')[0] });
  };

  const handleSaveTransactionEdit = () => {
      if (!selectedTransaction || !editForm.amount) return;
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
      if (!selectedTransaction) return;
      setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
      setSelectedTransaction(null);
  };
  
  const handleDirectDeleteTransaction = () => {
      if (!transactionToDelete) return;
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
      setTransactionToDelete(null);
  };

  const openAddCard = () => {
      setNewCardForm({ bankName: '', cardName: '', creditLimit: '', billDay: '', repaymentDay: '', last4Digits: '' });
      setEditingCardId(null);
      setShowAddCardModal(true);
  };

  const openEditCard = (card: CreditCardAccount) => {
      setNewCardForm({
          bankName: card.bankName,
          cardName: card.cardName,
          creditLimit: card.creditLimit.toString(),
          billDay: card.billDay.toString(),
          repaymentDay: card.repaymentDay.toString(),
          last4Digits: card.last4Digits
      });
      setEditingCardId(card.id);
      setShowAddCardModal(true);
  };

  const handleSaveCard = () => {
    const cardData = {
        bankName: newCardForm.bankName,
        cardName: newCardForm.cardName,
        creditLimit: parseFloat(newCardForm.creditLimit),
        billDay: parseInt(newCardForm.billDay),
        repaymentDay: parseInt(newCardForm.repaymentDay),
        last4Digits: newCardForm.last4Digits,
        theme: 'from-indigo-600 to-blue-700'
    };
    if (editingCardId) {
        setCreditCards(creditCards.map(c => c.id === editingCardId ? { ...c, ...cardData } : c));
    } else {
        const newCard: CreditCardAccount = { id: `card_${Date.now()}`, balance: 0, ...cardData };
        setCreditCards([...creditCards, newCard]);
    }
    setShowAddCardModal(false);
  };

  const openAddLoan = () => {
      setNewLoanForm({ name: '', bankName: '', totalAmount: '', balance: '', interestDay: '', monthlyRepayment: '', category: Category.MORTGAGE });
      setEditingLoanId(null);
      setShowAddLoanModal(true);
  };

  const openEditLoan = (loan: LoanAccount) => {
      setNewLoanForm({
          name: loan.name,
          bankName: loan.bankName,
          totalAmount: loan.totalAmount.toString(),
          balance: loan.balance.toString(),
          interestDay: loan.interestDay.toString(),
          monthlyRepayment: loan.monthlyRepayment.toString(),
          category: loan.category
      });
      setEditingLoanId(loan.id);
      setShowAddLoanModal(true);
  };

  const handleSaveLoan = () => {
      const loanData = {
          name: newLoanForm.name,
          bankName: newLoanForm.bankName,
          totalAmount: parseFloat(newLoanForm.totalAmount),
          balance: parseFloat(newLoanForm.balance),
          interestDay: parseInt(newLoanForm.interestDay),
          monthlyRepayment: parseFloat(newLoanForm.monthlyRepayment),
          category: newLoanForm.category as Category
      };
      if (editingLoanId) {
          setLoans(loans.map(l => l.id === editingLoanId ? { ...l, ...loanData } : l));
      } else {
          const newLoan: LoanAccount = { id: `loan_${Date.now()}`, ...loanData };
          setLoans([...loans, newLoan]);
      }
      setShowAddLoanModal(false);
  };

  const handleAddMember = () => {
    if (!inviteForm.name) return;
    const newUser: User = {
        id: `user_${Date.now()}`,
        name: inviteForm.name,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${inviteForm.name}`,
        isFamilyAdmin: inviteForm.role === 'admin',
        isPremium: false,
        permissions: { canView: true, canEdit: true }
    };
    setUsers([...users, newUser]);
    setShowInviteModal(false);
    setInviteForm({ name: '', role: 'member' });
  };

  const handleAddBaby = () => {
      if (!newBabyName) return;
      const newBaby: Baby = { id: `baby_${Date.now()}`, name: newBabyName, avatar: '👶' };
      setBabies([...babies, newBaby]);
      setNewBabyName('');
      setShowAddBaby(false);
  };
  
  const handleAddGoal = () => {
    if (!newGoalForm.name || !newGoalForm.targetAmount) return;
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      name: newGoalForm.name,
      targetAmount: parseFloat(newGoalForm.targetAmount),
      currentAmount: 0,
      icon: newGoalForm.icon,
      color: 'from-pink-500 to-rose-500'
    };
    setGoals([...goals, newGoal]);
    setNewGoalForm({ name: '', targetAmount: '', icon: '🌟' });
    setShowAddGoalModal(false);
  };

  const handleAddNote = () => {
      if (!newNoteForm.content) return;
      const newNote: FamilyNote = {
          id: `note_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          content: newNoteForm.content,
          emoji: newNoteForm.emoji,
          color: newNoteForm.color,
          createdAt: new Date().toISOString()
      };
      setFamilyNotes([newNote, ...familyNotes]);
      setShowAddNoteModal(false);
      setNewNoteForm({ content: '', emoji: '📝', color: 'bg-yellow-100' });
  };

  const handleDeposit = () => {
    if (!selectedGoal || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    const updatedGoals = goals.map(g => 
      g.id === selectedGoal.id ? { ...g, currentAmount: g.currentAmount + amount } : g
    );
    setGoals(updatedGoals);

    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: amount,
      type: TransactionType.EXPENSE,
      category: Category.INVESTMENT,
      date: new Date().toISOString(),
      note: `存入心愿: ${selectedGoal.name}`,
      userId: currentUser.id
    };
    setTransactions([newTx, ...transactions]);
    setDepositAmount('');
    setShowDepositModal(false);
    setSelectedGoal(null);
    
    // Trigger Confetti
    triggerConfetti();
  };
  
  const openDebtAddModal = (type: TransactionType) => {
      setAddForm({
          ...addForm,
          type: type,
          category: type === TransactionType.DEBT ? Category.BORROWING : Category.CREDIT_CARD,
          amount: '',
          note: type === TransactionType.DEBT ? '借入一笔' : '偿还账单'
      });
      setShowAddModal(true);
  };
  
  const handleQuickPay = (data: any) => {
      setAddForm({
          ...addForm,
          type: data.type,
          category: data.category,
          amount: data.amount,
          note: data.note,
          cardId: data.cardId || '',
          loanId: data.loanId || '',
      });
      setShowAddModal(true);
  };
  
  const triggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
  };

  const confirmDeleteMember = () => { if (memberToDelete) { setUsers(users.filter(u => u.id !== memberToDelete.id)); setMemberToDelete(null); } };
  const confirmDeleteBaby = () => { if (babyToDelete) { setBabies(babies.filter(b => b.id !== babyToDelete.id)); setBabyToDelete(null); } };
  const confirmDeleteGoal = () => { if (goalToDelete) { setGoals(goals.filter(g => g.id !== goalToDelete.id)); setGoalToDelete(null); } };
  const confirmDeleteCard = () => { if (cardToDelete) { setCreditCards(creditCards.filter(c => c.id !== cardToDelete.id)); setCardToDelete(null); } };
  const confirmDeleteLoan = () => { if (loanToDelete) { setLoans(loans.filter(l => l.id !== loanToDelete.id)); setLoanToDelete(null); } };
  const confirmDeleteNote = () => { if (noteToDelete) { setFamilyNotes(familyNotes.filter(n => n.id !== noteToDelete.id)); setNoteToDelete(null); } };

  // --- Renders ---

  const renderBabyDetail = () => (
    <div className="p-6 h-full flex flex-col bg-white">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setSelectedBaby(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><ChevronLeft/></button>
        <h2 className="text-xl font-bold">{selectedBaby?.avatar} {selectedBaby?.name} 的账本</h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-24">
        {transactions.filter(t => t.babyId === selectedBaby?.id).map(t => (
          <TransactionCard key={t.id} transaction={t} onClick={openTransactionDetail} hideAmount={hideAmount} />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {babies.map(b => (
          <div key={b.id} onClick={() => setSelectedBaby(b)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center cursor-pointer hover:shadow-md transition-all">
            <div className="text-4xl mb-2">{b.avatar}</div>
            <p className="font-bold">{b.name}</p>
          </div>
        ))}
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
        <button onClick={() => setShowAddGoalModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"><Plus size={16}/> 新建目标</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
           const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
           return (
             <div key={goal.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group relative overflow-hidden transition-all hover:shadow-lg">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${goal.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150 group-hover:opacity-20`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{goal.icon}</div>
                   <button onClick={() => setGoalToDelete(goal)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
                
                <div className="relative z-10">
                   <h3 className="text-lg font-bold text-slate-800 mb-1">{goal.name}</h3>
                   <div className="flex justify-between items-end mb-4">
                      <span className="text-2xl font-black text-slate-900">{hideAmount ? '****' : `¥${goal.currentAmount.toLocaleString()}`}</span>
                      <span className="text-xs font-bold text-slate-400 mb-1">目标 ¥{goal.targetAmount.toLocaleString()}</span>
                   </div>
                   
                   <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                      <div className={`h-full rounded-full bg-gradient-to-r ${goal.color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                   </div>
                   
                   <button 
                      onClick={() => { setSelectedGoal(goal); setShowDepositModal(true); }}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-800"
                   >
                      <PiggyBank size={16} /> 存入一笔
                   </button>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );

  const renderDebtView = () => {
    const debtTransactions = transactions.filter(t => t.type === TransactionType.DEBT || t.type === TransactionType.REPAYMENT);
    
    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 pb-32">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setActiveModule('NONE')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50"><ChevronLeft/></button>
            <h2 className="text-2xl font-bold">负债管理</h2>
          </div>
          {/* Sub Navigation */}
          <div className="bg-white p-1.5 rounded-2xl flex shadow-sm border border-slate-100">
              <button onClick={() => setDebtTab('CARDS')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${debtTab === 'CARDS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                  <CreditCard size={18}/> 信用卡
              </button>
              <button onClick={() => setDebtTab('LOANS')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${debtTab === 'LOANS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                  <Landmark size={18}/> 贷款
              </button>
              <button onClick={() => setDebtTab('BILLS')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${debtTab === 'BILLS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                  <ArrowLeftRight size={18}/> 账单流水
              </button>
          </div>

          {/* Tab Content */}
          {debtTab === 'CARDS' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                   <div className="flex justify-between items-center px-2">
                       <h3 className="font-bold text-slate-800">信用卡列表 ({creditCards.length})</h3>
                       <button onClick={openAddCard} className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"><Plus size={14}/> 添加卡片</button>
                   </div>
                   <div className="space-y-4">
                       {creditCards.map(c => (
                           <div key={c.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                   <button onClick={(e) => { e.stopPropagation(); openEditCard(c); }} className="p-2 bg-white text-indigo-600 rounded-full shadow-sm hover:bg-indigo-50"><Pencil size={16}/></button>
                                   <button onClick={(e) => { e.stopPropagation(); setCardToDelete(c); }} className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={16}/></button>
                               </div>
                               <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${c.theme}`}></div>
                               <div className="pl-4">
                                   <div className="flex justify-between items-start mb-4">
                                       <div>
                                           <h4 className="font-bold text-lg text-slate-800">{c.bankName}</h4>
                                           <p className="text-xs text-slate-400">{c.cardName} (尾号 {c.last4Digits})</p>
                                       </div>
                                       <CreditCard className="text-slate-200" size={32}/>
                                   </div>
                                   <div className="flex justify-between items-end">
                                       <div>
                                           <p className="text-xs text-slate-400 font-bold mb-1">信用额度</p>
                                           <p className="text-2xl font-black text-slate-800">{displayAmount(c.creditLimit)}</p>
                                       </div>
                                       <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md mb-1"><CalendarClock size={10} className="inline mr-1"/>账单日 {c.billDay}号 / 还款日 {c.repaymentDay}号</p>
                                            <p className="text-xs font-bold text-indigo-600">剩余应还: {displayAmount(c.balance || 0)}</p>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
          )}

          {debtTab === 'LOANS' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex justify-between items-center px-2">
                       <h3 className="font-bold text-slate-800">贷款账户 ({loans.length})</h3>
                       <button onClick={openAddLoan} className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus size={14}/> 添加贷款</button>
                   </div>
                   <div className="space-y-4">
                       {loans.map(l => (
                           <div key={l.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                               <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                   <button onClick={(e) => { e.stopPropagation(); openEditLoan(l); }} className="p-2 bg-slate-50 text-blue-600 rounded-full hover:bg-blue-50"><Pencil size={16}/></button>
                                   <button onClick={(e) => { e.stopPropagation(); setLoanToDelete(l); }} className="p-2 bg-slate-50 text-red-500 rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                               </div>
                               <div className="flex items-center gap-4 mb-4">
                                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Landmark size={24}/></div>
                                   <div>
                                       <h4 className="font-bold text-lg text-slate-800">{l.name}</h4>
                                       <p className="text-xs text-slate-400 font-bold uppercase">{l.bankName} · {l.category}</p>
                                   </div>
                               </div>
                               <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                                   <div>
                                       <p className="text-xs text-slate-400 font-bold mb-1">当前余额</p>
                                       <p className="text-xl font-bold text-slate-800">{displayAmount(l.balance)}</p>
                                   </div>
                                   <div className="text-right">
                                       <p className="text-xs text-slate-400 font-bold mb-1">每月{l.interestDay}号还款</p>
                                       <p className="text-sm font-bold text-blue-600">月供: {displayAmount(l.monthlyRepayment)}</p>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
          )}

          {debtTab === 'BILLS' && (
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">账单流水</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => openDebtAddModal(TransactionType.DEBT)} 
                            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                        >
                            <Plus size={14}/> 记借入
                        </button>
                        <button 
                            onClick={() => openDebtAddModal(TransactionType.REPAYMENT)} 
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                        >
                            <Plus size={14}/> 记还款
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    {debtTransactions.length > 0 ? (
                        debtTransactions.map(t => (
                            <TransactionCard 
                                key={t.id} 
                                transaction={t} 
                                onClick={openTransactionDetail}
                                onDelete={(t) => setTransactionToDelete(t)}
                                hideAmount={hideAmount} 
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3"><Smile size={32} className="opacity-20"/></div>
                            <p className="text-xs">暂无借贷或还款记录</p>
                        </div>
                    )}
                </div>
             </div>
          )}
        </div>
    );
  };

  const renderAssetManagement = () => (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveModule('NONE')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50"><ChevronLeft/></button>
        <h2 className="text-2xl font-bold">我的钱包</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2"><CreditCard size={18}/> 信用卡</h3>
            <button onClick={() => setShowAddCardModal(true)} className="text-xs font-bold text-indigo-600">添加</button>
          </div>
          <div className="space-y-3">
            {creditCards.map(c => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group">
                <div><p className="font-bold">{c.bankName}</p><p className="text-xs text-slate-400">尾号 {c.last4Digits}</p></div>
                <p className="font-bold">{displayAmount(c.creditLimit)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2"><Landmark size={18}/> 贷款账户</h3>
            <button onClick={() => setShowAddLoanModal(true)} className="text-xs font-bold text-blue-600">添加</button>
          </div>
          <div className="space-y-3">
            {loans.map(l => (
              <div key={l.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <div><p className="font-bold">{l.name}</p><p className="text-xs text-slate-400">{l.bankName}</p></div>
                <p className="font-bold">{displayAmount(l.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentPage = () => (
    <div className="p-10 max-w-xl mx-auto text-center space-y-8">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto"><Trophy size={40}/></div>
      <h2 className="text-3xl font-bold">解锁每日记专业版</h2>
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl">
        <p className="text-4xl font-black mb-6">¥99 <span className="text-sm text-slate-400 font-normal">/ 终身</span></p>
        <ul className="text-left space-y-4 mb-8">
          <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> 无限制家庭成员共享</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> AI 语音深度识别</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> 资产趋势高级报表</li>
        </ul>
        <button onClick={upgradeToPremium} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">立即开通</button>
        <button onClick={() => setActiveModule('NONE')} className="mt-4 text-slate-400 text-sm">先用着免费版</button>
      </div>
    </div>
  );

  const renderFamilyView = () => (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-32">
         <h2 className="text-3xl font-bold text-slate-800">家庭空间</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 text-lg">家庭成员</h3>
                     <button onClick={() => setShowInviteModal(true)} className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">添加成员 +</button>
                 </div>
                 <div className="space-y-3">
                    {users.map((u) => {
                        const isCurrentUser = u.id === currentUser.id;
                        const canManage = currentUser.isFamilyAdmin && !isCurrentUser;
                        return (
                            <div key={u.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${isCurrentUser ? 'bg-indigo-50/50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                                <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold ${isCurrentUser ? 'text-indigo-900' : 'text-slate-800'}`}>{u.name}</p>
                                        {u.isFamilyAdmin && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">管理员</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-slate-400 font-medium">{isCurrentUser ? '当前登录' : (u.permissions?.canEdit ? '可编辑账本' : '仅查看权限')}</p>
                                        {canManage && (
                                            <button 
                                                onClick={() => toggleMemberPermission(u.id)}
                                                className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                                            >
                                                {u.permissions?.canEdit ? '设为只读' : '允许编辑'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {currentUser.isFamilyAdmin && !isCurrentUser && (
                                    <button onClick={() => setMemberToDelete(u)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16} /></button>
                                )}
                            </div>
                        )
                    })}
                 </div>
             </div>
             {/* ... existing family content ... */}
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
                   <button onClick={() => setHideAmount(!hideAmount)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm">
                      {hideAmount ? <EyeOff size={18}/> : <Eye size={18}/>}
                   </button>
                   <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200/50">
                       <Plus size={18}/> <span className="hidden sm:inline">记一笔</span>
                   </button>
                </div>
            </div>
            
            <div className="px-6 md:px-10 space-y-8">
                
                {/* 1. Family Sticky Notes Widget */}
                <div>
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <StickyNote size={14} className="text-yellow-500"/> 家庭便利贴
                         </h3>
                         <button onClick={() => setShowAddNoteModal(true)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100">+ 贴一张</button>
                     </div>
                     <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar snap-x">
                         {familyNotes.map(note => (
                             <div key={note.id} className={`min-w-[200px] ${note.color} p-4 rounded-2xl shadow-sm relative group snap-start border border-black/5 transform rotate-1 hover:rotate-0 transition-all`}>
                                 <button onClick={() => setNoteToDelete(note)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"><X size={14}/></button>
                                 <div className="flex items-center gap-2 mb-2">
                                     <img src={note.userAvatar} className="w-6 h-6 rounded-full border border-white" />
                                     <span className="text-xs font-bold text-slate-700">{note.userName}</span>
                                     <span className="ml-auto text-lg">{note.emoji}</span>
                                 </div>
                                 <p className="text-sm font-medium text-slate-800 leading-snug">{note.content}</p>
                                 <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(note.createdAt).toLocaleDateString()}</p>
                             </div>
                         ))}
                         {/* Empty State / Add Placeholder */}
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
                                       {alert.actionData ? (
                                           <button 
                                                onClick={() => handleQuickPay(alert.actionData)}
                                                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-95"
                                           >
                                               <Check size={14} /> 立即还款
                                           </button>
                                       ) : (
                                           <button className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold cursor-default border border-slate-100">
                                               等待出账
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
                          <h2 className="text-4xl font-bold tracking-tight">{displayAmount(cashBalance)}</h2>
                          <p className="text-xs text-indigo-200 mt-1">剩余预算 (月额度 ¥20,000)</p>
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
                             <p className="font-bold text-lg flex items-center gap-1"><TrendingUp size={14}/> {displayAmount(income)}</p>
                          </div>
                          <div>
                             <p className="text-indigo-200 text-[10px] font-bold mb-1">本月支出</p>
                             <p className="font-bold text-lg flex items-center gap-1"><TrendingDown size={14}/> {displayAmount(expense)}</p>
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
                        <h3 onClick={() => setActiveModule('GOALS')} className="font-bold text-lg text-slate-800 flex items-center gap-2 cursor-pointer group hover:text-indigo-600 transition-colors">
                            我的心愿 <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                        </h3>
                        <button onClick={() => setShowAddGoalModal(true)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                            + 添加
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar snap-x">
                        {goals.map(goal => {
                            const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                            return (
                                <div key={goal.id} onClick={() => { setSelectedGoal(goal); setShowDepositModal(true); }} className="min-w-[160px] w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-shrink-0 snap-start relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setGoalToDelete(goal); 
                                        }} 
                                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"
                                    >
                                        <Trash2 size={12} />
                                    </button>
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
                        <div onClick={() => setShowAddGoalModal(true)} className="min-w-[100px] bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                            <Plus size={24} />
                            <span className="text-xs font-bold">新目标</span>
                        </div>
                    </div>
                </div>

                {/* Debt & Baby Section - Detailed Split View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Unified Debt Card */}
                    <div onClick={() => { setActiveModule('DEBT'); setDebtTab('CARDS'); }} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden group">
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
                    <div onClick={() => setActiveModule('BABY_LIST')} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden flex flex-col justify-between">
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
                {transactions.slice(0, 5).map(t => <TransactionCard key={t.id} transaction={t} user={users.find(u => u.id === t.userId)} onClick={openTransactionDetail} hideAmount={hideAmount} />)}
                </div>
            </div>
          </div>
        );
      case AppTab.STATS: return <StatsView transactions={visibleTransactions} />;
      case AppTab.AI_ASSISTANT: return <VoiceAssistant onAddTransaction={(data) => setTransactions([{...data, id: Date.now().toString(), userId: currentUser.id}, ...transactions])} currentUserId={currentUser.id} />;
      case AppTab.FAMILY: return renderFamilyView();
      case AppTab.PROFILE: return (
          <div className="p-10 max-w-2xl mx-auto space-y-10">
            <div className="flex items-center gap-6">
              <img src={currentUser.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-xl" />
              <div>
                <h2 className="text-3xl font-bold">{currentUser.name} {currentUser.isPremium && "👑"}</h2>
                <p className="text-slate-400">{currentUser.isFamilyAdmin ? "家庭管理员" : "成员"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setActiveModule('ASSETS')} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-all group">
                <span className="font-bold flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Wallet size={20}/></div> 我的钱包 (卡片/贷款)</span>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setActiveModule('PAYMENT')} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-all group">
                <span className="font-bold flex items-center gap-3"><div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Zap size={20}/></div> 会员权益中心</span>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        );
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

      {/* 1. Transaction Detail & Edit Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[101] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setSelectedTransaction(null)} className="absolute top-6 right-6 text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            
            {!isEditingTransaction ? (
                // View Mode
                <>
                    <button onClick={() => setIsEditingTransaction(true)} className="absolute top-6 right-16 text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors" title="编辑"><Pencil size={20}/></button>
                    <div className="text-center space-y-2 mb-8 mt-4">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-xs uppercase mb-2">
                          {selectedTransaction.type === TransactionType.EXPENSE ? '支出' : selectedTransaction.type === TransactionType.INCOME ? '收入' : '其他'}
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">{selectedTransaction.category}</p>
                      <h2 className="text-4xl font-black text-slate-900">¥{selectedTransaction.amount.toLocaleString()}</h2>
                      <p className="text-base font-medium text-slate-600 mt-2 bg-slate-50 py-2 px-4 rounded-xl inline-block">{selectedTransaction.note}</p>
                    </div>
                    <div className="space-y-4 bg-slate-50 p-6 rounded-[1.5rem] text-sm mb-6">
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-bold flex items-center gap-2"><CalendarDays size={14}/> 时间</span><span className="font-bold text-slate-700">{new Date(selectedTransaction.date).toLocaleDateString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400 font-bold flex items-center gap-2"><ArrowLeftRight size={14}/> 流水号</span><span className="font-mono text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">{selectedTransaction.id.slice(-8)}</span></div>
                    </div>
                    <button onClick={handleDeleteTransaction} className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2"><Trash2 size={18}/> 删除此笔交易</button>
                </>
            ) : (
                // Edit Mode
                <div className="space-y-5 mt-2">
                    <h3 className="text-xl font-bold text-center mb-6">编辑交易</h3>
                    
                    {/* Amount Input */}
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-300">¥</span>
                        <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value as any})} className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>

                    {/* Category Select */}
                    <select value={editForm.category as string} onChange={e => setEditForm({...editForm, category: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-700 focus:outline-none">
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Type Select */}
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                        {[TransactionType.EXPENSE, TransactionType.INCOME].map(type => (
                            <button key={type} onClick={() => setEditForm({...editForm, type})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${editForm.type === type ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
                                {type === TransactionType.EXPENSE ? '支出' : '收入'}
                            </button>
                        ))}
                    </div>

                    {/* Date & Note */}
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={editForm.date as string} onChange={e => setEditForm({...editForm, date: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600" />
                        <input type="text" value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} className="p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600" placeholder="备注" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsEditingTransaction(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200">取消</button>
                        <button onClick={handleSaveTransactionEdit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">保存</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">记一笔</h3><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button></div>
            <div className="space-y-6">
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">¥</span><input type="number" className="w-full pl-10 pr-4 py-6 bg-slate-50 rounded-2xl text-4xl font-bold focus:outline-none" placeholder="0.00" value={addForm.amount} onChange={e => setAddForm({...addForm, amount: e.target.value})} autoFocus /></div>
              <div className="grid grid-cols-2 gap-4"><input type="date" className="p-4 bg-slate-50 rounded-xl font-bold text-sm" value={addForm.date} onChange={e => setAddForm({...addForm, date: e.target.value})} /><input type="text" placeholder="备注" className="p-4 bg-slate-50 rounded-xl font-bold text-sm" value={addForm.note} onChange={e => setAddForm({...addForm, note: e.target.value})} /></div>
              <button onClick={() => { if(!addForm.amount)return; setTransactions([{id: Date.now().toString(), amount: parseFloat(addForm.amount), type: addForm.type, category: addForm.category, date: addForm.date, note: addForm.note, userId: currentUser.id}, ...transactions]); setShowAddModal(false); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800">保存记录</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Helper Modals */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
             <h3 className="text-xl font-bold mb-6">邀请家庭成员</h3>
             <div className="space-y-4">
               <input type="text" placeholder="成员昵称" className="w-full p-4 bg-slate-50 rounded-xl font-bold" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
               <div className="flex gap-2">
                 <button onClick={() => setInviteForm({...inviteForm, role: 'member'})} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${inviteForm.role === 'member' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-400'}`}>成员</button>
                 <button onClick={() => setInviteForm({...inviteForm, role: 'admin'})} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${inviteForm.role === 'admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-400'}`}>管理员</button>
               </div>
               <div className="flex gap-4 mt-2">
                 <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                 <button onClick={handleAddMember} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">发送邀请</button>
               </div>
             </div>
          </div>
        </div>
      )}

      {(babyToDelete || memberToDelete || goalToDelete || transactionToDelete || cardToDelete || loanToDelete || noteToDelete) && (
        <div className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
             <h3 className="text-xl font-bold mb-2">确认删除?</h3>
             <p className="text-slate-400 mb-6 text-sm">此操作无法撤销。
                {goalToDelete ? '该心愿目标将被移除。' : 
                 transactionToDelete ? '该笔账单记录将被永久删除。' : 
                 cardToDelete ? '该信用卡将被删除，历史账单保留。' :
                 loanToDelete ? '该贷款账户将被删除。' :
                 noteToDelete ? '该便利贴将被移除。' :
                 '数据可能丢失。'}
             </p>
             <div className="flex gap-4">
                 <button onClick={() => { setBabyToDelete(null); setMemberToDelete(null); setGoalToDelete(null); setTransactionToDelete(null); setCardToDelete(null); setLoanToDelete(null); setNoteToDelete(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                 <button onClick={() => { 
                     if(babyToDelete) confirmDeleteBaby(); 
                     else if(memberToDelete) confirmDeleteMember(); 
                     else if(goalToDelete) confirmDeleteGoal(); 
                     else if(transactionToDelete) handleDirectDeleteTransaction();
                     else if(cardToDelete) confirmDeleteCard();
                     else if(loanToDelete) confirmDeleteLoan();
                     else if(noteToDelete) confirmDeleteNote();
                  }} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200">删除</button>
             </div>
          </div>
        </div>
      )}
      
      {showAddGoalModal && (
          <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-6">许下一个心愿</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                     <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">{newGoalForm.icon}</div>
                     <input type="text" placeholder="心愿名称 (如: 旅游)" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={newGoalForm.name} onChange={e => setNewGoalForm({...newGoalForm, name: e.target.value})} autoFocus />
                  </div>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                      <input type="number" placeholder="目标金额" className="w-full pl-8 p-4 bg-slate-50 rounded-xl font-bold" value={newGoalForm.targetAmount} onChange={e => setNewGoalForm({...newGoalForm, targetAmount: e.target.value})} />
                  </div>
                  <div className="flex gap-4 mt-2">
                     <button onClick={() => setShowAddGoalModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                     <button onClick={handleAddGoal} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">创建心愿</button>
                  </div>
                </div>
             </div>
          </div>
      )}
      
      {showDepositModal && selectedGoal && (
          <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <p className="text-slate-400 font-bold text-xs uppercase mb-1">存入心愿资金</p>
                    <h3 className="text-xl font-bold">{selectedGoal.name}</h3>
                </div>
                <div className="space-y-6">
                   <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">¥</span>
                       <input type="number" className="w-full pl-10 pr-4 py-6 bg-slate-50 rounded-2xl text-4xl font-bold focus:outline-none" placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} autoFocus />
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                      <button onClick={handleDeposit} className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-200">确认存入</button>
                   </div>
                   <p className="text-center text-xs text-slate-400">* 将自动记录一笔理财支出</p>
                </div>
             </div>
          </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-6">贴一张便利贴</h3>
                <div className="space-y-4">
                    <textarea 
                        placeholder="写下你想对家人说的话..." 
                        className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                        value={newNoteForm.content} 
                        onChange={e => setNewNoteForm({...newNoteForm, content: e.target.value})}
                        autoFocus
                    />
                    
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['👶', '❤️', '💰', '📝', '🛒', '🎉'].map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => setNewNoteForm({...newNoteForm, emoji})} 
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newNoteForm.emoji === emoji ? 'bg-indigo-100 border-2 border-indigo-200 scale-110' : 'bg-slate-50'}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100'].map(color => (
                            <button 
                                key={color} 
                                onClick={() => setNewNoteForm({...newNoteForm, color})} 
                                className={`flex-1 h-8 rounded-full border-2 transition-all ${newNoteForm.color === color ? 'border-slate-400 scale-105 shadow-sm' : 'border-transparent opacity-60'}`}
                                style={{ backgroundColor: `var(--${color.replace('bg-', '')})` }} // Just using class directly in component
                            >
                                <div className={`w-full h-full rounded-full ${color}`}></div>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 mt-2">
                        <button onClick={() => setShowAddNoteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                        <button onClick={handleAddNote} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">张贴</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">{editingCardId ? '编辑信用卡' : '添加信用卡'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="银行名称 (如: 招商银行)" className="w-full p-4 bg-slate-50 rounded-xl font-bold" value={newCardForm.bankName} onChange={e => setNewCardForm({...newCardForm, bankName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                 <input type="text" placeholder="卡片别名" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm" value={newCardForm.cardName} onChange={e => setNewCardForm({...newCardForm, cardName: e.target.value})} />
                 <input type="text" placeholder="末4位卡号" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm" value={newCardForm.last4Digits} onChange={e => setNewCardForm({...newCardForm, last4Digits: e.target.value})} />
              </div>
              <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                   <input type="number" placeholder="信用额度" className="w-full pl-8 p-4 bg-slate-50 rounded-xl font-bold" value={newCardForm.creditLimit} onChange={e => setNewCardForm({...newCardForm, creditLimit: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-2 relative">
                      <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3">账单日</label>
                      <input type="number" placeholder="日" className="w-full pt-4 pb-1 px-2 bg-transparent font-bold text-center" min="1" max="31" value={newCardForm.billDay} onChange={e => setNewCardForm({...newCardForm, billDay: e.target.value})} />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 relative">
                      <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3">还款日</label>
                      <input type="number" placeholder="日" className="w-full pt-4 pb-1 px-2 bg-transparent font-bold text-center" min="1" max="31" value={newCardForm.repaymentDay} onChange={e => setNewCardForm({...newCardForm, repaymentDay: e.target.value})} />
                  </div>
              </div>
              <div className="flex gap-4 mt-2">
                 <button onClick={() => setShowAddCardModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                 <button onClick={handleSaveCard} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Loan Modal */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">{editingLoanId ? '编辑贷款' : '添加贷款'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="贷款名称 (如: 房贷)" className="w-full p-4 bg-slate-50 rounded-xl font-bold" value={newLoanForm.name} onChange={e => setNewLoanForm({...newLoanForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="放款银行/机构" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm" value={newLoanForm.bankName} onChange={e => setNewLoanForm({...newLoanForm, bankName: e.target.value})} />
                  <select className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm text-slate-600" value={newLoanForm.category} onChange={e => setNewLoanForm({...newLoanForm, category: e.target.value as any})}>
                      <option value={Category.MORTGAGE}>房贷</option>
                      <option value={Category.CAR_LOAN}>车贷</option>
                      <option value={Category.PERSONAL_LOAN}>消费贷</option>
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">总额</span>
                       <input type="number" className="w-full pl-10 p-4 bg-slate-50 rounded-xl font-bold text-sm" value={newLoanForm.totalAmount} onChange={e => setNewLoanForm({...newLoanForm, totalAmount: e.target.value})} />
                  </div>
                  <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">余额</span>
                       <input type="number" className="w-full pl-10 p-4 bg-slate-50 rounded-xl font-bold text-sm" value={newLoanForm.balance} onChange={e => setNewLoanForm({...newLoanForm, balance: e.target.value})} />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-2 relative">
                      <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3">每月还款日</label>
                      <input type="number" placeholder="日" className="w-full pt-4 pb-1 px-2 bg-transparent font-bold text-center" min="1" max="31" value={newLoanForm.interestDay} onChange={e => setNewLoanForm({...newLoanForm, interestDay: e.target.value})} />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 relative">
                      <label className="text-[10px] font-bold text-slate-400 absolute top-2 left-3">月供金额</label>
                      <input type="number" className="w-full pt-4 pb-1 px-2 bg-transparent font-bold text-center" value={newLoanForm.monthlyRepayment} onChange={e => setNewLoanForm({...newLoanForm, monthlyRepayment: e.target.value})} />
                  </div>
              </div>
              <div className="flex gap-4 mt-2">
                 <button onClick={() => setShowAddLoanModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl">取消</button>
                 <button onClick={handleSaveLoan} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
