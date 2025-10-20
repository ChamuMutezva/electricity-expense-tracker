"use client";

import { useCallback } from "react";
import { useElectricity } from "@/contexts/ElectricityContext";
import { migrateFromLocalStorage } from "@/actions/electricity-actions";
import { useToast } from "@/hooks/use-toast";
import type {
    ElectricityReading,
    LocalStorageElectricityReading,
    LocalStorageTokenPurchase,
    TokenPurchase,
} from "@/lib/types";

export function useDataMigration(
    dbConnected: boolean,
    clearElectricityData: () => void
) {
    const { dispatch } = useElectricity();
    const { toast } = useToast();

    const handleMigrateData = useCallback(async () => {
        try {
            const savedReadings = localStorage.getItem("electricityReadings");
            const savedTokens = localStorage.getItem("electricityTokens");

            if (!savedReadings && !savedTokens) {
                dispatch({ type: "SET_SHOW_MIGRATION_ALERT", payload: false });
                return;
            }

            dispatch({ type: "SET_IS_SUBMITTING", payload: true });

            const localReadings: ElectricityReading[] = savedReadings
                ? JSON.parse(savedReadings).map(
                      (r: LocalStorageElectricityReading) => ({
                          reading_id:
                              r.reading_id ||
                              r.id?.toString() ||
                              `reading-${Date.now()}-${Math.random()
                                  .toString(36)
                                  .substring(2, 9)}`,
                          timestamp: new Date(r.timestamp),
                          reading: r.reading,
                          period: r.period,
                      })
                  )
                : [];

            const localTokens: TokenPurchase[] = savedTokens
                ? JSON.parse(savedTokens).map(
                      (t: LocalStorageTokenPurchase) => ({
                          token_id:
                              t.token_id ||
                              t.id?.toString() ||
                              `token-${Date.now()}-${Math.random()
                                  .toString(36)
                                  .substring(2, 9)}`,
                          timestamp: new Date(t.timestamp),
                          units: t.units,
                          new_reading: t.new_reading || t.newReading || 0,
                      })
                  )
                : [];

            if (dbConnected) {
                const success = await migrateFromLocalStorage(
                    localReadings,
                    localTokens
                );

                if (success) {
                    clearElectricityData();
                    dispatch({
                        type: "SET_SHOW_MIGRATION_ALERT",
                        payload: false,
                    });

                    toast({
                        title: "Data Migrated",
                        description:
                            "Your local data has been successfully migrated to the database.",
                    });

                    globalThis.location.reload();
                } else {
                    throw new Error("Migration failed");
                }
            } else {
                toast({
                    title: "Database Not Connected",
                    description:
                        "Cannot migrate data because database is not connected.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Migration error:", error);
            toast({
                title: "Migration Failed",
                description: "Failed to migrate data. Please try again.",
                variant: "destructive",
            });
        } finally {
            dispatch({ type: "SET_IS_SUBMITTING", payload: false });
        }
    }, [dbConnected, dispatch, toast, clearElectricityData]);

    return { handleMigrateData };
}
