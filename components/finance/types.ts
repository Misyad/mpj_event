export type FinanceTransactionType = 'income' | 'expense'

export type Category = {
  id: string
  name: string
  type: FinanceTransactionType
}

export type FinanceTransaction = {
  id: string
  type: FinanceTransactionType
  source: string
  categoryId: string
  categoryName: string | null
  paymentId: string | null
  amount: number
  title: string
  description: string | null
  transactionDate: string | null
  proofUrl: string | null
  status: 'posted' | 'void'
}

export type FinanceSummary = {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

export type FinanceResponse = {
  summary: FinanceSummary
  transactions: FinanceTransaction[]
  categories: Category[]
}

export type TransactionFormState = {
  type: FinanceTransactionType
  categoryId: string
  title: string
  amount: string
  description: string
  transactionDate: string
  proofUrl: string
}

export type TransactionFormErrors = Partial<Record<keyof TransactionFormState | 'proofFile' | 'submit', string>>

export const DEFAULT_TRANSACTION_FORM: TransactionFormState = {
  type: 'income',
  categoryId: '',
  title: '',
  amount: '',
  description: '',
  transactionDate: '',
  proofUrl: '',
}

export const EMPTY_FINANCE_SUMMARY: FinanceSummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  transactionCount: 0,
}
