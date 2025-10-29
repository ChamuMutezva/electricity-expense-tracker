"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMeterNumber } from "@/actions/user-profile-actions"
import { useToast } from "@/hooks/use-toast"

interface MeterNumberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMeterNumber?: string | null
  isFirstTime?: boolean
}

export function MeterNumberDialog({
  open,
  onOpenChange,
  currentMeterNumber,
  isFirstTime = false,
}: MeterNumberDialogProps) {
  const [meterNumber, setMeterNumber] = useState(currentMeterNumber || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await updateMeterNumber(meterNumber)

    if (result.success) {
      toast({
        title: "Success",
        description: "Meter number saved successfully",
      })
      onOpenChange(false)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save meter number",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={isFirstTime ? undefined : onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={isFirstTime ? (e) => e.preventDefault() : undefined}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isFirstTime ? "Welcome! Set up your meter" : "Update Meter Number"}</DialogTitle>
            <DialogDescription>
              {isFirstTime
                ? "Enter your electricity meter number to get started tracking your usage."
                : "Update your electricity meter number below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meter-number">Meter Number</Label>
              <Input
                id="meter-number"
                placeholder="e.g., 12345678901"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
                autoFocus
              />
              <p className="text-sm text-muted-foreground">You can find this on your electricity bill or meter</p>
            </div>
          </div>
          <DialogFooter>
            {!isFirstTime && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isFirstTime ? "Get Started" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
