import { ElectricityState, ElectricityAction } from "@/lib/types";

export const initialElectricityState = {
    isLoading: true,
    isSubmitted: false,
    isSubmitting: false,
    showMigrationAlert: false,
    showNotification: false,
    activeTab: "dashboard",
    missedReadings: [],
    tokenUnits: "",
    tokenCost: "",
    currentReading: "",
    timeUntilUpdate: "",
    tokens: [],
    totalUnits: 0,
    latestReading: 0,
    nextUpdate: null,
    readings: [],
};

export function reducer(state: ElectricityState, action: ElectricityAction) {
    switch (action.type) {
        case "SET_LOADING":
            return {
                ...state,
                isLoading: action.payload,
            };
        case "SET_IS_SUBMITTED":
            return {
                ...state,
                isSubmitted: action.payload,
            };
        case "SET_IS_SUBMITTING":
            return {
                ...state,
                isSubmitting: action.payload,
            };
        case "SET_SHOW_MIGRATION_ALERT":
            return {
                ...state,
                showMigrationAlert: action.payload,
            };
        case "SET_SHOW_NOTIFICATION":
            return {
                ...state,
                showNotification: action.payload,
            };
        case "SET_ACTIVE_TAB":
            return {
                ...state,
                activeTab: action.payload,
            };
        case "SET_MISSED_READINGS":
            return {
                ...state,
                missedReadings: action.payload,
            };
        case "SET_TOKEN_UNITS":
            return {
                ...state,
                tokenUnits: action.payload,
            };
        case "SET_TOKEN_COST":
            return {
                ...state,
                tokenCost: action.payload,
            };
        case "SET_CURRENT_READING":
            return {
                ...state,
                currentReading: action.payload,
            };
        case "SET_TIME_UNTIL_UPDATE":
            return {
                ...state,
                timeUntilUpdate: action.payload,
            };
        case "SET_TOKENS":
            return {
                ...state,
                tokens: action.payload,
            };
        case "ADD_TOKEN":
            return {
                ...state,
                tokens: [...state.tokens, action.payload],
            };
        case "SET_TOTAL_UNITS":
            return {
                ...state,
                totalUnits: action.payload,
            };
        case "SET_LATEST_READING":
            return {
                ...state,
                latestReading: action.payload,
            };
        case "SET_NEXT_UPDATE":
            return {
                ...state,
                nextUpdate: action.payload,
            };
        case "SET_READINGS":
            return {
                ...state,
                readings: action.payload,
            };
        case "ADD_NEW_READING":
            return {
                ...state,
                readings: [...state.readings, action.payload],
            };
        case "UPDATE_READING":
            return {
                ...state,
                readings: state.readings.map((r) =>
                    r.reading_id === action.payload.readingId
                        ? action.payload.updatedReading
                        : r
                ),
            };
        default:
            return state;
    }
}
