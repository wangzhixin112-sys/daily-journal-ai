import { AiParsingResult, TransactionType, Category } from "../types";

// Helper to get dynamic client configuration
const getClientConfig = () => {
    // In Vite, environment variables need to start with VITE_
    let apiKey = import.meta.env.VITE_API_KEY;
    let apiUrl = import.meta.env.VITE_BAIDU_API_URL;

    // Try to get from LocalStorage (User overrides)
    if (typeof window !== 'undefined') {
        const storedKey = localStorage.getItem('gf_user_api_key');
        const storedUrl = localStorage.getItem('gf_user_base_url');
        if (storedKey) apiKey = storedKey;
        if (storedUrl) apiUrl = storedUrl;
    }

    return {
        apiKey: apiKey,
        apiUrl: apiUrl || "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed"
    };
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
  // Check if we have a key (either env or stored)
  const config = getClientConfig();
  const hasKey = config.apiKey;

  if (!hasKey) {
      console.warn("No API Key configured, using local fallback.");
      return mockLocalParse(textInput);
  }

  try {
    // 当前仅支持文本输入，图片输入使用本地兜底方案
    if (imageBase64) {
      console.warn("Image input is not supported with Baidu API, using local fallback.");
      return mockLocalParse(textInput);
    }

    // 百度文心一言API请求体
    const requestBody = {
      messages: [
        {
          role: "system",
          content: "你是一个家庭会计师，需要根据用户提供的交易文本提取交易详情。请严格按照JSON格式返回，不要添加任何额外的解释或说明。"
        },
        {
          role: "user",
          content: `Current Time: ${new Date().toISOString()}. Analyze this transaction text: "${textInput}". Extract the following fields: amount (number), type (EXPENSE/INCOME/DEBT/REPAYMENT), category (one of: ${Object.values(Category).join(', ')}), note (string), date (ISO string). Return JSON only.`
        }
      ],
      temperature: 0.3
    };

    // 构建完整的API请求URL
    const apiUrl = `${config.apiUrl}?access_token=${config.apiKey}`;

    // 调用百度文心一言API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // 百度文心一言API返回的result字段已经是直接的文本，不需要parse
    const resultText = data.result || "";
    
    // 从响应文本中提取JSON
    let result = null;
    try {
      // 尝试直接解析result字段
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.warn("Failed to parse JSON from Baidu API response, trying to extract JSON.", parseError);
      // 尝试从文本中提取JSON（如果有额外说明）
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    }

    if (result && result.amount && result.type && result.category && result.note && result.date) {
        // Ensure date is valid ISO string if AI returns something else
        if (!result.date || isNaN(Date.parse(result.date))) {
            result.date = new Date().toISOString();
        }
        return result as AiParsingResult;
    }
    throw new Error("Invalid response from Baidu API");
  } catch (e) {
    console.warn("AI Parsing failed, using local fallback.", e);
    return mockLocalParse(textInput || "无法识别");
  }
};

export const getFinancialAdvice = async (summary: string): Promise<string> => {
  const config = getClientConfig();
  const hasKey = config.apiKey;
  
  if (!hasKey) return "AI 助手未连接（请配置 API Key）。建议您：1. 检查每月固定支出；2. 为大额消费设定预算。";

  try {
    // 百度文心一言API请求体
    const requestBody = {
      messages: [
        {
          role: "system",
          content: "你是一个贴心的家庭理财顾问。根据用户的收支数据，给出简短、亲切、符合中国国情的理财或省钱建议。控制在100字以内，语气要鼓励和正向。"
        },
        {
          role: "user",
          content: summary
        }
      ],
      temperature: 0.3
    };

    // 构建完整的API请求URL
    const apiUrl = `${config.apiUrl}?access_token=${config.apiKey}`;

    // 调用百度文心一言API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.result || "AI 暂时繁忙，请稍后再试。";
  } catch (e) {
    console.error("Baidu Advice Error:", e);
    return "AI 暂时繁忙，建议您先关注本月的大额支出项，看看是否有缩减空间。";
  }
};