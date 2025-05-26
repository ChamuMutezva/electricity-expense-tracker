import {
    ElectricityReading,
    LocalStorageElectricityReading,
    LocalStorageTokenPurchase,
    TokenPurchase,
} from "./types";

export function parseLocalStorageReadings(
    savedReadings: string | null
): ElectricityReading[] {
    if (!savedReadings) return [];
    try {
        const parsed: LocalStorageElectricityReading[] =
            JSON.parse(savedReadings);
        return parsed.map((r) => ({
            id:
                typeof r.id === "number"
                    ? r.id
                    : Number.parseInt(r.id as string) || Date.now(),
            reading_id:
                r.reading_id ??
                `reading-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`,
            timestamp: new Date(r.timestamp),
            reading: r.reading,
            period: r.period,
        }));
    } catch (error) {
        console.error("Error parsing readings from local storage:", error);
        return [];
    }
}

export function parseLocalStorageTokens(
    savedTokens: string | null
): TokenPurchase[] {
    if (!savedTokens) return [];
    try {
        const parsed: LocalStorageTokenPurchase[] = JSON.parse(savedTokens);
        return parsed.map((t) => ({
            id:
                typeof t.id === "number"
                    ? t.id
                    : Number.parseInt(t.id as string) || Date.now(),
            token_id:
                t.token_id ??
                `token-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`,
            timestamp: new Date(t.timestamp),
            units: t.units,
            new_reading: t.new_reading ?? t.newReading ?? 0,
            total_cost: t.total_cost ?? 0,
        }));
    } catch (error) {
        console.error("Error parsing tokens from local storage:", error);
        return [];
    }
}
