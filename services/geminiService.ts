import { AiParsingResult, TransactionType, Category } from "../types";

// API Request Cache
interface CacheItem {
  data: any;
  timestamp: number;
}

const apiCache: Record<string, CacheItem> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ITEMS = 50; // Maximum number of cache items

// Get cached data if available and not expired
const getCachedData = (key: string): any | null => {
  const item = apiCache[key];
  if (item) {
    const now = Date.now();
    if (now - item.timestamp < CACHE_DURATION) {
      return item.data;
    }
    // Remove expired cache
    delete apiCache[key];
  }
  return null;
};

// Set data to cache with LRU eviction
const setCachedData = (key: string, data: any) => {
  // Check if cache is full
  if (Object.keys(apiCache).length >= MAX_CACHE_ITEMS) {
    // Find the oldest item and remove it
    let oldestKey = '';
    let oldestTime = Date.now();
    for (const [cacheKey, item] of Object.entries(apiCache)) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = cacheKey;
      }
    }
    delete apiCache[oldestKey];
  }
  
  apiCache[key] = {
    data,
    timestamp: Date.now()
  };
};

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
        apiUrl: apiUrl || "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/bce-v3/ALTAK-p6Mh4sderuFthCaIv3W7c/44dd56f122557bed4a92adc4022a15060df95198"
    };
};

// 中文数字转阿拉伯数字
const chineseToArabic = (text: string): number => {
    const chineseNums: Record<string, number> = {
        '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
        '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
        '十': 10, '百': 100, '千': 1000, '万': 10000,
        '两': 2 // 额外支持"两"作为"二"的口语表达
    };
    
    // 处理简单的中文数字，如"十块钱"、"二十元"、"一百块"、"两块五"
    const match = text.match(/(零|一|二|三|四|五|六|七|八|九|十|百|千|万|两)+(\.(零|一|二|三|四|五|六|七|八|九))?[块|元|钱]/);
    if (match) {
        let numText = match[0].replace(/[块|元|钱]/, '');
        const decimalPart = numText.match(/\.(零|一|二|三|四|五|六|七|八|九)/);
        
        // 提取整数部分和小数部分
        const integerPart = decimalPart ? numText.split('.')[0] : numText;
        const decimalValue = decimalPart ? chineseNums[decimalPart[1]] : 0;
        
        let result = 0;
        let temp = 0;
        
        for (let i = 0; i < integerPart.length; i++) {
            const char = integerPart[i];
            const value = chineseNums[char];
            
            if (value >= 10) {
                if (temp === 0) {
                    temp = 1;
                }
                temp *= value;
                result += temp;
                temp = 0;
            } else {
                temp = value;
            }
        }
        
        if (temp > 0) {
            result += temp;
        }
        
        // 特殊处理"十"单独出现的情况
        if (integerPart === '十') {
            result = 10;
        }
        
        // 添加小数部分
        if (decimalValue > 0) {
            result += decimalValue / 10;
        }
        
        return result;
    }
    
    return 0;
};

// 相对时间转ISO字符串
const parseRelativeTime = (text: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 处理相对时间
    if (text.includes('昨天')) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString();
    } else if (text.includes('前天')) {
        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        return dayBeforeYesterday.toISOString();
    } else if (text.includes('今天')) {
        return today.toISOString();
    } else if (text.includes('明天')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString();
    } else if (text.includes('后天')) {
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        return dayAfterTomorrow.toISOString();
    } else if (text.includes('大后天')) {
        const dayAfterDayAfterTomorrow = new Date(today);
        dayAfterDayAfterTomorrow.setDate(dayAfterDayAfterTomorrow.getDate() + 3);
        return dayAfterDayAfterTomorrow.toISOString();
    } else if (text.includes('上周')) {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek.toISOString();
    } else if (text.includes('上周')) {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek.toISOString();
    } else if (text.includes('上月')) {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.toISOString();
    }
    
    // 处理具体日期格式
    
    // 格式：2024-01-01 或 2024/01/01
    const fullDateMatch = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (fullDateMatch) {
        const [, year, month, day] = fullDateMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
    }
    
    // 格式：1月1日 或 1.1 或 1-1
    const shortDateMatch = text.match(/(\d{1,2})[-/.](\d{1,2})/);
    if (shortDateMatch) {
        const [, month, day] = shortDateMatch;
        return new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day)).toISOString();
    }
    
    // 默认返回今天
    return today.toISOString();
};

