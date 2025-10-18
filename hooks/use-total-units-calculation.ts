"use client";

import { useEffect } from "react";
import { useElectricity } from "@/contexts/ElectricityContext";
import { getTotalUnitsUsed } from "@/actions/electricity-actions";

export function useTotalUnitsCalculation(dbConnected: boolean) {
    const { dispatch } = useElectricity();

    useEffect(() => {
        const fetchTotalUnits = async () => {
            if (!dbConnected) return;

            try {
                dispatch({ type: "SET_LOADING", payload: true });
                const data = await getTotalUnitsUsed();
                dispatch({ type: "SET_TOTAL_UNITS", payload: data });
            } catch (error) {
                console.error("Error fetching total units:", error);
            } finally {
                dispatch({ type: "SET_LOADING", payload: false });
            }
        };

        fetchTotalUnits();
    }, [dbConnected, dispatch]);
}
