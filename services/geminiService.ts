import { GoogleGenAI, Type } from "@google/genai";
import { AiParsingResult, TransactionType, Category } from "../types";

// Helper to get dynamic client configuration
// This is crucial for the "Test Version" to allow users to input their own keys/proxies at runtime
// without needing to rebuild the app.
const getClient = () => {
    let apiKey = process.env.API_KEY;
    let baseUrl = process.env.GEMINI_BASE_URL;

    // Try to get from LocalStorage (User overrides)
    if (typeof window !== 'undefined') {
        const storedKey = localStorage.getItem('gf_user_api_key');
        const storedUrl = localStorage.getItem('gf_user_base_url');
        if (storedKey) apiKey = storedKey;
        if (storedUrl) baseUrl = storedUrl;
    }

    return new GoogleGenAI({ 
        apiKey: apiKey,
        // Add Base URL support for reverse proxy (Cloudflare/Nginx)
        baseUrl: baseUrl || undefined 
    });
};

// 本地规则解析器（作为 AI 的兜底方案）
const mockLocalParse = (text: string): AiParsingResult => {
    // 1. 提取金额
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

    // 2. 简单的关键词分类逻辑
    let type = TransactionType.EXPENSE;
    let category = Category.OTHER;

    // 关键词库
    const keywords: Record<string, string> = {
        [Category.FOOD]: '吃|饭|餐|麦当劳|肯德基|外卖|零食|酒|菜|饿|饮',
        [Category.TRANSPORT]: '车|打车|地铁|公交|油|停车|路费',
        [Category.SHOPPING]: '淘|京|买|超市|日用|纸|洗|衣服|鞋|裤',
        [Category.HOUSING]: '房|电|水|网|宽带|物业|暖气',
        [Category.HEALTH]: '药|医|病|体检',
        [Category.SALARY]: '工资|薪|奖金',
        [Category.RED_PACKET]: '红包|礼金',
        [Category.BABY]: '娃|宝|尿布|奶粉|课|早教|玩具',
        [Category.CREDIT_CARD]: '信用卡|还款',
        [Category.MORTGAGE]: '房贷',
        [Category.CAR_LOAN]: '车贷'
    };

    // 判断类型
    if (text.match(/收入|工资|奖金|赚/)) {
        type = TransactionType.INCOME;
        category = Category.SALARY;
    } else if (text.match(/还|信用卡|房贷|车贷/)) {
        type = TransactionType.REPAYMENT;
    } else if (text.match(/借入|贷款/)) {
        type = TransactionType.DEBT;
        category = Category.BORROWING;
    }

    // 判断分类 (如果不是收入或债务，或者需要更细致分类)
    if (type === TransactionType.EXPENSE || type === TransactionType.REPAYMENT) {
        for (const [cat, regexStr] of Object.entries(keywords)) {
            if (new RegExp(regexStr).test(text)) {
                category = cat as Category;
                // 特殊修正：如果是信用卡/贷款相关的关键词，修正类型
                if (cat === Category.MORTGAGE || cat === Category.CAR_LOAN || cat === Category.CREDIT_CARD) {
                     if (text.includes("还")) type = TransactionType.REPAYMENT;
                     else if (text.includes("刷") || text.includes("透支")) { type = TransactionType.DEBT; category = Category.CREDIT_CARD; }
                }
                break;
            }
        }
    }

    // 如果没匹配到且是支出
    if (category === Category.OTHER && type === TransactionType.EXPENSE) {
         if (text.includes("玩") || text.includes("电影")) category = Category.ENTERTAINMENT;
    }

    return {
        amount,
        type,
        category,
        note: text,
        date: new Date().toISOString()
    };
};

export const parseTransaction = async (textInput: string, imageBase64?: string): Promise<AiParsingResult> => {
  const ai = getClient();
  
  // Check if we have a key (either env or stored)
  const hasKey = process.env.API_KEY || (typeof window !== 'undefined' && localStorage.getItem('gf_user_api_key'));

  if (!hasKey) {
      console.warn("No API Key configured, using local fallback.");
      return mockLocalParse(textInput);
  }

  try {
    let contents: any = `Current Time: ${new Date().toISOString()}. Analyze this transaction.`;
    
    if (imageBase64) {
        // Multimodal input
        contents = [
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64
                }
            },
            {
                text: "Analyze this receipt/image. Extract the total amount, infer the category, determine the transaction type, and write a short note summary. Return JSON."
            }
        ];
    } else {
        // Text-only input
        contents = `Current Time: ${new Date().toISOString()}. Analyze this transaction text: "${textInput}"`;
    }

    const response = await ai.models.generateContent({
      model: imageBase64 ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview', // Use vision model for images
      contents: contents,
      config: {
        systemInstruction: "You are a family accountant. Extract transaction details into JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: [TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.DEBT, TransactionType.REPAYMENT] },
            category: { type: Type.STRING, enum: Object.values(Category) },
            note: { type: Type.STRING },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING, nullable: true },
            babyName: { type: Type.STRING, nullable: true }
          },
          required: ["amount", "type", "category", "note", "date"]
        }
      }
    });

    const result = response.text ? JSON.parse(response.text) : null;
    if (result) {
        // Ensure date is valid ISO string if AI returns something else
        if (!result.date || isNaN(Date.parse(result.date))) {
            result.date = new Date().toISOString();
        }
        return result as AiParsingResult;
    }
    throw new Error("Empty response from Gemini");
  } catch (e) {
    console.warn("AI Parsing failed, using local fallback.", e);
    return mockLocalParse(textInput || "无法识别");
  }
};

export const getFinancialAdvice = async (summary: string): Promise<string> => {
  const ai = getClient();
  const hasKey = process.env.API_KEY || (typeof window !== 'undefined' && localStorage.getItem('gf_user_api_key'));
  
  if (!hasKey) return "AI 助手未连接（请配置 API Key）。建议您：1. 检查每月固定支出；2. 为大额消费设定预算。";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: summary,
      config: {
        systemInstruction: "你是一个贴心的家庭理财顾问。根据用户的收支数据，给出简短、亲切、符合中国国情的理财或省钱建议。控制在100字以内，语气要鼓励和正向。",
      }
    });
    return response.text || "AI 暂时繁忙，请稍后再试。";
  } catch (e) {
    console.error("Gemini Advice Error:", e);
    return "AI 暂时繁忙，建议您先关注本月的大额支出项，看看是否有缩减空间。";
  }
};