import axios, { AxiosError } from 'axios';
import {
  User,
  AuthResponse,
  Category,
  Transaction,
  TransactionPagination,
  TransactionFilterParams,
  BudgetStatus,
  RecurringTransaction,
  DashboardData,
  InsightsReport,
  CSVImportRow,
  CSVImportPreviewResponse,
  CSVImportResult
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spendwise_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 Unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('spendwise_token');
      localStorage.removeItem('spendwise_user');
      window.dispatchEvent(new Event('spendwise_logout'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: { email: string; full_name: string; password: string; currency?: string }): Promise<User> => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { full_name?: string; currency?: string }): Promise<User> => {
    const res = await api.put<User>('/auth/me', data);
    return res.data;
  },
  changePassword: async (data: { current_password: string; new_password: string }) => {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  }
};

export const transactionsApi = {
  list: async (params: TransactionFilterParams = {}): Promise<TransactionPagination> => {
    const res = await api.get<TransactionPagination>('/transactions', { params });
    return res.data;
  },
  get: async (id: number): Promise<Transaction> => {
    const res = await api.get<Transaction>(`/transactions/${id}`);
    return res.data;
  },
  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.post<Transaction>('/transactions', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.put<Transaction>(`/transactions/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  }
};

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>('/categories');
    return res.data;
  },
  create: async (data: { name: string; type: string; color: string; icon: string }): Promise<Category> => {
    const res = await api.post<Category>('/categories', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Category>): Promise<Category> => {
    const res = await api.put<Category>(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  }
};

export const budgetsApi = {
  list: async (month?: string): Promise<BudgetStatus[]> => {
    const res = await api.get<BudgetStatus[]>('/budgets', { params: { month } });
    return res.data;
  },
  createOrUpdate: async (data: { category_id?: number | null; month: string; amount: number; alert_threshold?: number }): Promise<BudgetStatus> => {
    const res = await api.post<BudgetStatus>('/budgets', data);
    return res.data;
  },
  update: async (id: number, data: { amount?: number; alert_threshold?: number }): Promise<BudgetStatus> => {
    const res = await api.put<BudgetStatus>(`/budgets/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  }
};

export const recurringApi = {
  list: async (): Promise<RecurringTransaction[]> => {
    const res = await api.get<RecurringTransaction[]>('/recurring');
    return res.data;
  },
  create: async (data: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
    const res = await api.post<RecurringTransaction>('/recurring', data);
    return res.data;
  },
  update: async (id: number, data: Partial<RecurringTransaction>): Promise<RecurringTransaction> => {
    const res = await api.put<RecurringTransaction>(`/recurring/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring/${id}`);
  },
  processDue: async () => {
    const res = await api.post('/recurring/process-due');
    return res.data;
  }
};

export const analyticsApi = {
  getDashboard: async (month?: string): Promise<DashboardData> => {
    const res = await api.get<DashboardData>('/analytics/dashboard', { params: { month } });
    return res.data;
  },
  getInsights: async (month?: string): Promise<InsightsReport> => {
    const res = await api.get<InsightsReport>('/analytics/insights', { params: { month } });
    return res.data;
  }
};

export const csvApi = {
  getExportUrl: (params: { start_date?: string; end_date?: string; type?: string; category_id?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.type) searchParams.append('type', params.type);
    if (params.category_id) searchParams.append('category_id', params.category_id.toString());
    return `/api/csv/export?${searchParams.toString()}`;
  },
  preview: async (file: File): Promise<CSVImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<CSVImportPreviewResponse>('/csv/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  import: async (rows: CSVImportRow[], skipDuplicates = true): Promise<CSVImportResult> => {
    const res = await api.post<CSVImportResult>('/csv/import', rows, {
      params: { skip_duplicates: skipDuplicates }
    });
    return res.data;
  }
};

export const seedApi = {
  seedDemoData: async () => {
    const res = await api.post('/seed/demo-data');
    return res.data;
  },
  resetData: async () => {
    const res = await api.delete('/seed/reset-data');
    return res.data;
  }
};

export default api;
