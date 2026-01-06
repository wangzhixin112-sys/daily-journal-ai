
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT',
  REPAYMENT = 'REPAYMENT',
}

export enum Category {
  FOOD = '餐饮美食',
  TRANSPORT = '交通出行',
  SHOPPING = '网购消费',
  HOUSING = '居住物业',
  ENTERTAINMENT = '休闲娱乐',
  HEALTH = '医疗健康',
  SALARY = '工资薪水',
  INVESTMENT = '理财投资',
  RED_PACKET = '人情红包',
  CREDIT_CARD = '信用卡',
  MORTGAGE = '房贷',
  CAR_LOAN = '车贷',
  STUDENT_LOAN = '助学贷款',
  PERSONAL_LOAN = '消费贷',
  COLLATERAL_LOAN = '抵押贷款',
  INSTALLMENT = '分期付款',
  BORROWING = '借款',
  BABY = '宝宝综合',
  EDUCATION = '教育培训',
  DAILY = '日用百货',
  ALLOWANCE = '零花钱',
  TOYS = '玩具绘本',
  OTHER = '其他杂项'
}

export interface Permissions {
  canView: boolean;
  canEdit: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isFamilyAdmin: boolean;
  isPremium: boolean; // 会员状态
  permissions?: Permissions;
}

export interface Baby {
  id: string;
  name: string;
  avatar: string;
  birthDate?: string;
}

export interface CreditCardAccount {
  id: string;
  bankName: string;
  cardName: string;
  last4Digits: string;
  creditLimit: number;
  billDay: number;
  repaymentDay: number;
  balance: number;
  theme: string;
}

export interface LoanAccount {
  id: string;
  name: string;
  bankName: string;
  totalAmount: number;
  balance: number;
  interestDay: number;
  monthlyRepayment: number;
  category: Category;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  date: string;
  dueDate?: string;
  note: string;
  userId: string;
  babyId?: string;
  babyName?: string;
  cardId?: string;
  loanId?: string;
  attachments?: string[];
}

export interface AiParsingResult {
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date?: string;
  dueDate?: string;
  babyName?: string;
}

export interface FamilyNote {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  emoji: string;
  color: string; // Tailwind class like 'bg-yellow-100'
  createdAt: string;
}

export enum AppTab {
  HOME = 'HOME',
  STATS = 'STATS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  FAMILY = 'FAMILY',
  PROFILE = 'PROFILE'
}
