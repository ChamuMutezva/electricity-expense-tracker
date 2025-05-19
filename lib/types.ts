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
