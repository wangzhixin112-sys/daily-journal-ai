import React from 'react';
import { Transaction, TransactionType, User } from '../types';
import { TrendingUp, TrendingDown, CreditCard, ArrowRight, X } from './Icons';

interface Props {
  transaction: Transaction;
  user?: User;
  onClick?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  className?: string;
  hideAmount?: boolean;
}

export const TransactionCard: React.FC<Props> = ({ transaction, user, onClick, onDelete, className, hideAmount = false }) => {
  const dateObj = new Date(transaction.date);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${weekDays[dateObj.getDay()]}`;

  let icon, colorClass, sign;

  // Optimized for Chinese habits: Income = Red, Expense = Green/Black
  switch (transaction.type) {
    case TransactionType.INCOME:
      icon = <TrendingUp size={20} />;
      colorClass = 'bg-red-50 text-red-500'; // Red for Income (Lucky/Up)
      sign = '+';
      break;
    case TransactionType.EXPENSE:
      icon = <TrendingDown size={20} />;
      colorClass = 'bg-emerald-50 text-emerald-500'; // Green for Expense (Go/Spending)
      sign = '-';
      break;
    case TransactionType.DEBT:
      icon = <CreditCard size={20} />;
      colorClass = 'bg-indigo-50 text-indigo-500';
      sign = '+';
      break;
    case TransactionType.REPAYMENT:
      icon = <ArrowRight size={20} />;
      colorClass = 'bg-blue-50 text-blue-500';
      sign = '-';
      break;
  }
  
  // Text color logic
  const amountColor = 
    transaction.type === TransactionType.INCOME 
    ? 'text-red-500' 
    : (transaction.type === TransactionType.EXPENSE ? 'text-emerald-600' : 'text-slate-800');

  const hasAttachments = transaction.attachments && transaction.attachments.length > 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(transaction);
  };

  return (
    <div 
      onClick={() => onClick && onClick(transaction)}
      className={`group relative flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 mb-3 transition-all duration-300 hover:shadow-md active:bg-slate-50 cursor-pointer ${className || ''}`}
    >
      {onDelete && (
        <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -right-2 p-4 z-20 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除"
        >
            <div className="bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-full p-1.5 shadow-sm transition-colors">
                <X size={14} />
            </div>
        </button>
      )}

      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorClass} relative`}>
          {icon}
          {hasAttachments && (
             <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-[15px]">{transaction.category}</h3>
            {(transaction.type === TransactionType.DEBT || transaction.type === TransactionType.REPAYMENT) && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                transaction.type === TransactionType.DEBT 
                  ? 'border-indigo-200 text-indigo-600 bg-indigo-50' 
                  : 'border-blue-200 text-blue-600 bg-blue-50'
              }`}>
                {transaction.type === TransactionType.DEBT ? '借入' : '还款'}
              </span>
            )}
            {transaction.babyName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-pink-200 text-pink-500 bg-pink-50">
                {transaction.babyName}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1 mt-1">
               <span className="text-xs text-slate-400 font-medium">
                 {dateStr}
               </span>
               {transaction.note && (
                  <span className="text-xs text-slate-500 max-w-[150px] sm:max-w-[120px] truncate">{transaction.note}</span>
               )}
            </div>
        </div>
      </div>
      <div className={`text-right`}>
        <div className={`font-bold text-lg ${amountColor} tabular-nums`}>
            {hideAmount ? '****' : `${sign}${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        {user && (
            <div className="flex items-center justify-end gap-1.5 mt-1 opacity-60">
                <span className="text-[10px] text-slate-500 font-medium">{user.name}</span>
                <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full bg-slate-100 border border-white shadow-sm" />
            </div>
        )}
      </div>
    </div>
  );
};