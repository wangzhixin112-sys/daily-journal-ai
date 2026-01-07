import React, { useState, useEffect, useRef } from 'react';
// Fix: Import ImageIcon directly as 'Image' is not exported from Icons module, only ImageIcon is.
import { Mic, Loader2, Sparkles, CheckCircle2, Keyboard, Send, AlertCircle, Lock, Camera, ImageIcon, X } from './Icons';
import { parseTransaction } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';

interface Props {
  onAddTransaction: (data: Omit<Transaction, 'id' | 'userId'> & { babyName?: string, dueDate?: string }) => void;
  currentUserId: string;
  readOnly?: boolean;
}

// Type definition for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const VoiceAssistant: React.FC<Props> = ({ onAddTransaction, currentUserId, readOnly = false }) => {
  const [mode, setMode] = useState<'VOICE' | 'TEXT' | 'IMAGE'>('VOICE');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("点击麦克风 或 使用键盘/图片");
  const [textInput, setTextInput] = useState('');
  const [tempTranscript, setTempTranscript] = useState(''); // Live transcript feedback
  const [browserSupport, setBrowserSupport] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Store the full result for display
  const [successResult, setSuccessResult] = useState<{
    amount: number;
    type: TransactionType;
    category: string;
    note: string;
  } | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        } else if (event.error === 'network') {
          setStatusMessage("网络连接失败 (可能是浏览器服务受限)");
        } else {
          setStatusMessage("识别失败，请重试");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (statusMessage === "正在聆听...") {
             setStatusMessage("点击说话");
        }
      };

      recognitionRef.current = recognition;
    } else {
      setBrowserSupport(false);
      setStatusMessage("当前浏览器不支持原生语音，请使用键盘输入");
      setMode('TEXT');
    }
  }, []);

  const handleVoiceResult = async (text: string) => {
      stopRecording();
      setTempTranscript(text); 
      await processInput(text);
  };

  const startRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSuccessResult(null);
    setTempTranscript('');
    
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.warn("Recognition start error:", e);
        }
    } else {
        alert("您的浏览器不支持原生语音识别，建议使用输入法自带的语音键。");
        setMode('TEXT');
    }
  };

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if(e) e.preventDefault();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || readOnly) return;
    await processInput(textInput);
    setTextInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              // Remove data url prefix for Gemini API
              const base64Data = base64String.split(',')[1];
              setSelectedImage(base64String); // For display
              processInput("", base64Data);
          };
          reader.readAsDataURL(file);
      }
  };

  const processInput = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    
    setIsProcessing(true);
    setStatusMessage(imageBase64 ? "正在识别小票/图片..." : "DeepSeek 正在分析账单...");
    
    try {
      const result = await parseTransaction(text, imageBase64);

      if (result.amount === 0 && !imageBase64) {
          setStatusMessage("未能识别到金额，请重试 (例如: '买菜30元')");
          return;
      }

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
      setStatusMessage(mode === 'VOICE' ? "点击说话" : "发送");
      setSelectedImage(null); // Clear image after processing
    } catch (error) {
      console.error(error);
      setStatusMessage("解析失败，请检查网络或重试");
      setSelectedImage(null);
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

  if (readOnly) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Lock size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-2">暂无记账权限</h3>
              <p className="text-sm text-center max-w-xs">您当前是“仅查看”模式，请联系家庭管理员开启编辑权限。</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-slate-50 to-white relative overflow-y-auto">
      
      {successResult ? (
        <div className="w-full max-w-sm animate-in zoom-in-95 duration-300">
           <div className="bg-white rounded-[2rem] shadow-xl shadow-indigo-100 p-8 text-center border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
               
               <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
                   <CheckCircle2 size={40} />
               </div>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-2">已自动记账</h3>
               <p className="text-slate-400 text-sm mb-8">AI 智能提取详情</p>
               
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
          {/* DeepSeek Branding */}
          <div className="flex items-center gap-2 mb-8 bg-indigo-50 px-4 py-1.5 rounded-full">
               <Sparkles size={14} className="text-indigo-600" />
               <span className="text-xs font-bold text-indigo-700">Powered by Gemini AI</span>
          </div>

          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative transition-all duration-500">
            {isProcessing ? (
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
            ) : isRecording ? (
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-50"></div>
            ) : (
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
            )}
            
            {/* Center Icon based on Mode */}
            {isProcessing ? (
               <Loader2 className="text-indigo-400 w-10 h-10 animate-spin" />
            ) : selectedImage ? (
               <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-indigo-200">
                   <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-80" />
               </div>
            ) : (
               mode === 'VOICE' ? <Mic className={`w-10 h-10 ${isRecording ? 'text-red-500' : 'text-indigo-600'}`} /> : 
               mode === 'IMAGE' ? <Camera className="w-10 h-10 text-indigo-600" /> :
               <Keyboard className="w-10 h-10 text-indigo-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {mode === 'IMAGE' ? '拍照记账' : 'AI 智能记账'}
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm min-h-[40px] px-4">
             {tempTranscript ? (
                 <span className="text-slate-800 font-medium animate-pulse">"{tempTranscript}"</span>
             ) : (
                 mode === 'VOICE' ? (
                    <>点击下方按钮说话 <br/><span className="text-slate-400 text-xs mt-2 block bg-slate-50 py-1 px-2 rounded-lg">提示：国内安卓请优先使用下方“切换键盘”进行语音输入</span></>
                 ) : mode === 'IMAGE' ? (
                    <>上传购物小票或发票 <br/><span className="text-slate-400 text-xs mt-1 block">AI 自动提取商家、金额和分类</span></>
                 ) : (
                    <>输入交易详情 <br/><span className="text-slate-400 text-xs mt-1 block">"刚还了五千块房贷，下个月15号到期"</span></>
                 )
             )}
          </p>

          <div className="w-full relative h-40 flex items-center justify-center">
              {mode === 'VOICE' && (
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
                    <Mic className="text-white w-10 h-10" />
                  </button>
              )}

              {mode === 'TEXT' && (
                  <div className="w-full flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex-1 relative">
                        <input 
                            type="text" 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="输入交易信息..."
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                            autoFocus
                            className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-5 pr-10 py-4 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                        />
                      </div>
                      <button 
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim() || isProcessing}
                        className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
                      >
                          {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                      </button>
                  </div>
              )}

              {mode === 'IMAGE' && (
                  <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4">
                      <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 rounded-[2rem] bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer gap-2"
                      >
                          <div className="bg-white p-3 rounded-full shadow-sm">
                              <ImageIcon className="text-indigo-500 w-6 h-6" />
                          </div>
                          <span className="text-indigo-600 font-bold text-sm">点击上传图片</span>
                      </button>
                  </div>
              )}
          </div>

          {/* Mode Switcher */}
          <div className="mt-8 flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => { setMode('VOICE'); setStatusMessage("点击麦克风说话"); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${mode === 'VOICE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <Mic size={14} /> 语音
              </button>
              <button 
                onClick={() => { setMode('TEXT'); setStatusMessage("输入文字"); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${mode === 'TEXT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <Keyboard size={14} /> 键盘
              </button>
              <button 
                onClick={() => { setMode('IMAGE'); setStatusMessage("上传图片识别"); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${mode === 'IMAGE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <Camera size={14} /> 拍照
              </button>
          </div>
          
          <div className="mt-6 text-center">
             <p className={`text-sm font-bold transition-all ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                {statusMessage}
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
