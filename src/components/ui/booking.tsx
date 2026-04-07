"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { toast } from "sonner"

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function BookingDialog({ open, setOpen }: Props) {
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [dateTime, setDateTime] = useState("")

  const [minDateTime, setMinDateTime] = useState("")
  const [maxDateTime, setMaxDateTime] = useState("")

  /* Lock to Current Year */
  useEffect(() => {
    const now = new Date()
    const currentYear = now.getFullYear()

    // Minimum: Right now
    const minIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    // Maximum: Dec 31st of the current year
    const maxDate = new Date(currentYear, 11, 31, 23, 59)
    const maxIso = new Date(maxDate.getTime() - maxDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    setMinDateTime(minIso)
    setMaxDateTime(maxIso)
  }, [])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) {
      setDateTime("")
      return
    }

    const selectedYear = new Date(value).getFullYear()
    const currentYear = new Date().getFullYear()

    // Prevent manual typing of a different year
    if (selectedYear !== currentYear) {
      toast.error(`Appointments must be in ${currentYear}`)
      return
    }

    setDateTime(value)
  }

  /* -----------------------------
     Booking Function
  ------------------------------*/
  const handleBookAppointment = async () => {
    if (!reason || !dateTime) {
      toast.error("Please fill required fields")
      return
    }

    const selectedDate = new Date(dateTime)
    const now = new Date()
    const currentYear = now.getFullYear()

    // Final validation before submission
    if (selectedDate < now) {
      toast.error("Cannot select past date/time")
      return
    }

    if (selectedDate.getFullYear() !== currentYear) {
      toast.error(`Appointment must be within ${currentYear}`)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
        toast.error("You must be logged in")
        return
    }

    const { error } = await supabase
      .from("appointments")
      .insert([
        {
          student_id: userData.user.id,
          reason,
          details,
          appointment_date: dateTime,
        },
      ])

    if (error) {
      console.error(error)
      toast.error("Error booking appointment")
      return
    }

    toast.success("Appointment successfully booked")

    // Reset fields
    setReason("")
    setDetails("")
    setDateTime("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Textarea
            placeholder="Short details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Date & Time (Current Year Only)
            </label>
            <Input
              type="datetime-local"
              value={dateTime}
              min={minDateTime}
              max={maxDateTime} // This disables future years in the picker
              onChange={handleDateChange}
            />
          </div>

          <Button
            className="w-full bg-blue-900 text-white hover:bg-blue-800"
            onClick={handleBookAppointment}
          >
            Submit Appointment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}