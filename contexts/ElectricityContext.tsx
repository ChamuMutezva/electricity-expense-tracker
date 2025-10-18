"use client";

import type React from "react";

import {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import {
    reducer,
    initialElectricityState,
} from "@/app/utility/electricityReducer";
import type {
    ElectricityState,
    ElectricityAction,
    ElectricityReading,
    TokenPurchase,
} from "@/lib/types";
import {
    parseLocalStorageReadings,
    parseLocalStorageTokens,
} from "@/lib/storage";

interface ElectricityContextType {
    state: ElectricityState;
    dispatch: React.Dispatch<ElectricityAction>;
}

const ElectricityContext = createContext<ElectricityContextType | undefined>(
    undefined
);

interface ElectricityProviderProps {
    children: ReactNode;
    initialReadings: ElectricityReading[];
    initialTokens: TokenPurchase[];
    initialLatestReading: number;
    initialTotalUnits: number;
    dbConnected: boolean;
}

export function ElectricityProvider({
    children,
    initialReadings,
    initialTokens,
    initialLatestReading,
    initialTotalUnits,
    dbConnected,
}: Readonly<ElectricityProviderProps>) {
    const [state, dispatch] = useReducer(reducer, initialElectricityState);

    // Initialize data on mount - consolidate into single effect
    useEffect(() => {
        if (dbConnected) {
            // Load from database
            dispatch({ type: "SET_READINGS", payload: initialReadings });
            dispatch({ type: "SET_TOKENS", payload: initialTokens });
            dispatch({
                type: "SET_LATEST_READING",
                payload: initialLatestReading,
            });
            dispatch({ type: "SET_TOTAL_UNITS", payload: initialTotalUnits });
        } else {
            // Load from localStorage
            const localReadings = parseLocalStorageReadings(
                localStorage.getItem("electricityReadings")
            );
            const localTokens = parseLocalStorageTokens(
                localStorage.getItem("electricityTokens")
            );

            dispatch({ type: "SET_READINGS", payload: localReadings });
            dispatch({ type: "SET_TOKENS", payload: localTokens });
        }
    }, [
        dbConnected,
        initialReadings,
        initialTokens,
        initialLatestReading,
        initialTotalUnits,
    ]);

    // Persist to localStorage only when not using database
    useEffect(() => {
        if (!dbConnected) {
            localStorage.setItem(
                "electricityReadings",
                JSON.stringify(state.readings)
            );
            localStorage.setItem(
                "electricityTokens",
                JSON.stringify(state.tokens)
            );
        }
    }, [state.readings, state.tokens, dbConnected]);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({ state, dispatch }),
        [state, dispatch]
    );

    return (
        <ElectricityContext.Provider value={contextValue}>
            {children}
        </ElectricityContext.Provider>
    );
}

export function useElectricity() {
    const context = useContext(ElectricityContext);
    if (context === undefined) {
        throw new Error(
            "useElectricity must be used within an ElectricityProvider"
        );
    }
    return context;
}
