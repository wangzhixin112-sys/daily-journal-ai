
import { User, Category, Transaction, TransactionType, Baby, CreditCardAccount, LoanAccount, SavingsGoal } from './types';

export const CURRENT_USER_ID = '';

export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    name: '测试用户',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=testuser',
    isFamilyAdmin: true,
    isPremium: true,
    permissions: { canView: true, canEdit: true }
  }
];

export const MOCK_BABIES: Baby[] = [
  {
    id: 'baby_1',
    name: '小宝',
    birthDate: '2023-01-01',
    avatar: '👶'
  }
];

export const MOCK_GOALS: SavingsGoal[] = [
  {
    id: 'goal_1',
    name: '家庭旅游',
    targetAmount: 20000,
    currentAmount: 5000,
    icon: '✈️',
    color: 'from-blue-500 to-cyan-500'
  }
];

export const MOCK_CREDIT_CARDS: CreditCardAccount[] = [
  {
    id: 'card_1',
    bankName: '招商银行',
    cardName: '信用卡',
    creditLimit: 50000,
    balance: 12000,
    billDay: 15,
    repaymentDay: 5,
    last4Digits: '1234',
    theme: 'from-indigo-600 to-blue-700'
  }
];

export const MOCK_LOANS: LoanAccount[] = [
  {
    id: 'loan_1',
    name: '房贷',
    bankName: '工商银行',
    totalAmount: 2000000,
    balance: 1800000,
    interestDay: 20,
    monthlyRepayment: 8500,
    category: Category.MORTGAGE
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    amount: 128.5,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    note: '午餐',
    date: new Date().toISOString(),
    userId: 'user_1'
  },
  {
    id: 'tx_2',
    amount: 5000,
    type: TransactionType.INCOME,
    category: Category.SALARY,
    note: '工资收入',
    date: new Date().toISOString(),
    userId: 'user_1'
  }
];
