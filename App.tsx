import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  AppTab, 
  Transaction, 
  User, 
  TransactionType, 
  Category, 
  Baby, 
  CreditCardAccount, 
  LoanAccount, 
  SavingsGoal 
} from './types';
import { 
  MOCK_USERS, 
  MOCK_BABIES, 
  INITIAL_TRANSACTIONS, 
  MOCK_CREDIT_CARDS, 
  MOCK_LOANS, 
  MOCK_GOALS 
} from './constants';
import { TransactionCard } from './components/TransactionCard';
import { StatsView } from './components/StatsView';
import { VoiceAssistant } from './components/VoiceAssistant';
import { LandingPage } from './components/LandingPage';
import { 
  Home, 
  PieChart, 
  Mic, 
  Users, 
  User as UserIcon, 
  Wallet, 
  Settings, 
  X, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Baby as BabyIcon, 
  Sparkles, 
  UserCog, 
  Share2, 
  Landmark, 
  Banknote, 
  Smile, 
  Plus, 
  ArrowRight, 
  CalendarDays, 
  CheckCircle2, 
  Search, 
  Car, 
  GraduationCap, 
  Loader2, 
  ChevronRight, 
  Trash2, 
  BarChart3, 
  ChevronLeft, 
  Target, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Trophy, 
  PiggyBank,
  Lock,
  Pencil
} from './components/Icons';

