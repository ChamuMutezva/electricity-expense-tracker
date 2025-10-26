"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@stackframe/stack"
import { fixNullUserIds, checkDataStatus } from "@/actions/admin-actions"
import { Loader2, CheckCircle, AlertCircle, Copy, Database } from "lucide-react"

export default function FixDataPage() {
  const user = useUser()
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: {
      readingsUpdated: number
      tokensUpdated: number
      totalReadings: number
      totalTokens: number
    }
  } | null>(null)
  const [dataStatus, setDataStatus] = useState<{
    readingsWithUser: number
    readingsWithoutUser: number
    tokensWithUser: number
    tokensWithoutUser: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadDataStatus()
  }, [])

  const loadDataStatus = async () => {
    try {
      const status = await checkDataStatus()
      setDataStatus(status)
    } catch (error) {
      console.error("Error loading data status:", error)
    }
  }

  const handleFixData = async () => {
    if (!user) {
      setResult({
        success: false,
        message: "Please sign in first to fix your data",
      })
      return
    }

    setIsFixing(true)
    setResult(null)

    try {
      const response = await fixNullUserIds(user.id)
      setResult(response)
      await loadDataStatus()
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsFixing(false)
    }
  }

  const copyUserId = () => {
    if (user) {
      navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be signed in to fix your data. Please use the sign in button in the header.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fix User Data</CardTitle>
          <CardDescription>Associate existing data with your user account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Your User Information</h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{user.primaryEmail}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Stack Auth User ID</p>
                  <p className="font-mono text-sm break-all">{user.id}</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyUserId} className="ml-2 flex-shrink-0 bg-transparent">
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Data Status */}
          {dataStatus && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                Current Data Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Electricity Readings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">With User ID:</span>
                        <span className="font-semibold text-green-600">{dataStatus.readingsWithUser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Without User ID:</span>
                        <span className="font-semibold text-red-600">{dataStatus.readingsWithoutUser}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="font-semibold">
                          {dataStatus.readingsWithUser + dataStatus.readingsWithoutUser}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Token Purchases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">With User ID:</span>
                        <span className="font-semibold text-green-600">{dataStatus.tokensWithUser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Without User ID:</span>
                        <span className="font-semibold text-red-600">{dataStatus.tokensWithoutUser}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="font-semibold">
                          {dataStatus.tokensWithUser + dataStatus.tokensWithoutUser}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-4">
            <Button
              onClick={handleFixData}
              disabled={isFixing || (dataStatus?.readingsWithoutUser === 0 && dataStatus?.tokensWithoutUser === 0)}
              className="w-full"
              size="lg"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing Data...
                </>
              ) : (
                <>Fix All Data with NULL User IDs</>
              )}
            </Button>

            {dataStatus && dataStatus.readingsWithoutUser === 0 && dataStatus.tokensWithoutUser === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>All data already has user IDs assigned. No action needed!</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Result */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  {result.details && (
                    <div className="text-sm space-y-1">
                      <p>✅ Updated {result.details.readingsUpdated} electricity readings</p>
                      <p>✅ Updated {result.details.tokensUpdated} token purchases</p>
                      <p className="font-semibold pt-2">
                        Total: {result.details.totalReadings} readings, {result.details.totalTokens} tokens
                      </p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">What does this do?</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Finds all electricity readings with NULL user_id</li>
              <li>Finds all token purchases with NULL user_id</li>
              <li>Updates them with your Stack Auth user ID</li>
              <li>Associates all your historical data with your account</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
