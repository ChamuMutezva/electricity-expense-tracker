// Types for electricity readings and token purchases
export type Period = "morning" | "evening" | "night";
export interface ElectricityReading {
    id: number;
    reading_id: string;
    timestamp: Date;
    reading: number;
    period: Period;
    created_at?: Date;
}

export interface TokenPurchase {
    id: number;
    token_id: string;
    timestamp: Date;
    units: number;
    new_reading: number;
    created_at?: Date;
    total_cost?: number;
}
type CurrentTimeStamp = string | number | Date;
// Interfaces for local storage data structure
export interface LocalStorageElectricityReading {
    id?: string | number;
    reading_id?: string;
    timestamp: CurrentTimeStamp;
    reading: number;
    period: "morning" | "evening" | "night";
}

export interface LocalStorageTokenPurchase {
    id?: string | number;
    token_id?: string;
    timestamp: CurrentTimeStamp;
    units: number;
    newReading?: number;
    new_reading?: number;
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


// Database result types
export interface ElectricityReadingDBResult {
    id: number;
    reading_id: string;
    timestamp: string;
    reading: number | string;
    period: string;
    created_at?: string;
}

export interface TokenPurchaseDBResult {
    id: number;
    token_id: string;
    timestamp: string;
    units: number | string;
    new_reading: number | string;
    created_at?: string;
    total_cost?: number | string;
}

export interface MonthlyUsageDBResult {
    month: string;
    usage: number | string;
}

// Interfaces for local storage data structure
export interface LocalStorageElectricityReading {
    id?: string | number;
    reading_id?: string;
    timestamp: string | number | Date;
    reading: number;
    period: Period;
}

export interface LocalStorageTokenPurchase {
    id?: string | number;
    token_id?: string;
    timestamp: string | number | Date;
    units: number;
    newReading?: number;
    new_reading?: number;
    total_cost?: number;
}

export interface DailyUsage {
    date: string;
    morning?: number;
    evening?: number;
    night?: number;
    total: number;
}

export interface UsageSummary {
    averageUsage: number;
    peakUsageDay: {
        date: string;
        usage: number;
    };
    totalTokensPurchased: number;
    dailyUsage: DailyUsage[];
}
export interface ElectricityTrackerProps {
    initialReadings: ElectricityReading[];
    initialTokens: TokenPurchase[];
    initialLatestReading: number;
    initialTotalUnits: number;
    dbConnected: boolean;
}

export interface ElectricityState {
    isLoading: boolean;
    isSubmitted: boolean;
    isSubmitting: boolean;
    showMigrationAlert: boolean;
    showNotification: boolean;
    activeTab: string;
    missedReadings: string[];
    tokenUnits: string;
    tokenCost: string;
    currentReading: string;
    timeUntilUpdate: string;
    tokens: TokenPurchase[];
    totalUnits: number;
    latestReading: number;
    nextUpdate: Date | null;
    readings: ElectricityReading[];
}
//  const [readings, setReadings] =   useState<ElectricityReading[]>(initialReadings);
export type ElectricityAction =
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_IS_SUBMITTED"; payload: boolean }
    | { type: "SET_IS_SUBMITTING"; payload: boolean }
    | { type: "SET_SHOW_MIGRATION_ALERT"; payload: boolean }
    | { type: "SET_SHOW_NOTIFICATION"; payload: boolean }
    | { type: "SET_ACTIVE_TAB"; payload: string }
    | { type: "SET_MISSED_READINGS"; payload: string[] }
    | { type: "SET_TOKEN_UNITS"; payload: string }
    | { type: "SET_TOKEN_COST"; payload: string }
    | { type: "SET_CURRENT_READING"; payload: string }
    | { type: "SET_TIME_UNTIL_UPDATE"; payload: string }
    | { type: "SET_TOKENS"; payload: TokenPurchase[] }
    | { type: "ADD_TOKEN"; payload: TokenPurchase }
    | { type: "SET_TOTAL_UNITS"; payload: number }
    | { type: "SET_LATEST_READING"; payload: number }
    | { type: "SET_NEXT_UPDATE"; payload: Date }
    | { type: "SET_READINGS"; payload: ElectricityReading[] }
    | { type: "ADD_NEW_READING"; payload: ElectricityReading }
    | {
          type: "UPDATE_READING";
          payload: { readingId: string; updatedReading: ElectricityReading };
      };
