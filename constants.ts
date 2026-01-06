import { User, Category, Transaction, TransactionType, Baby, CreditCardAccount, LoanAccount, SavingsGoal } from './types';

export const CURRENT_USER_ID = 'user_1';

export const MOCK_USERS: User[] = [
  { 
    id: 'user_1', 
    name: 'Alex (我)', 
    avatar: 'https://picsum.photos/100/100', 
    isFamilyAdmin: true,
    permissions: { canView: true, canEdit: true }
  },
  { 
    id: 'user_2', 
    name: 'Sarah', 
    avatar: 'https://picsum.photos/101/101', 
    isFamilyAdmin: false,
    permissions: { canView: true, canEdit: true }
  }
];

export const MOCK_BABIES: Baby[] = [
  {
    id: 'baby_1',
    name: '米粒',
    avatar: '👶',
    birthDate: '2023-05-20'
  },
  {
    id: 'baby_2',
    name: '小汤圆',
    avatar: '🧸',
    birthDate: '2021-01-15'
  }
];

export const MOCK_GOALS: SavingsGoal[] = [
  {
    id: 'goal_1',
    name: '三亚家庭游',
    targetAmount: 20000,
    currentAmount: 5000,
    icon: '🏝️',
    color: 'from-cyan-400 to-blue-500',
    deadline: '2024-12-31'
  },
  {
    id: 'goal_2',
    name: '换新车基金',
    targetAmount: 300000,
    currentAmount: 12000,
    icon: '🚗',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'goal_3',
    name: '新款 Mac',
    targetAmount: 15000,
    currentAmount: 1500,
    icon: '💻',
    color: 'from-purple-400 to-indigo-500'
  }
];

export const MOCK_CREDIT_CARDS: CreditCardAccount[] = [
  {
    id: 'card_1',
    bankName: '招商银行',
    cardName: '经典白金卡',
    last4Digits: '8888',
    creditLimit: 60000,
    billDay: 5,
    repaymentDay: 25,
    balance: 5000,
    theme: 'from-slate-800 via-indigo-900 to-black'
  },
  {
    id: 'card_2',
    bankName: '浦发银行',
    cardName: 'AE白',
    last4Digits: '1234',
    creditLimit: 100000,
    billDay: 12,
    repaymentDay: 2,
    balance: 12500,
    theme: 'from-blue-800 via-blue-600 to-cyan-700'
  }
];

export const MOCK_LOANS: LoanAccount[] = [
  {
    id: 'loan_1',
    name: '住房商贷',
    bankName: '建设银行',
    totalAmount: 1500000,
    balance: 1250000,
    interestDay: 20,
    monthlyRepayment: 7800,
    category: Category.MORTGAGE
  },
  {
    id: 'loan_2',
    name: 'Model Y 车贷',
    bankName: '特斯拉金融',
    totalAmount: 200000,
    balance: 80000,
    interestDay: 15,
    monthlyRepayment: 3500,
    category: Category.CAR_LOAN
  }
];

// Helper to get a future date
const getFutureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0]; // simple YYYY-MM-DD for visual simplicity in mocks
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    amount: 1200,
    type: TransactionType.EXPENSE,
    category: Category.HOUSING,
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    note: '房租分摊',
    userId: 'user_1'
  },
  {
    id: 't2',
    amount: 45.50,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    date: new Date().toISOString(),
    note: '超市买菜',
    userId: 'user_1'
  },
  {
    id: 't3',
    amount: 15000,
    type: TransactionType.INCOME,
    category: Category.SALARY,
    date: new Date(new Date().setDate(1)).toISOString(),
    note: '九月工资',
    userId: 'user_1'
  },
  {
    id: 't4',
    amount: 299,
    type: TransactionType.EXPENSE,
    category: Category.DAILY,
    date: new Date().toISOString(),
    note: '购买纸尿裤',
    userId: 'user_2',
    babyId: 'baby_1'
  },
  {
    id: 't4_1',
    amount: 3500,
    type: TransactionType.EXPENSE,
    category: Category.EDUCATION,
    date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    note: '米粒早教课包年',
    userId: 'user_1',
    babyId: 'baby_1'
  },
  {
    id: 't4_2',
    amount: 50,
    type: TransactionType.EXPENSE,
    category: Category.ALLOWANCE,
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    note: '小汤圆零花钱',
    userId: 'user_1',
    babyId: 'baby_2'
  },
  {
    id: 't5',
    amount: 5000,
    type: TransactionType.DEBT,
    category: Category.CREDIT_CARD,
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    dueDate: getFutureDate(3), // Due in 3 days
    note: '信用卡消费',
    userId: 'user_1',
    cardId: 'card_1'
  },
  {
    id: 't6',
    amount: 1000,
    type: TransactionType.REPAYMENT,
    category: Category.CREDIT_CARD,
    date: new Date().toISOString(),
    note: '还信用卡',
    userId: 'user_1',
    cardId: 'card_1'
  },
  {
    id: 't7',
    amount: 20000,
    type: TransactionType.DEBT,
    category: Category.PERSONAL_LOAN,
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    dueDate: getFutureDate(20), // Due in 20 days
    note: '装修贷放款',
    userId: 'user_1'
  },
  {
    id: 't8',
    amount: 3500,
    type: TransactionType.REPAYMENT,
    category: Category.MORTGAGE,
    date: new Date().toISOString(),
    note: '本月房贷',
    userId: 'user_1',
    loanId: 'loan_1'
  }
];