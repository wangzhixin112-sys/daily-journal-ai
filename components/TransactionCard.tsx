import React from 'react';
import { Transaction, TransactionType, User } from '../types';
import { TrendingUp, TrendingDown, User as UserIcon, CreditCard, ArrowRight, Sparkles, X } from './Icons';

interface Props {
  transaction: Transaction;
  user?: User;
  onClick?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  className?: string;
}

export const TransactionCard: React.FC<Props> = ({ transaction, user, onClick, onDelete, className }) => {
  const dateObj = new Date(transaction.date);
  
  let icon, colorClass, sign;

  switch (transaction.type) {
    case TransactionType.INCOME:
      icon = <TrendingUp size={20} />;
      colorClass = 'bg-emerald-50 text-emerald-500';
      sign = '+';
      break;
    case TransactionType.EXPENSE:
      icon = <TrendingDown size={20} />;
      colorClass = 'bg-red-50 text-red-500';
      sign = '-';
      break;
    case TransactionType.DEBT:
      icon = <CreditCard size={20} />;
      colorClass = 'bg-purple-50 text-purple-500';
      sign = '+'; // Money comes in (Borrowing)
      break;
    case TransactionType.REPAYMENT:
      icon = <ArrowRight size={20} />;
      colorClass = 'bg-amber-50 text-amber-500';
      sign = '-'; // Money goes out (Repaying)
      break;
  }
  
  // Text color for the amount
  const amountColor = 
    transaction.type === TransactionType.INCOME || transaction.type === TransactionType.DEBT
    ? (transaction.type === TransactionType.DEBT ? 'text-purple-600' : 'text-emerald-600')
    : (transaction.type === TransactionType.REPAYMENT ? 'text-amber-600' : 'text-slate-800');

  const hasAttachments = transaction.attachments && transaction.attachments.length > 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Only need to stop bubbling to the card click
    onDelete?.(transaction);
  };

  return (
    <div 
      onClick={() => onClick && onClick(transaction)}
      className={`group relative flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 mb-5 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-200 cursor-pointer ${className || ''}`}
    >
      {onDelete && (
        <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-2 -right-2 p-4 z-20 focus:outline-none"
            title="删除"
        >
            <div className="bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-full p-1.5 shadow-sm transition-colors">
                <X size={14} />
            </div>
        </button>
      )}

      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClass} relative`}>
          {icon}
          {hasAttachments && (
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{transaction.category}</h3>
            {(transaction.type === TransactionType.DEBT || transaction.type === TransactionType.REPAYMENT) && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                transaction.type === TransactionType.DEBT 
                  ? 'border-purple-200 text-purple-600 bg-purple-50' 
                  : 'border-amber-200 text-amber-600 bg-amber-50'
              }`}>
                {transaction.type === TransactionType.DEBT ? '借入' : '还款'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1 line-clamp-1">
             {transaction.note}
          </p>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs text-slate-400">
               {dateObj.toLocaleDateString('zh-CN')}
             </span>
             {user && (
               <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                  <UserIcon size={10} /> {user.name}
               </div>
             )}
          </div>
        </div>
      </div>
      <div className={`font-bold text-lg ${amountColor}`}>
        {sign}¥{transaction.amount.toFixed(2)}
      </div>
    </div>
  );
};