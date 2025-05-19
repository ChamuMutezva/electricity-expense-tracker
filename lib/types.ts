// Types for electricity readings and token purchases

export interface ElectricityReading {
  id: number
  reading_id: string
  timestamp: Date
  reading: number
  period: "morning" | "evening" | "night"
  created_at?: Date
}

export interface TokenPurchase {
  id: number
  token_id: string
  timestamp: Date
  units: number
  new_reading: number
  created_at?: Date
}

// Database result types
export interface ElectricityReadingDBResult {
  id: number
  reading_id: string
  timestamp: string
  reading: number | string
  period: string
  created_at?: string
}

export interface TokenPurchaseDBResult {
  id: number
  token_id: string
  timestamp: string
  units: number | string
  new_reading: number | string
  created_at?: string
}

export interface MonthlyUsageDBResult {
  month: string
  usage: number | string
}

// Interfaces for local storage data structure
export interface LocalStorageElectricityReading {
  id?: string | number
  reading_id?: string
  timestamp: string | number | Date
  reading: number
  period: "morning" | "evening" | "night"
}

export interface LocalStorageTokenPurchase {
  id?: string | number
  token_id?: string
  timestamp: string | number | Date
  units: number
  newReading?: number
  new_reading?: number
}

export interface DailyUsage {
  date: string
  morning?: number
  evening?: number
  night?: number
  total: number
}

export interface UsageSummary {
  averageUsage: number
  peakUsageDay: {
    date: string
    usage: number
  }
  totalTokensPurchased: number
  dailyUsage: DailyUsage[]
}