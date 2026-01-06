export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT',           // Borrowing money / Credit Usage (Liability Increase)
  REPAYMENT = 'REPAYMENT', // Paying back debt (Liability Decrease)
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
  RED_PACKET = '人情红包', // New: Very important for Chinese users
  
  // Specific Debt Categories
  CREDIT_CARD = '信用卡',
  MORTGAGE = '房贷',
  CAR_LOAN = '车贷',
  STUDENT_LOAN = '助学贷款',
  PERSONAL_LOAN = '消费贷', // General bank loans
  COLLATERAL_LOAN = '抵押贷款', // New
  INSTALLMENT = '分期付款',     // New
  BORROWING = '借款',      // Personal borrowing (Friends/Family)
  
  // Family & Baby Specific
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
  permissions?: Permissions;
}

export interface Baby {
  id: string;
  name: string;
  avatar: string; // Emoji char
  birthDate?: string;
}

export interface CreditCardAccount {
  id: string;
  bankName: string;      // e.g. 招商银行
  cardName: string;      // e.g. 经典白金卡
  last4Digits: string;   // e.g. 8888
  creditLimit: number;   // 额度
  billDay: number;       // 账单日 (1-31)
  repaymentDay: number;  // 还款日 (1-31)
  balance: number;       // Current Debt
  theme: string;         // Gradient class for UI
}

export interface LoanAccount {
  id: string;
  name: string;          // e.g. 住房公积金贷款
  bankName: string;      // e.g. 建设银行
  totalAmount: number;   // 总贷款额 (Principal)
  balance: number;       // 剩余欠款 (Remaining)
  interestDay: number;   // 还息日/还款日 (1-31)
  monthlyRepayment: number; // 每月需还款金额 (Principal + Interest)
  category: Category;    // Type of loan (MORTGAGE, CAR_LOAN, etc.)
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string; // Emoji or icon name
  color: string; // Tailwind color class e.g., 'bg-blue-500'
  deadline?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  date: string; // ISO string
  dueDate?: string; // Optional: Due date for DEBT repayment
  note: string;
  userId: string; // Who made the transaction
  babyId?: string; // Optional: linked to a specific baby
  babyName?: string; // Optional: AI detected baby name
  cardId?: string; // Optional: Linked to a specific credit card
  loanId?: string; // Optional: Linked to a specific loan account
  attachments?: string[]; // Array of base64 strings or URLs for receipts/photos
}

export interface AiParsingResult {
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date?: string;
  dueDate?: string;
  babyName?: string; // AI detected baby name
}

export enum AppTab {
  HOME = 'HOME',
  STATS = 'STATS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  FAMILY = 'FAMILY',
  PROFILE = 'PROFILE'
}