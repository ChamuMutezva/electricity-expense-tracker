"use server"

import { sql, isDatabaseConnected } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {stackServerApp} from "@/stack/server"
interface DataStatus {
  readingsWithUser: number
  readingsWithoutUser: number
  tokensWithUser: number
  tokensWithoutUser: number
}

interface FixResult {
  success: boolean
  message: string
  details?: {
    readingsUpdated: number
    tokensUpdated: number
    totalReadings: number
    totalTokens: number
  }
}

/**
 * Check the current status of data (how many records have/don't have user_id)
 */
export async function checkDataStatus(): Promise<DataStatus> {
  try {
    if (!isDatabaseConnected()) {
      throw new Error("Database is not connected")
    }

    const readingsStatus = (await sql`
      SELECT 
        COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user,
        COUNT(*) FILTER (WHERE user_id IS NULL) as without_user
      FROM electricity_readings
    `) as Array<{ with_user: number | string; without_user: number | string }>

    const tokensStatus = (await sql`
      SELECT 
        COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user,
        COUNT(*) FILTER (WHERE user_id IS NULL) as without_user
      FROM token_purchases
    `) as Array<{ with_user: number | string; without_user: number | string }>

    return {
      readingsWithUser: Number(readingsStatus[0]?.with_user || 0),
      readingsWithoutUser: Number(readingsStatus[0]?.without_user || 0),
      tokensWithUser: Number(tokensStatus[0]?.with_user || 0),
      tokensWithoutUser: Number(tokensStatus[0]?.without_user || 0),
    }
  } catch (error) {
    console.error("[ADMIN] Error checking data status:", error)
    throw error
  }
}

/**
 * Fix all NULL user_id records by associating them with the provided user ID
 */
export async function fixNullUserIds(userId: string): Promise<FixResult> {
  try {
    if (!isDatabaseConnected()) {
      return {
        success: false,
        message: "Database is not connected",
      }
    }

    // Verify the user is authenticated
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || currentUser.id !== userId) {
      return {
        success: false,
        message: "Unauthorized: You can only fix data for your own account",
      }
    }

    console.log(`[ADMIN] Fixing NULL user_id records for user: ${userId}`)

    // Update electricity readings
    const updatedReadings = (await sql`
      UPDATE electricity_readings
      SET user_id = ${userId}
      WHERE user_id IS NULL
      RETURNING id
    `) as Array<{ id: number }>

    console.log(`[ADMIN] Updated ${updatedReadings.length} electricity readings`)

    // Update token purchases
    const updatedTokens = (await sql`
      UPDATE token_purchases
      SET user_id = ${userId}
      WHERE user_id IS NULL
      RETURNING id
    `) as Array<{ id: number }>

    console.log(`[ADMIN] Updated ${updatedTokens.length} token purchases`)

    // Get totals
    const totals = (await sql`
      SELECT 
        (SELECT COUNT(*) FROM electricity_readings WHERE user_id = ${userId}) as readings_count,
        (SELECT COUNT(*) FROM token_purchases WHERE user_id = ${userId}) as tokens_count
    `) as Array<{ readings_count: number | string; tokens_count: number | string }>

    revalidatePath("/")
    revalidatePath("/admin/fix-data")

    return {
      success: true,
      message: "Successfully updated all data with your user ID",
      details: {
        readingsUpdated: updatedReadings.length,
        tokensUpdated: updatedTokens.length,
        totalReadings: Number(totals[0]?.readings_count || 0),
        totalTokens: Number(totals[0]?.tokens_count || 0),
      },
    }
  } catch (error) {
    console.error("[ADMIN] Error fixing user data:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
