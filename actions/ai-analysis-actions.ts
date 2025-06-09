/**
 * Generates actionable AI insights about electricity usage patterns using Google Gemini.
 *
 * This function retrieves electricity readings, token purchases, and usage summary,
 * formats the data for AI analysis, and then uses the Google Gemini model to generate
 * a detailed report with insights, tips, and recommendations. The insights focus on
 * usage patterns, peak consumption periods, cost-saving opportunities, energy efficiency,
 * and detection of unusual patterns or anomalies.
 *
 * @returns {Promise<string>} A promise that resolves to a string containing the AI-generated insights.
 *
 * @throws {Error} If the Google Gemini API key is not configured, if the API quota is exceeded,
 * if rate limits are hit, or if there are permission/access issues.
 */
"use server";

import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import {
    getElectricityReadings,
    getTokenPurchases,
    getUsageSummary,
} from "./electricity-actions";
import type { ElectricityReading, TokenPurchase } from "@/lib/types";

/**
 * Check if AI is properly configured
 */
function checkAIConfiguration() {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error(
            "Google Gemini API key is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables."
        );
    }
}

/**
 * Formats electricity data for AI analysis
 */
function formatDataForAI(
    readings: ElectricityReading[],
    tokens: TokenPurchase[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    summary: any
) {
    // Group readings by day and period
    const dailyData = readings.reduce((acc, reading) => {
        const date = reading.timestamp.toISOString().split("T")[0];
        if (!acc[date]) acc[date] = {};
        acc[date][reading.period] = reading.reading;
        return acc;
    }, {} as Record<string, Record<string, number>>);

    // Calculate daily consumption
    const consumptionData = Object.entries(dailyData)
        .map(([date, periods]) => {
            const morning = periods.morning || 0;
            const evening = periods.evening || 0;
            const night = periods.night || 0;

            // Calculate consumption between periods (assuming meter counts down)
            const morningConsumption =
                morning > 0 && evening > 0 ? morning - evening : 0;
            const eveningConsumption =
                evening > 0 && night > 0 ? evening - night : 0;

            return {
                date,
                periods,
                consumption: {
                    morning: morningConsumption,
                    evening: eveningConsumption,
                    total: morningConsumption + eveningConsumption,
                },
            };
        })
        .filter((day) => day.consumption.total > 0);

    return {
        totalReadings: readings.length,
        daysTracked: Object.keys(dailyData).length,
        averageDailyUsage: summary.averageUsage,
        peakUsageDay: summary.peakUsageDay,
        totalTokensPurchased: summary.totalTokensPurchased,
        recentConsumption: consumptionData.slice(-7), // Last 7 days
        consumptionTrends: consumptionData,
        tokenPurchases: tokens.map((t) => ({
            date: t.timestamp.toISOString().split("T")[0],
            units: t.units,
            cost: t.total_cost,
        })),
    };
}

/**
 * Generate AI insights about electricity usage patterns using Google Gemini
 */
export async function generateElectricityInsights(): Promise<string> {
    try {
        console.log("Starting AI insights generation with Google Gemini...");

        // Check configuration first
        checkAIConfiguration();

        // Get all the data
        const readings = await getElectricityReadings();
        const tokens = await getTokenPurchases();
        const summary = await getUsageSummary();

        console.log(
            `Data retrieved: ${readings.length} readings, ${tokens.length} tokens`
        );

        if (readings.length < 3) {
            return "Not enough data available for analysis. Please add more electricity readings to get meaningful insights.";
        }

        // Format data for AI
        const analysisData = formatDataForAI(readings, tokens, summary);
        console.log("Data formatted for AI analysis");

        const { text } = await generateText({
            model: google("gemini-1.5-flash"), // Using Gemini 1.5 Flash (free and fast)
            system: `You are an expert electricity usage analyst. Analyze the provided electricity consumption data and provide actionable insights, tips, and recommendations. 

Focus on:
1. Usage patterns and trends
2. Peak consumption periods
3. Cost-saving opportunities
4. Energy efficiency tips
5. Unusual patterns or anomalies

Be practical, specific, and helpful. Use bullet points and clear sections. Format your response with clear headings using **bold text**.`,
            prompt: `Analyze this electricity usage data and provide insights:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. **Usage Pattern Analysis** - What patterns do you see?
2. **Peak Usage Insights** - When is electricity used most?
3. **Cost Optimization Tips** - How can costs be reduced?
4. **Energy Efficiency Recommendations** - Specific actionable tips
5. **Anomalies or Concerns** - Any unusual patterns?

Keep recommendations practical and specific to this usage data.`,
        });

        console.log("AI insights generated successfully with Google Gemini");
        return text;
    } catch (error) {
        console.error("Error generating AI insights:", error);

        if (error instanceof Error) {
            if (
                error.message.includes("API key") ||
                error.message.includes("API_KEY")
            ) {
                return "❌ **Configuration Error**: Google Gemini API key is not configured. Please add your Google AI API key to the environment variables.";
            }
            if (
                error.message.includes("quota") ||
                error.message.includes("limit")
            ) {
                return "❌ **Quota Exceeded**: You've exceeded your Google Gemini API quota. The free tier is very generous - please wait a bit or check your Google AI Studio account.";
            }
            if (error.message.includes("rate limit")) {
                return "❌ **Rate Limited**: Too many requests. Please wait a moment and try again.";
            }
            if (
                error.message.includes("permission") ||
                error.message.includes("access")
            ) {
                return "❌ **Access Error**: Please make sure your Google AI API key has the correct permissions and Gemini API is enabled.";
            }
            return `❌ **Error**: ${error.message}`;
        }

        return "❌ **Unknown Error**: Sorry, I couldn't analyze your electricity data right now. Please try again later.";
    }
}

/**
 * Chat with AI about electricity data using Google Gemini
 */
export async function chatAboutElectricity(
    question: string,
    conversationHistory: string[] = []
) {
    try {
        console.log("Starting AI chat with Google Gemini...");

        // Check configuration first
        checkAIConfiguration();

        // Get current data for context
        const readings = await getElectricityReadings();
        const tokens = await getTokenPurchases();
        const summary = await getUsageSummary();

        console.log(
            `Chat data: ${readings.length} readings, ${tokens.length} tokens`
        );

        const analysisData = formatDataForAI(readings, tokens, summary);

        // Build conversation context
        const conversationContext =
            conversationHistory.length > 0
                ? `Previous conversation:\n${conversationHistory.join(
                      "\n"
                  )}\n\n`
                : "";

        console.log("Sending request to Google Gemini...");

        const result = await streamText({
            model: google("gemini-1.5-flash"), // Using Gemini 1.5 Flash for chat
            system: `You are a helpful electricity usage advisor. You have access to the user's electricity consumption data and can answer questions about their usage patterns, provide tips, and help them understand their electricity consumption.

Be conversational, helpful, and specific to their data. If they ask about something not in the data, let them know what data you have available.

Current electricity data context:
${JSON.stringify(analysisData, null, 2)}`,
            prompt: `${conversationContext}User question: ${question}`,
        });

        console.log(
            "AI chat response generated successfully with Google Gemini"
        );
        return result.toDataStreamResponse();
    } catch (error) {
        console.error("Error in AI chat:", error);

        if (error instanceof Error) {
            if (
                error.message.includes("API key") ||
                error.message.includes("API_KEY")
            ) {
                throw new Error(
                    "Google Gemini API key is not configured. Please add your Google AI API key to the environment variables."
                );
            }
            if (
                error.message.includes("quota") ||
                error.message.includes("limit")
            ) {
                throw new Error(
                    "You've exceeded your Google Gemini API quota. Please wait a bit or check your Google AI Studio account."
                );
            }
            if (error.message.includes("rate limit")) {
                throw new Error(
                    "Too many requests. Please wait a moment and try again."
                );
            }
            if (
                error.message.includes("permission") ||
                error.message.includes("access")
            ) {
                throw new Error(
                    "Please make sure your Google AI API key has the correct permissions and Gemini API is enabled."
                );
            }
        }

        throw new Error("Failed to process your question. Please try again.");
    }
}
