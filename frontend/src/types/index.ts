export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  user_id?: number | null;
  name: string;
  type: 'expense' | 'income' | 'both';
  color: string;
  icon: string;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  payment_method: string;
  notes?: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface TransactionPagination {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface TransactionFilterParams {
  page?: number;
  size?: number;
  search?: string;
  category_id?: number;
  type?: 'income' | 'expense';
  start_date?: string;
  end_date?: string;
  sort_by?: 'date' | 'amount' | 'description' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface BudgetStatus {
  id: number;
  user_id: number;
  category_id?: number | null;
  month: string;
  amount: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

export interface RecurringTransaction {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  next_due_date: string;
  payment_method: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface StatCardSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  savings_rate: number;
  total_budgeted: number;
  budget_usage_percent: number;
}

export interface CategorySpendItem {
  category_id: number;
  category_name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

export interface MonthlyCashFlowItem {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface DailySpendItem {
  date: string;
  amount: number;
}

export interface DashboardData {
  summary: StatCardSummary;
  recent_transactions: Transaction[];
  category_breakdown: CategorySpendItem[];
  monthly_cash_flow: MonthlyCashFlowItem[];
  daily_spending: DailySpendItem[];
  budget_alerts: BudgetStatus[];
}

export interface SpendingInsightItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  description: string;
  metric?: string;
  impact?: string;
}

export interface BurnRateProjection {
  days_elapsed: number;
  days_in_month: number;
  current_spent: number;
  average_daily_spend: number;
  projected_month_end_spend: number;
  current_income: number;
  projected_surplus_or_deficit: number;
}

export interface InsightsReport {
  month: string;
  rule_based_insights: SpendingInsightItem[];
  burn_rate_projection: BurnRateProjection;
  ai_summary: string;
  ai_powered: boolean;
}

export interface CSVImportRow {
  row_number: number;
  date: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  payment_method: string;
  notes?: string | null;
  is_duplicate: boolean;
  validation_error?: string | null;
}

export interface CSVImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  error_rows: number;
  rows: CSVImportRow[];
}

export interface CSVImportResult {
  imported_count: number;
  skipped_duplicates_count: number;
  failed_count: number;
  messages: string[];
}
