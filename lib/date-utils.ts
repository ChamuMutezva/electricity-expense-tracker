/**
 * Formats a Date object as a string in the format YYYY-MM-DD.
 *
 * @param date - The Date object to format.
 * @returns The formatted date string.
 */
// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Returns the time portion of a Date object as a string in HH:MM format.
 *
 * @param date - The Date object to extract the time from.
 * @returns The formatted time string.
 */
// Get time string in HH:MM format
export function getTimeString(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Calculates the next update time based on the current time.
 * The next update time is set to 7am, 5pm, or 9pm on the current day,
 * or 7am on the next day if the current time is after 9pm.
 *
 * @returns A Date object representing the next update time.
 */
// Get the next update time (7am, 5pm, or 9pm)
export function getNextUpdateTime(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const next = new Date(now);

    // Set to today's date initially
    if (currentHour < 7 || (currentHour === 7 && currentMinute === 0)) {
        // Next update is 7am today
        next.setHours(7, 0, 0, 0);
    } else if (
        currentHour < 17 ||
        (currentHour === 17 && currentMinute === 0)
    ) {
        // Next update is 5pm today
        next.setHours(17, 0, 0, 0);
    } else if (
        currentHour < 21 ||
        (currentHour === 21 && currentMinute === 0)
    ) {
        // Next update is 9pm today
        next.setHours(21, 0, 0, 0);
    } else {
        // Next update is 7am tomorrow
        next.setDate(next.getDate() + 1);
        next.setHours(7, 0, 0, 0);
    }

    return next;
}