// --- Persistence Helpers ---
const useStickyState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);

  // --- Persistent State ---
  const [users, setUsers] = useStickyState<User[]>('gf_users', MOCK_USERS);
  const [babies, setBabies] = useStickyState<Baby[]>('gf_babies', MOCK_BABIES);
  const [transactions, setTransactions] = useStickyState<Transaction[]>('gf_transactions', INITIAL_TRANSACTIONS);
  const [creditCards, setCreditCards] = useStickyState<CreditCardAccount[]>('gf_cards', MOCK_CREDIT_CARDS);
  const [loans, setLoans] = useStickyState<LoanAccount[]>('gf_loans', MOCK_LOANS);
  const [goals, setGoals] = useStickyState<SavingsGoal[]>('gf_goals', MOCK_GOALS);
  const [monthlyBudget, setMonthlyBudget] = useStickyState<number>('gf_budget', 10000); // Default budget

  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [familyMode, setFamilyMode] = useState(false);
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<'NONE' | 'DEBT' | 'BABY_LIST' | 'GOALS' | 'ASSETS'>('NONE');
  const [selectedDebtGroup, setSelectedDebtGroup] = useState<'CREDIT' | 'BANK' | 'PRIVATE' | null>(null);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);

  // UI States
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false); // New Invite/Add Member Modal
  const [showAddGoalModal, setShowAddGoalModal] = useState(false); // New Goal Modal
  const [showDepositModal, setShowDepositModal] = useState(false); // Deposit to Goal Modal

  // Form States
  const [newCardForm, setNewCardForm] = useState({
    bankName: '',
    cardName: '',
    creditLimit: '',
    billDay: '',
    repaymentDay: '',
    last4Digits: ''
  });

  const [editingCard, setEditingCard] = useState<CreditCardAccount | null>(null);
  const [editCardForm, setEditCardForm] = useState({ billDay: '', repaymentDay: '' });

  const [newLoanForm, setNewLoanForm] = useState({
    name: '',
    bankName: '',
    totalAmount: '',
    balance: '',
    interestDay: '',
    monthlyRepayment: '',
    category: Category.MORTGAGE
  });
  
  const [newGoalForm, setNewGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    icon: '🎯'
  });
  
  const [depositForm, setDepositForm] = useState({
      goalId: '',
      amount: ''
  });
  
  const [inviteForm, setInviteForm] = useState({ name: '', role: 'member' }); // Form for adding member

  const [editingLoan, setEditingLoan] = useState<LoanAccount | null>(null);
  const [editLoanForm, setEditLoanForm] = useState({ interestDay: '', monthlyRepayment: '' });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [babyToDelete, setBabyToDelete] = useState<Baby | null>(null);
  
  // New: Edit Transaction State
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Add Form State
  const [addForm, setAddForm] = useState({
    amount: '',
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    note: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    babyId: '',
    cardId: '',
    loanId: ''
  });
  
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [newBabyName, setNewBabyName] = useState('');
  const [tempBudgetInput, setTempBudgetInput] = useState('');

  // Derived state
  const visibleTransactions = familyMode 
    ? transactions 
    : transactions.filter(t => t.userId === currentUser.id);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return visibleTransactions;
    const lowerQuery = searchQuery.toLowerCase();
    return visibleTransactions.filter(t => 
      t.note.toLowerCase().includes(lowerQuery) || 
      t.category.toLowerCase().includes(lowerQuery) ||
      t.amount.toString().includes(lowerQuery)
    );
  }, [visibleTransactions, searchQuery]);

  // --- Streak Calculation ---
  const currentStreak = useMemo(() => {
    // Sort transactions by date descending
    const sortedDates = [...new Set(visibleTransactions.map(t => t.date.split('T')[0]))].sort((a, b) => b.localeCompare(a));
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

    // If no entry today and no entry yesterday, streak is broken (0). 
    // If entry today, start counting. If no entry today but yes yesterday, start counting from yesterday.
    
    let startIndex = -1;
    if (sortedDates[0] === today) startIndex = 0;
    else if (sortedDates[0] === yesterday) startIndex = 0; // Streak preserved if missed today but did yesterday
    else return 0; // Streak broken

    // This is a simplified consecutive check logic
    let currentDate = new Date(sortedDates[startIndex]);
    
    // Check backwards from the latest valid streak date
    for (let i = startIndex; i < sortedDates.length; i++) {
        const checkDate = new Date(sortedDates[i]);
        const diffTime = Math.abs(currentDate.getTime() - checkDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (i === startIndex) {
            streak++;
        } else {
             const prevDateInLoop = new Date(sortedDates[i-1]);
             const thisDateInLoop = new Date(sortedDates[i]);
             const gap = (prevDateInLoop.getTime() - thisDateInLoop.getTime()) / (1000 * 3600 * 24);
             if (Math.round(gap) === 1) {
                 streak++;
             } else {
                 break;
             }
        }
    }
    return streak;
  }, [visibleTransactions]);

  // --- Financial Logic --- (Kept same)
  
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const currentMonthExpense = visibleTransactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === TransactionType.EXPENSE && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const budgetProgress = Math.min((currentMonthExpense / monthlyBudget) * 100, 100);
  const remainingBudget = monthlyBudget - currentMonthExpense;

  const income = visibleTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
  const expense = visibleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);

  const debtTransactions = visibleTransactions.filter(t => t.type === TransactionType.DEBT);
  const repaymentTransactions = visibleTransactions.filter(t => t.type === TransactionType.REPAYMENT);

  const totalDebtBorrowed = debtTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebtRepaid = repaymentTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const currentTotalDebt = totalDebtBorrowed - totalDebtRepaid;
  
  // Total Net Assets (Family Fund Total)
  const cashBalance = (income + totalDebtBorrowed) - (expense + totalDebtRepaid);

  // Fund Allocation Logic
  const totalAllocatedToGoals = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const flexibleCash = cashBalance - totalAllocatedToGoals;

  const thisMonthDebt = debtTransactions
    .filter(t => { const d = new Date(t.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((a, b) => a + b.amount, 0);
  const thisMonthRepayment = repaymentTransactions
    .filter(t => { const d = new Date(t.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((a, b) => a + b.amount, 0);

  const calcDebt = (cat: Category | Category[]) => {
      const cats = Array.isArray(cat) ? cat : [cat];
      const borrowed = debtTransactions.filter(t => cats.includes(t.category as Category)).reduce((acc, curr) => acc + curr.amount, 0);
      const repaid = repaymentTransactions.filter(t => cats.includes(t.category as Category)).reduce((acc, curr) => acc + curr.amount, 0);
      return borrowed - repaid;
  };
  
  const creditCardDebt = calcDebt(Category.CREDIT_CARD);
  const bankLoanDebt = calcDebt([Category.MORTGAGE, Category.CAR_LOAN, Category.STUDENT_LOAN, Category.PERSONAL_LOAN, Category.COLLATERAL_LOAN, Category.INSTALLMENT]);
  const privateDebt = calcDebt(Category.BORROWING);

  const upcomingDebts = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return visibleTransactions
      .filter(t => t.type === TransactionType.DEBT && t.dueDate)
      .map(t => {
          const due = new Date(t.dueDate!);
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...t, daysLeft: diffDays };
      })
      .filter(t => t.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [visibleTransactions]);

  const getBabySpend = (babyId: string) => {
      return visibleTransactions
        .filter(t => {
            const isBaby = t.babyId === babyId;
            const babyCategories = [Category.BABY, Category.EDUCATION, Category.DAILY, Category.ALLOWANCE, Category.TOYS, Category.HEALTH];
            const isBabyCat = babyCategories.includes(t.category as Category);
            return isBaby && (isBabyCat || t.babyId === babyId);
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const totalBabySpend = useMemo(() => {
      return babies.reduce((acc, baby) => acc + getBabySpend(baby.id), 0);
  }, [visibleTransactions, babies]);

  const getCardBalance = (cardId: string) => {
      const card = creditCards.find(c => c.id === cardId);
      if(!card) return 0;
      const cardTxs = visibleTransactions.filter(t => t.cardId === cardId);
      const borrowed = cardTxs.filter(t => t.type === TransactionType.DEBT).reduce((acc, curr) => acc + curr.amount, 0);
      const repaid = cardTxs.filter(t => t.type === TransactionType.REPAYMENT).reduce((acc, curr) => acc + curr.amount, 0);
      return Math.max(0, card.balance + borrowed - repaid); 
  };
  
  const getDebtCategoryStyle = (cat: Category) => {
    switch (cat) {
      case Category.CREDIT_CARD: return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', ring: 'ring-indigo-200', icon: <CreditCard size={20} /> };
      case Category.MORTGAGE: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-200', icon: <Home size={20} /> };
      case Category.CAR_LOAN: return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200', icon: <Car size={20} /> };
      case Category.STUDENT_LOAN: return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-200', icon: <GraduationCap size={20} /> };
      case Category.PERSONAL_LOAN: return { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', ring: 'ring-violet-200', icon: <Landmark size={20} /> };
      case Category.COLLATERAL_LOAN: return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-200', icon: <Landmark size={20} /> };
      case Category.INSTALLMENT: return { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', ring: 'ring-cyan-200', icon: <CreditCard size={20} /> };
      case Category.BORROWING: return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', ring: 'ring-rose-200', icon: <Users size={20} /> };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-200', icon: <Banknote size={20} /> };
    }
  };

  // --- Actions ---
  
  const handleLogin = (name: string) => {
      // Create or update the primary user based on input name
      const primaryUser = { ...users[0], name: name };
      const newUsers = [primaryUser, ...users.slice(1)];
      setUsers(newUsers);
      setCurrentUser(primaryUser);
      setIsLoggedIn(true);
  };

  const handleAddMember = () => {
    if (!inviteForm.name.trim()) return;
    
    const newUser: User = {
        id: `user_${Date.now()}`,
        name: inviteForm.name,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${inviteForm.name}`, // Generate random avatar
        isFamilyAdmin: inviteForm.role === 'admin',
        permissions: { canView: true, canEdit: true }
    };

    setUsers(prev => [...prev, newUser]);
    setInviteForm({ name: '', role: 'member' });
    setShowInviteModal(false);
  };

  const handleAddGoal = () => {
      if (!newGoalForm.name || !newGoalForm.targetAmount) return;
      const colors = ['from-pink-400 to-rose-500', 'from-cyan-400 to-blue-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-green-500'];
      const newGoal: SavingsGoal = {
          id: `goal_${Date.now()}`,
          name: newGoalForm.name,
          targetAmount: parseFloat(newGoalForm.targetAmount),
          currentAmount: parseFloat(newGoalForm.currentAmount) || 0,
          icon: newGoalForm.icon || '🎯',
          color: colors[goals.length % colors.length]
      };
      setGoals([...goals, newGoal]);
      setShowAddGoalModal(false);
      setNewGoalForm({ name: '', targetAmount: '', currentAmount: '', icon: '🎯' });
  };

  // Updated: Set goal to delete instead of using window.confirm
  const deleteGoal = (e: React.MouseEvent, goal: SavingsGoal) => {
      e.preventDefault(); 
      e.stopPropagation();
      setGoalToDelete(goal);
  };

  const confirmDeleteGoal = () => {
      if (goalToDelete) {
          setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
          setGoalToDelete(null);
      }
  };

  const confirmDeleteMember = () => {
      if (memberToDelete) {
          setUsers(prev => prev.filter(u => u.id !== memberToDelete.id));
          setMemberToDelete(null);
      }
  };

  const confirmDeleteBaby = () => {
      if (babyToDelete) {
          setBabies(prev => prev.filter(b => b.id !== babyToDelete.id));
          setBabyToDelete(null);
      }
  };

  const openDepositModal = (goalId: string) => {
      setDepositForm({ goalId, amount: '' });
      setShowDepositModal(true);
  };

  const handleDepositToGoal = () => {
      const amount = parseFloat(depositForm.amount);
      if (isNaN(amount) || amount <= 0) return;
      
      // Decoupled Logic: Allow deposit regardless of cash balance
      // Logic removed: if (amount > flexibleCash) ...

      setGoals(prev => prev.map(g => {
          if (g.id === depositForm.goalId) {
              return { ...g, currentAmount: g.currentAmount + amount };
          }
          return g;
      }));
      
      setShowDepositModal(false);
      setDepositForm({ goalId: '', amount: '' });
  };

  const exportData = () => {
    const headers = ['ID', '日期', '类型', '金额', '分类', '备注', '用户', '关联宝宝', '关联卡片'];
    const rows = transactions.map(t => [
      t.id, t.date, t.type, t.amount, t.category, `"${t.note.replace(/"/g, '""')}"`,
      users.find(u => u.id === t.userId)?.name || 'Unknown', t.babyName || '', creditCards.find(c => c.id === t.cardId)?.bankName || ''
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `每日记_账单_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateBudget = () => {
    const val = parseFloat(tempBudgetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
      setShowBudgetModal(false);
    }
  };

  // ... (Keep existing handlers for Card/Loan/Baby/Transaction Add/Edit/Delete - shortened for brevity as they are mostly identical logic)
  const handleEditCard = (card: CreditCardAccount) => { setEditingCard(card); setEditCardForm({ billDay: card.billDay.toString(), repaymentDay: card.repaymentDay.toString() }); };
  const saveCardEdit = () => { if (!editingCard) return; setCreditCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, billDay: parseInt(editCardForm.billDay) || c.billDay, repaymentDay: parseInt(editCardForm.repaymentDay) || c.repaymentDay } : c)); setEditingCard(null); };
  const handleDeleteCard = () => { if (!editingCard) return; if (window.confirm("确定要删除这张信用卡吗？")) { setCreditCards(prev => prev.filter(c => c.id !== editingCard.id)); setEditingCard(null); } };
  const handleEditLoan = (loan: LoanAccount) => { setEditingLoan(loan); setEditLoanForm({ interestDay: loan.interestDay.toString(), monthlyRepayment: loan.monthlyRepayment.toString() }); };
  const saveLoanEdit = () => { if (!editingLoan) return; setLoans(prev => prev.map(l => l.id === editingLoan.id ? { ...l, interestDay: parseInt(editLoanForm.interestDay) || l.interestDay, monthlyRepayment: parseFloat(editLoanForm.monthlyRepayment) || l.monthlyRepayment } : l)); setEditingLoan(null); };
  const handleDeleteLoan = () => { if (!editingLoan) return; if (window.confirm("确定要删除这个贷款账户吗？")) { setLoans(prev => prev.filter(l => l.id !== editingLoan.id)); setEditingLoan(null); } };
  
  const handleAddTransaction = (data: Omit<Transaction, 'id' | 'userId'> & { babyName?: string, dueDate?: string }) => {
    let finalBabyId = data.babyId;
    if (!finalBabyId && data.babyName) { const found = babies.find(b => b.name.includes(data.babyName!) || data.babyName!.includes(b.name)); if (found) finalBabyId = found.id; }
    const babyCategories = [Category.BABY, Category.EDUCATION, Category.DAILY, Category.ALLOWANCE, Category.TOYS];
    if (babyCategories.includes(data.category as Category) && !finalBabyId && babies.length > 0) { finalBabyId = babies[0].id; }
    const newTx: Transaction = { id: Date.now().toString(), userId: currentUser.id, amount: data.amount, type: data.type, category: data.category, note: data.note, date: data.date, dueDate: data.dueDate, babyId: finalBabyId, babyName: data.babyName, cardId: addForm.cardId, loanId: addForm.loanId };
    setTransactions(prev => [newTx, ...prev]); setShowAddModal(false); setAddForm({ amount: '', type: TransactionType.EXPENSE, category: Category.FOOD, note: '', date: new Date().toISOString().split('T')[0], dueDate: '', babyId: '', cardId: '', loanId: '' });
  };
  
  // NEW: Handle Edit Transaction
  const handleEditTransaction = (tx: Transaction) => {
    setAddForm({
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category as Category,
      note: tx.note,
      date: tx.date.split('T')[0],
      dueDate: tx.dueDate ? tx.dueDate.split('T')[0] : '',
      babyId: tx.babyId || '',
      cardId: tx.cardId || '',
      loanId: tx.loanId || ''
    });
    setEditingTransactionId(tx.id);
    setSelectedTransaction(null); // Close detail modal
    setShowAddModal(true); // Open edit modal
  };

  const submitManualTransaction = () => { 
    if (!addForm.amount) return; 
    
    // Check if we are updating an existing transaction
    if (editingTransactionId) {
        setTransactions(prev => prev.map(t => {
            if (t.id === editingTransactionId) {
                // Keep original ID and UserID, update other fields
                return {
                    ...t,
                    amount: parseFloat(addForm.amount),
                    type: addForm.type,
                    category: addForm.category,
                    note: addForm.note || (addForm.type === TransactionType.INCOME ? '收入' : '消费'),
                    date: new Date(addForm.date).toISOString(),
                    dueDate: addForm.dueDate ? new Date(addForm.dueDate).toISOString() : undefined,
                    babyId: addForm.babyId || undefined,
                    cardId: addForm.cardId || undefined,
                    loanId: addForm.loanId || undefined,
                    // Re-evaluate babyName based on id if needed, or keep existing? 
                    // Simpler to just let babyId handle the link.
                };
            }
            return t;
        }));
        setEditingTransactionId(null);
        setShowAddModal(false);
        setAddForm({ amount: '', type: TransactionType.EXPENSE, category: Category.FOOD, note: '', date: new Date().toISOString().split('T')[0], dueDate: '', babyId: '', cardId: '', loanId: '' });
    } else {
        // Create new transaction
        handleAddTransaction({ 
            amount: parseFloat(addForm.amount), 
            type: addForm.type, 
            category: addForm.category, 
            note: addForm.note || (addForm.type === TransactionType.INCOME ? '收入' : '消费'), 
            date: new Date(addForm.date).toISOString(), 
            dueDate: addForm.dueDate ? new Date(addForm.dueDate).toISOString() : undefined, 
            babyId: addForm.babyId 
        }); 
    }
  };

  const handleAddBaby = () => { if(!newBabyName) return; const newBaby: Baby = { id: `baby_${Date.now()}`, name: newBabyName, avatar: '👶' }; setBabies([...babies, newBaby]); setNewBabyName(''); setShowAddBaby(false); };
  const handleAddCard = () => { if(!newCardForm.bankName || !newCardForm.creditLimit) return; const themes = ['from-slate-800 via-indigo-900 to-black', 'from-blue-800 via-blue-600 to-cyan-700', 'from-rose-700 via-red-600 to-orange-700', 'from-emerald-700 via-teal-600 to-green-800', 'from-violet-800 via-purple-700 to-fuchsia-800']; const newCard: CreditCardAccount = { id: `card_${Date.now()}`, bankName: newCardForm.bankName, cardName: newCardForm.cardName || '信用卡', last4Digits: newCardForm.last4Digits || '0000', creditLimit: parseFloat(newCardForm.creditLimit), billDay: parseInt(newCardForm.billDay) || 1, repaymentDay: parseInt(newCardForm.repaymentDay) || 10, balance: 0, theme: themes[creditCards.length % themes.length] }; setCreditCards([...creditCards, newCard]); setShowAddCardModal(false); setNewCardForm({ bankName: '', cardName: '', creditLimit: '', billDay: '', repaymentDay: '', last4Digits: '' }); };
  const handleAddLoan = () => { if(!newLoanForm.name || !newLoanForm.totalAmount) return; const newLoan: LoanAccount = { id: `loan_${Date.now()}`, name: newLoanForm.name, bankName: newLoanForm.bankName || '贷款银行', totalAmount: parseFloat(newLoanForm.totalAmount), balance: parseFloat(newLoanForm.balance) || parseFloat(newLoanForm.totalAmount), interestDay: parseInt(newLoanForm.interestDay) || 1, monthlyRepayment: parseFloat(newLoanForm.monthlyRepayment) || 0, category: newLoanForm.category as Category }; setLoans([...loans, newLoan]); setShowAddLoanModal(false); setNewLoanForm({ name: '', bankName: '', totalAmount: '', balance: '', interestDay: '', monthlyRepayment: '', category: Category.MORTGAGE }); };
  
  // FIX: Updated logic to correctly toggle permission even if undefined (default true)
  const toggleMemberPermission = (userId: string, key: 'canView' | 'canEdit') => { 
    setUsers(prev => prev.map(u => { 
        if (u.id === userId) { 
            const currentVal = u.permissions?.[key] ?? true; // Default to true if undefined
            const newPermissions = { 
                canView: u.permissions?.canView ?? true, 
                canEdit: u.permissions?.canEdit ?? true, 
                [key]: !currentVal // Toggle effective value
            }; 
            const updatedUser = { ...u, permissions: newPermissions }; 
            if (editingMember?.id === userId) setEditingMember(updatedUser); 
            return updatedUser; 
        } 
        return u; 
    })); 
  };

  const handleTransactionClick = (transaction: Transaction) => setSelectedTransaction(transaction);
  const handleQuickDelete = (transaction: Transaction) => setTransactionToDelete(transaction);
  const handleDeleteTransaction = () => { if (selectedTransaction) { setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id)); setSelectedTransaction(null); } };
  const confirmDelete = () => { if (transactionToDelete) { setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id)); if (selectedTransaction?.id === transactionToDelete.id) setSelectedTransaction(null); setTransactionToDelete(null); } };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file && selectedTransaction) { const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result as string; setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? { ...t, attachments: [...(t.attachments || []), base64] } : t)); setSelectedTransaction(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), base64] } : null); }; reader.readAsDataURL(file); } };
  const triggerFileInput = () => fileInputRef.current?.click();
  const deleteAttachment = (index: number) => { if (!selectedTransaction) return; const updatedAttachments = selectedTransaction.attachments?.filter((_, i) => i !== index); setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? { ...t, attachments: updatedAttachments } : t)); setSelectedTransaction({ ...selectedTransaction, attachments: updatedAttachments }); };
  const openRepaymentModal = (amount: number, category: Category, contextId?: string, isLoan: boolean = false) => { setAddForm(prev => ({ ...prev, type: TransactionType.REPAYMENT, category: category, amount: amount.toString(), note: isLoan ? '贷款还款' : '信用卡还款', cardId: !isLoan && contextId ? contextId : '', loanId: isLoan && contextId ? contextId : '' })); setShowAddModal(true); };

  // --- Render Functions ---

  const renderBabyListView = () => (
    <div className="h-full flex flex-col p-6 md:p-10 max-w-5xl mx-auto">
       <div className="flex items-center gap-4 mb-8">
           <button onClick={() => setActiveModule('NONE')} className="bg-white p-2.5 rounded-full text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-100 transition-all active:scale-95"><ChevronLeft size={20} /></button>
           <h2 className="text-2xl font-bold text-slate-800">宝宝成长账本</h2>
       </div>
       <div className="bg-pink-50 p-6 rounded-[2rem] border border-pink-100 mb-8 relative overflow-hidden">
           <div className="relative z-10">
               <p className="text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">宝宝总支出</p>
               <h1 className="text-4xl font-bold text-slate-800">¥{totalBabySpend.toLocaleString()}</h1>
           </div>
           <div className="absolute right-0 bottom-0 opacity-10 text-pink-500"><BabyIcon size={120} /></div>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {babies.map(baby => (
               <div key={baby.id} onClick={() => setSelectedBaby(baby)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative">
                   <button 
                        onClick={(e) => { e.stopPropagation(); setBabyToDelete(baby); }}
                        className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="删除宝宝"
                   >
                        <Trash2 size={16} />
                   </button>
                   <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{baby.avatar}</div>
                       <div>
                           <h3 className="font-bold text-lg text-slate-800">{baby.name}</h3>
                           <p className="text-sm text-slate-400 font-medium">支出: ¥{getBabySpend(baby.id).toLocaleString()}</p>
                       </div>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-full text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors"><ChevronRight size={20} /></div>
               </div>
           ))}
           <button onClick={() => setShowAddBaby(true)} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-white hover:border-pink-200 hover:text-pink-500 transition-all min-h-[100px]">
               <div className="bg-white p-2 rounded-full shadow-sm"><Plus size={20} /></div>
               <span className="font-bold text-sm">添加宝宝</span>
           </button>
       </div>
    </div>
);

const renderBabyDetail = () => {
    if (!selectedBaby) return null;
    const babyTxs = visibleTransactions.filter(t => t.babyId === selectedBaby.id || (t.babyName && t.babyName.includes(selectedBaby.name)));
    const babyTotal = getBabySpend(selectedBaby.id);
    return (
      <div className="h-full flex flex-col bg-white">
          <div className="p-6 pb-4 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedBaby(null)} className="bg-slate-50 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><ChevronLeft size={24} /></button>
                  <div className="flex-1"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{selectedBaby.avatar} {selectedBaby.name}</h2></div>
                  <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase">总支出</p><p className="font-bold text-lg text-pink-500">¥{babyTotal.toLocaleString()}</p></div>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {babyTxs.length > 0 ? (babyTxs.map(tx => <TransactionCard key={tx.id} transaction={tx} user={users.find(u => u.id === tx.userId)} onClick={handleTransactionClick} />)) : (
                  <div className="text-center py-20"><div className="inline-block p-6 bg-slate-50 rounded-full mb-4"><BabyIcon size={40} className="text-slate-300" /></div><p className="text-slate-400 font-bold">暂无消费记录</p><button onClick={() => { setAddForm(prev => ({ ...prev, babyId: selectedBaby.id, category: Category.BABY })); setShowAddModal(true); }} className="mt-6 bg-pink-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-pink-200 hover:bg-pink-600 transition-transform active:scale-95">记一笔宝宝支出</button></div>
              )}
          </div>
      </div>
    );
};

const renderDebtView = () => (
    <div className="h-full flex flex-col p-6 md:p-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <button onClick={() => setActiveModule('NONE')} className="bg-white p-2.5 rounded-full text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-100 transition-all active:scale-95"><ChevronLeft size={20} /></button>
           <h2 className="text-2xl font-bold text-slate-800">负债管理</h2>
       </div>
       <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 mb-8 relative overflow-hidden">
           <div className="relative z-10">
               <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">当前总负债 (待还)</p>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tight break-words">¥{currentTotalDebt.toLocaleString()}</h1>
               <div className="mt-6 flex gap-8">
                   <div><span className="text-xs text-slate-400 block mb-1">本月新增</span><span className="font-bold text-xl text-red-400">+¥{thisMonthDebt.toLocaleString()}</span></div>
                   <div><span className="text-xs text-slate-400 block mb-1">本月已还</span><span className="font-bold text-xl text-emerald-400">-¥{thisMonthRepayment.toLocaleString()}</span></div>
               </div>
           </div>
           <div className="absolute right-0 bottom-0 opacity-5 translate-y-1/3 translate-x-1/4"><Landmark size={200} /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           <div onClick={() => setSelectedDebtGroup('CREDIT')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all cursor-pointer group">
               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform"><CreditCard size={28} /></div>
               <h3 className="text-lg font-bold text-slate-800 mb-1">信用卡</h3>
               <p className="text-sm text-slate-400 mb-4">{creditCards.length} 张卡片</p>
               <div className="flex justify-between items-end"><span className="text-xs font-bold text-slate-400 uppercase">欠款</span><span className="font-bold text-xl text-slate-800">¥{creditCardDebt.toLocaleString()}</span></div>
           </div>
           <div onClick={() => setSelectedDebtGroup('BANK')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all cursor-pointer group">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform"><Landmark size={28} /></div>
               <h3 className="text-lg font-bold text-slate-800 mb-1">银行贷款</h3>
               <p className="text-sm text-slate-400 mb-4">房贷 / 车贷</p>
               <div className="