// 本地规则解析器（作为 AI 的兜底方案）
const mockLocalParse = (text: string): AiParsingResult => {
    // 1. 提取金额 - 先尝试阿拉伯数字，再尝试中文数字
    let amount = 0;
    
    // 尝试提取阿拉伯数字
    const arabicMatch = text.match(/(\d+(\.\d+)?)/);
    if (arabicMatch) {
        amount = parseFloat(arabicMatch[0]);
    } else {
        // 尝试提取中文数字
        amount = chineseToArabic(text);
    }

    // 2. 解析时间
    const date = parseRelativeTime(text);

    // 3. 简单的关键词分类逻辑
    let type = TransactionType.EXPENSE;
    let category = Category.OTHER;
    let babyId: string | undefined = undefined;

    // 关键词库 - 扩展食物分类，添加更多物品支持
    const keywords: Record<string, string> = {
        [Category.FOOD]: '吃|饭|餐|麦当劳|肯德基|外卖|零食|酒|菜|饿|饮|鸡蛋|蛋|米|面|油|盐|酱|醋|肉|鱼|水果|蔬菜|牛奶|面包|蛋糕|饼干|饮料|咖啡|茶|糖|巧克力|坚果|酸奶|果汁|冰淇淋|火锅|烧烤|炒菜|快餐|早餐|午餐|晚餐|夜宵',
        [Category.TRANSPORT]: '车|打车|地铁|公交|油|停车|路费|打车|滴滴|出租车|火车票|飞机票|船票|高铁|动车|轮渡|高速|过路费|停车费|加油|洗车|保养|维修',
        [Category.SHOPPING]: '淘|京|买|超市|日用|纸|洗|衣服|鞋|裤|包|化妆品|护肤品|手表|眼镜|手机|电脑|平板|家电|家具|装饰|礼品|礼物|节日|生日',
        [Category.HOUSING]: '房|电|水|网|宽带|物业|暖气|房租|水电煤|燃气|有线电视|电话|维修|装修|家具|家电',
        [Category.HEALTH]: '药|医|病|体检|医院|诊所|医生|护士|挂号|看病|治疗|手术|检查|药品|保健品|健身|运动|瑜伽|跑步|游泳',
        [Category.SALARY]: '工资|薪|奖金|提成|绩效|年终奖|分红|兼职|副业',
        [Category.RED_PACKET]: '红包|礼金|份子钱|压岁钱|乔迁|结婚|生日|节日',
        [Category.BABY]: '娃|宝|尿布|奶粉|课|早教|玩具|孩子|小朋友|婴儿|幼儿|育儿|早教|辅食|奶瓶|奶嘴|纸尿裤|婴儿车|婴儿床|童装|童鞋|玩具|绘本|早教机|疫苗|体检',
        [Category.CREDIT_CARD]: '信用卡|还款|还信用卡|刷卡|透支|分期|账单|额度|积分|年费|还卡|信用卡还款',
        [Category.MORTGAGE]: '房贷|公积金|商业贷款|月供|首付|利息|还房贷',
        [Category.CAR_LOAN]: '车贷|汽车贷款|车款|月供|还车贷',
        [Category.ENTERTAINMENT]: '玩|电影|游戏|旅游|度假|休闲|KTV|酒吧|演唱会|音乐会|话剧|歌剧|展览|博物馆|公园|景区|门票|电影票|游戏|电竞|直播|会员|充值',
        [Category.EDUCATION]: '书|学习|培训|课程|学费|学校|幼儿园|小学|中学|大学|研究生|培训班|考证|考试|辅导|教材|文具|书本|笔记本|笔|纸|墨水',
        [Category.PET]: '宠物|猫|狗|猫粮|狗粮|宠物用品|宠物医院|宠物美容|疫苗|驱虫',
        [Category.DEPOSIT]: '存入|存款|存钱|存入愿望|心愿存钱|存心愿|存入一笔',
        [Category.OTHER]: '其他|杂项|费用|支出|收入|转账|汇款|现金|转账|微信|支付宝|银行'    };

    // 判断类型
    if (text.match(/收入|工资|奖金|赚|进账|红包|工资|奖金|提成|绩效/)) {
        type = TransactionType.INCOME;
        category = text.match(/红包/) ? Category.RED_PACKET : Category.SALARY;
    } else if (text.match(/还|还款|还信用卡|还房贷|还车贷|信用卡还款/)) {
        type = TransactionType.REPAYMENT;
        // 更精确的还款类型判断
        if (text.match(/信用卡|还卡/)) {
            category = Category.CREDIT_CARD;
        } else if (text.match(/房贷|房贷还款/)) {
            category = Category.MORTGAGE;
        } else if (text.match(/车贷|车贷还款/)) {
            category = Category.CAR_LOAN;
        }
    } else if (text.match(/借入|贷款|借款|欠款/)) {
        type = TransactionType.DEBT;
        category = Category.BORROWING;
    } else if (text.match(/存入|存款|存钱|存入愿望|心愿存钱|存心愿/)) {
        type = TransactionType.INCOME;
        category = Category.DEPOSIT;
    }

    // 解析宝宝信息（如果有）
    const hasBabyKeywords = text.match(/宝宝|娃|孩子|婴儿|奶粉|尿布|玩具|绘本|早教|辅食|奶瓶|奶嘴|纸尿裤|婴儿车|婴儿床|童装|童鞋|早教机|疫苗|体检/);
    if (hasBabyKeywords) {
        // 自动设置为宝宝类别
        category = Category.BABY;
        
        // 尝试从localStorage获取宝宝列表
        if (typeof window !== 'undefined') {
            // 先检查是否有宝宝名称匹配
            const babiesStr = localStorage.getItem('gf_babies');
            if (babiesStr) {
                try {
                    const babies = JSON.parse(babiesStr);
                    // 遍历宝宝列表，检查是否有名称匹配
                    for (const baby of babies) {
                        if (text.includes(baby.name)) {
                            babyId = baby.id;
                            break;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse babies from localStorage', e);
                }
            }
            
            // 如果没有匹配到特定宝宝，使用默认宝宝ID
            if (!babyId) {
                babyId = localStorage.getItem('gf_default_baby_id');
            }
        }
    }
    
    // 特殊处理：如果明确提到了宝宝的名字，即使没有其他宝宝关键词，也设置为宝宝类别
    if (typeof window !== 'undefined') {
        const babiesStr = localStorage.getItem('gf_babies');
        if (babiesStr) {
            try {
                const babies = JSON.parse(babiesStr);
                for (const baby of babies) {
                    if (text.includes(baby.name)) {
                        category = Category.BABY;
                        babyId = baby.id;
                        break;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse babies from localStorage', e);
            }
        }
    }

    // 判断分类 (如果不是收入或债务，或者需要更细致分类)
    // 但如果已经是宝宝类别，就不再修改
    if ((type === TransactionType.EXPENSE || type === TransactionType.REPAYMENT) && category !== Category.BABY) {
        for (const [cat, regexStr] of Object.entries(keywords)) {
            if (new RegExp(regexStr).test(text)) {
                category = cat as Category;
                // 特殊修正：如果是信用卡/贷款相关的关键词，修正类型
                if (cat === Category.MORTGAGE || cat === Category.CAR_LOAN || cat === Category.CREDIT_CARD) {
                     if (text.includes("还")) type = TransactionType.REPAYMENT;
                     else if (text.includes("刷") || text.includes("透支")) { 
                         type = TransactionType.DEBT; 
                         category = Category.CREDIT_CARD; 
                     }
                }
                break;
            }
        }
    }

    // 提取备注（去除金额和时间相关的内容）
    let note = text;
    // 移除金额相关内容
    note = note.replace(/(\d+(\.\d+)?)[元|块|钱]/g, '');
    // 移除时间相关内容
    note = note.replace(/今天|昨天|前天|明天|后天/g, '');
    // 移除多余空格
    note = note.trim();

    return {
        amount,
        type,
        category,
        note: note || text,
        date,
        babyId
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

    // Create cache key
    const cacheKey = `parseTransaction_${textInput}_${config.apiUrl}`;
    
    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log("Using cached result for parseTransaction");
      return cachedResult;
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
        // Cache the result
        setCachedData(cacheKey, result);
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
    // Create cache key
    const cacheKey = `getFinancialAdvice_${summary}_${config.apiUrl}`;
    
    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log("Using cached result for getFinancialAdvice");
      return cachedResult;
    }

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
    const result = data.result || "AI 暂时繁忙，请稍后再试。";
    
    // Cache the result
    setCachedData(cacheKey, result);
    return result;
  } catch (e) {
    console.error("Baidu Advice Error:", e);
    return "AI 暂时繁忙，建议您先关注本月的大额支出项，看看是否有缩减空间。";
  }
};