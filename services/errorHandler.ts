// 错误类型定义
export enum ErrorType {
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 错误接口定义
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  statusCode?: number;
  timestamp: number;
}

// 日志接口定义
export interface AppLog {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
}

// 错误处理服务
export class ErrorHandler {
  // 日志存储（最多保存100条）
  private static logs: AppLog[] = [];
  
  // 错误存储（最多保存50条）
  private static errors: AppError[] = [];
  
  // 保存日志
  private static saveLog(log: AppLog): void {
    this.logs.push(log);
    if (this.logs.length > 100) {
      this.logs.shift(); // 移除最旧的日志
    }
    
    // 在开发环境中打印日志
    if (import.meta.env.DEV) {
      const timestamp = new Date(log.timestamp).toISOString();
      console[log.level.toLowerCase()](`[${timestamp}] [${log.level}] ${log.message}`, log.data || '');
    }
  }
  
  // 保存错误
  private static saveError(error: AppError): void {
    this.errors.push(error);
    if (this.errors.length > 50) {
      this.errors.shift(); // 移除最旧的错误
    }
    
    // 在开发环境中打印错误
    if (import.meta.env.DEV) {
      const timestamp = new Date(error.timestamp).toISOString();
      console.error(`[${timestamp}] [ERROR] ${error.type}: ${error.message}`, error.originalError || '');
    }
  }
  
  // 日志方法
  static debug(message: string, data?: any): void {
    this.saveLog({ level: LogLevel.DEBUG, message, data, timestamp: Date.now() });
  }
  
  static info(message: string, data?: any): void {
    this.saveLog({ level: LogLevel.INFO, message, data, timestamp: Date.now() });
  }
  
  static warn(message: string, data?: any): void {
    this.saveLog({ level: LogLevel.WARN, message, data, timestamp: Date.now() });
  }
  
  static error(message: string, data?: any): void {
    this.saveLog({ level: LogLevel.ERROR, message, data, timestamp: Date.now() });
  }
  
  // 错误处理方法
  static handleApiError(error: any): AppError {
    let errorType = ErrorType.API_ERROR;
    let message = 'API请求失败';
    let statusCode;
    
    if (error.response) {
      // 服务器返回了错误响应
      statusCode = error.response.status;
      message = error.response.data?.message || message;
      
      if (statusCode === 401) {
        errorType = ErrorType.AUTH_ERROR;
        message = '认证失败，请重新登录';
      } else if (statusCode >= 400 && statusCode < 500) {
        errorType = ErrorType.VALIDATION_ERROR;
      } else if (statusCode >= 500) {
        message = '服务器内部错误，请稍后重试';
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorType = ErrorType.NETWORK_ERROR;
      message = '网络连接失败，请检查网络设置';
    }
    
    const appError: AppError = {
      type: errorType,
      message,
      originalError: error,
      statusCode,
      timestamp: Date.now()
    };
    
    this.saveError(appError);
    return appError;
  }
  
  static handleGenericError(error: any): AppError {
    const appError: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || '发生了未知错误',
      originalError: error,
      timestamp: Date.now()
    };
    
    this.saveError(appError);
    return appError;
  }
  
  // 获取日志和错误
  static getLogs(): AppLog[] {
    return [...this.logs];
  }
  
  static getErrors(): AppError[] {
    return [...this.errors];
  }
  
  // 清除日志和错误
  static clearLogs(): void {
    this.logs = [];
  }
  
  static clearErrors(): void {
    this.errors = [];
  }
}

// 便捷方法
export const log = {
  debug: (message: string, data?: any) => ErrorHandler.debug(message, data),
  info: (message: string, data?: any) => ErrorHandler.info(message, data),
  warn: (message: string, data?: any) => ErrorHandler.warn(message, data),
  error: (message: string, data?: any) => ErrorHandler.error(message, data)
};

export const handleError = {
  api: (error: any) => ErrorHandler.handleApiError(error),
  generic: (error: any) => ErrorHandler.handleGenericError(error)
};
