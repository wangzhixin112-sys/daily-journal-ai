import { AiParsingResult, TransactionType } from "../types";

// DeepSeek API 配置
// 官方 Endpoint: https://api.deepseek.com/chat/completions
const API_ENDPOINT = "https://api.deepseek.com/chat/completions";
const API_KEY = process.env.API_KEY; // 请确保环境变量中配置了 DeepSeek 的 API Key

/**
 * Parses natural language text into a structured transaction using DeepSeek.
 */
export const parseTransaction = async (input: string | { audioData: string, mimeType: string }): Promise<AiParsingResult> => {
  // DeepSeek 接口主要处理文本，音频需在前端通过 Web Speech API 转换
  const textInput = typeof input === 'string' ? input : "无法处理音频数据，请重试";

  if (!API_KEY) {
    throw new Error("API Key 未配置，无法调用 AI 服务");
  }

  // 构建更适合 DeepSeek 的中文提示词
  const systemPrompt = `
    你是一个专业的家庭记账助手。请从用户的自然语言描述中提取交易信息，并严格按照 JSON 格式输出。
    
    输出 JSON Schema:
    {
      "amount": number, // 金额 (纯数字)
      "type": "EXPENSE" | "INCOME" | "DEBT" | "REPAYMENT",
      "category": string, // 交易分类，如：餐饮美食、交通出行、日用百货、人情红包、工资薪水等
      "note": string, // 简短备注
      "date": string, // ISO 8601 格式日期 (YYYY-MM-DDTHH:mm:ss.sssZ)
      "dueDate": string | null, // 仅针对借贷(DEBT)的还款截止日
      "babyName": string | null // 如果涉及特定宝宝的支出，提取名字
    }

    当前时间参考: ${new Date().toISOString()}
    
    识别规则：
    1. 金额识别：支持中文单位（如"三千五"->3500, "1万2"->12000, "3块8"->3.8）。
    2. 类型判断：
       - "买菜"、"交房租"、"给宝宝买奶粉" -> EXPENSE (支出)
       - "发工资"、"理财收益"、"收到红包" -> INCOME (收入)
       - "借了小明钱"、"刷信用卡"、"花呗支付" -> DEBT (负债/借入)
       - "还信用卡"、"还房贷"、"还钱" -> REPAYMENT (还款)
    3. 日期推断：
       - "昨天" -> 推算为昨天的日期
       - 未提及时间 -> 默认为当前时间
  `;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: textInput }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1 // 低温度以保证格式稳定
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI 服务请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("AI 返回内容为空");

    // 增强解析：移除可能存在的 Markdown 代码块标记 (```json ... ```)
    const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
    
    let parsed;
    try {
        parsed = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Raw Content:", content);
        throw new Error("AI 返回格式异常");
    }
    
    return {
      amount: parsed.amount,
      type: parsed.type as TransactionType,
      category: parsed.category,
      note: parsed.note,
      date: parsed.date || new Date().toISOString(),
      dueDate: parsed.dueDate,
      babyName: parsed.babyName
    };

  } catch (error) {
    console.error("DeepSeek Parsing Error:", error);
    throw error;
  }
};

/**
 * Provides financial advice using DeepSeek.
 */
export const getFinancialAdvice = async (summary: string): Promise<string> => {
  if (!API_KEY) return "请配置 API Key 以获取建议";

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个贴心的中国家庭理财顾问。根据用户的财务概况，给出简短（100字以内）、具有建设性的理财或省钱建议。语气要亲切、鼓励，考虑到房贷、育儿等中国家庭常见压力。" },
          { role: "user", content: summary }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) return "AI 顾问暂时离线";

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "暂无建议";

  } catch (error) {
    console.error("AI Advice Error:", error);
    return "网络连接异常，无法获取建议。";
  }
};