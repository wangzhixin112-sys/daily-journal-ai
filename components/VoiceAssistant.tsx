import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Sparkles, CheckCircle2, TrendingUp, TrendingDown, CreditCard, ArrowRight, Keyboard, Send } from './Icons';
import { parseTransaction } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';

interface Props {
  onAddTransaction: (data: Omit<Transaction, 'id' | 'userId'> & { babyName?: string, dueDate?: string }) => void;
  currentUserId: string;
}

// Type definition for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const VoiceAssistant: React.FC<Props> = ({ onAddTransaction, currentUserId }) => {
  const [mode, setMode] = useState<'VOICE' | 'TEXT'>('VOICE');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("点击 说话");
  const [textInput, setTextInput] = useState('');
  const [tempTranscript, setTempTranscript] = useState(''); // Live transcript feedback
  
  // Store the full result for display
  const [successResult, setSuccessResult] = useState<{
    amount: number;
    type: TransactionType;
    category: string;
    note: string;
  } | null>(null);
  
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const Recognition = SpeechRecognition || webkitSpeechRecognition;

    if (Recognition) {
      const recognition = new Recognition();
      recognition.continuous = false; // Stop after one sentence
      recognition.interimResults = true; // Show results while talking
      recognition.lang = 'zh-CN'; // Set to Chinese

      recognition.onstart = () => {
        setIsRecording(true);
        setStatusMessage("正在聆听...");
        setTempTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            // Final result
            const finalTranscript = event.results[i][0].transcript;
            setTempTranscript(finalTranscript);
            handleVoiceResult(finalTranscript);
          } else {
            interimTranscript += event.results[i][0].transcript;
            setTempTranscript(interimTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setStatusMessage("请允许麦克风权限");
        } else {
          setStatusMessage("识别失败，请重试");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        // If we didn't get a final result (e.g. user stopped manually), check temp
        if (statusMessage === "正在聆听...") {
             setStatusMessage("点击 说话");
        }
      };

      recognitionRef.current = recognition;
    } else {
      setStatusMessage("您的浏览器不支持语音识别，请使用键盘输入");
      setMode('TEXT');
    }
  }, []);

  const handleVoiceResult = async (text: string) => {
      stopRecording();
      setTempTranscript(text); // Ensure final text is shown
      await processInput(text);
  };

  const startRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setSuccessResult(null);
    setTempTranscript('');
    
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch (e) {
            // Sometimes it throws if already started
            console.warn("Recognition start error:", e);
        }
    } else {
        alert("浏览器不支持语音识别");
    }
  };

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if(e) e.preventDefault();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // --- Text Handlers ---

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await processInput(textInput);
    setTextInput('');
  };

  // --- Common Processing ---

  const processInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setStatusMessage("DeepSeek 思考中...");
    
    try {
      const result = await parseTransaction(text);

      onAddTransaction({
        amount: result.amount,
        type: result.type,
        category: result.category,
        note: result.note,
        date: result.date || new Date().toISOString(),
        dueDate: result.dueDate,
        babyName: result.babyName
      });

      setSuccessResult({
        amount: result.amount,
        type: result.type,
        category: result.category,
        note: result.note
      });
      setStatusMessage(mode === 'VOICE' ? "点击 说话" : "发送");
    } catch (error) {
      console.error(error);
      setStatusMessage("AI 解析失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const getResultStyle = (type: TransactionType) => {
      switch (type) {
        case TransactionType.INCOME: return { color: 'text-emerald-500', sign: '+' };
        case TransactionType.EXPENSE: return { color: 'text-red-500', sign: '-' };
        case TransactionType.DEBT: return { color: 'text-purple-500', sign: '+' };
        case TransactionType.REPAYMENT: return { color: 'text-amber-500', sign: '-' };
        default: return { color: 'text-slate-500', sign: '' };
      }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-slate-50 to-white relative">
      
      {successResult ? (
        <div className="w-full max-w-sm animate-in zoom-in-95 duration-300">
           <div className="bg-white rounded-[2rem] shadow-xl shadow-indigo-100 p-8 text-center border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
               
               <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
                   <CheckCircle2 size={40} />
               </div>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-2">已自动记账</h3>
               <p className="text-slate-400 text-sm mb-8">交易已保存到您的账本</p>
               
               <div className="bg-slate-50 rounded-3xl p-6 mb-8">
                   <div className="flex flex-col items-center gap-2 mb-4">
                       <span className="text-slate-500 font-bold text-sm">{successResult.category}</span>
                       <div className={`text-4xl font-bold ${getResultStyle(successResult.type).color}`}>
                           {getResultStyle(successResult.type).sign}¥{successResult.amount.toLocaleString()}
                       </div>
                   </div>
                   <div className="text-slate-600 font-medium bg-white py-2 px-4 rounded-xl border border-slate-100 inline-block text-sm max-w-full truncate">
                       {successResult.note}
                   </div>
               </div>
               
               <button 
                  onClick={() => { setSuccessResult(null); setTempTranscript(''); }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all"
               >
                   继续记账
               </button>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-md">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
            {isProcessing ? (
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
            ) : isRecording ? (
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-50"></div>
            ) : (
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
            )}
            <Sparkles className={`w-10 h-10 ${isProcessing ? 'text-indigo-400' : isRecording ? 'text-red-500' : 'text-indigo-600'}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">DeepSeek 智能助手</h2>
          <p className="text-slate-500 text-center mb-12 text-sm min-h-[40px]">
             {tempTranscript ? (
                 <span className="text-slate-800 font-medium animate-pulse">"{tempTranscript}"</span>
             ) : (
                 mode === 'VOICE' ? (
                    <>点击下方按钮说出消费 <br/><span className="text-slate-400 text-xs mt-1 block">"刚在淘宝花了299买鞋，用花呗付的"</span></>
                 ) : (
                    <>输入交易详情 <br/><span className="text-slate-400 text-xs mt-1 block">"收到工资一万五"</span></>
                 )
             )}
          </p>

          <div className="w-full relative h-40 flex items-center justify-center">
              {mode === 'VOICE' ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`
                      w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 select-none
                      ${isRecording 
                        ? 'bg-red-500 scale-110 ring-8 ring-red-100 shadow-red-200' 
                        : isProcessing 
                          ? 'bg-slate-200 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 ring-8 ring-indigo-50 shadow-indigo-200 active:scale-95'}
                    `}
                  >
                    {isProcessing ? (
                      <Loader2 className="text-slate-400 animate-spin w-8 h-8" />
                    ) : (
                      <Mic className="text-white w-10 h-10" />
                    )}
                  </button>
              ) : (
                  <div className="w-full flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
                      <input 
                        type="text" 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="例如: 早餐花了15元..."
                        onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                        autoFocus
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                      />
                      <button 
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim() || isProcessing}
                        className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
                      >
                          {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                      </button>
                  </div>
              )}
          </div>

          <div className="mt-8 flex items-center gap-6">
              <button 
                onClick={() => setMode(mode === 'VOICE' ? 'TEXT' : 'VOICE')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-500 text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all"
              >
                  {mode === 'VOICE' ? <Keyboard size={16} /> : <Mic size={16} />}
                  <span>{mode === 'VOICE' ? '切换键盘' : '切换语音'}</span>
              </button>
          </div>
          
          <p className={`mt-6 text-sm font-bold transition-all ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
            {statusMessage}
          </p>
        </div>
      )}
    </div>
  );
};