"use server"

import { sql } from "@/lib/db"
import {stackServerApp} from "@/stack/server"
import { revalidatePath } from "next/cache"

export interface UserProfile {
  id: number
  user_id: string
  meter_number: string | null
  created_at: string
  updated_at: string
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  try {
    const result = await sql`
      SELECT * FROM user_profiles 
      WHERE user_id = ${user.id}
      LIMIT 1
    `
    if (Array.isArray(result) && result.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = result[0] as Record<string, any>
      return {
        id: Number(row.id),
        user_id: String(row.user_id),
        meter_number: row.meter_number ?? null,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      } as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateMeterNumber(meterNumber: string): Promise<{ success: boolean; error?: string }> {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  if (!meterNumber || meterNumber.trim().length === 0) {
    return { success: false, error: "Meter number is required" }
  }

  try {
    // Upsert user profile with meter number
    await sql`
      INSERT INTO user_profiles (user_id, meter_number, updated_at)
      VALUES (${user.id}, ${meterNumber.trim()}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        meter_number = ${meterNumber.trim()},
        updated_at = CURRENT_TIMESTAMP
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating meter number:", error)
    return { success: false, error: "Failed to update meter number" }
  }
}
