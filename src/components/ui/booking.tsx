"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
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

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatTimeForInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${hours}:${minutes}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function formatAppointmentDate(year: number, month: string, day: string) {
  if (!month || !day) {
    return null
  }

  const numericMonth = Number(month)
  const numericDay = Number(day)

  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    return null
  }

  const daysInMonth = getDaysInMonth(year, numericMonth)

  if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > daysInMonth) {
    return null
  }

  return `${year}-${String(numericMonth).padStart(2, "0")}-${String(numericDay).padStart(2, "0")}`
}

function clampMonth(value: string) {
  if (!value) {
    return ""
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return ""
  }

  return String(Math.min(12, Math.max(1, numericValue)))
}

function clampDay(value: string, maxDay: number) {
  if (!value) {
    return ""
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return ""
  }

  return String(Math.min(maxDay, Math.max(1, numericValue)))
}

export default function BookingDialog({ open, setOpen }: Props) {
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [appointmentMonth, setAppointmentMonth] = useState("")
  const [appointmentDay, setAppointmentDay] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const now = useMemo(() => new Date(), [open])
  const currentYear = now.getFullYear()
  const minDate = formatDateForInput(now)
  const maxDate = formatDateForInput(new Date(currentYear, 11, 31))
  const maxDayForSelectedMonth = appointmentMonth
    ? getDaysInMonth(currentYear, Number(appointmentMonth))
    : 31
  const appointmentDate = formatAppointmentDate(
    currentYear,
    appointmentMonth,
    appointmentDay
  )
  const minimumTimeForSelectedDate =
    appointmentDate === minDate ? formatTimeForInput(now) : "00:00"

  const resetForm = () => {
    setReason("")
    setDetails("")
    setAppointmentMonth("")
    setAppointmentDay("")
    setAppointmentTime("")
  }

  const handleBookAppointment = async () => {
    if (!reason.trim() || !appointmentDate || !appointmentTime) {
      toast.error("Please fill in the required fields.")
      return
    }

    const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`)

    if (Number.isNaN(selectedDateTime.getTime())) {
      toast.error("Please enter a valid appointment date and time.")
      return
    }

    if (selectedDateTime < new Date()) {
      toast.error("Cannot select a past date or time.")
      return
    }

    if (selectedDateTime.getFullYear() !== currentYear) {
      toast.error(`Appointments must stay within ${currentYear}.`)
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      toast.error("You must be logged in.")
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from("appointments").insert([
      {
        student_id: userData.user.id,
        reason: reason.trim(),
        details: details.trim(),
        appointment_date: selectedDateTime.toISOString(),
      },
    ])

    setSubmitting(false)

    if (error) {
      console.error(error)
      toast.error("Error booking appointment.")
      return
    }

    toast.success("Appointment successfully booked.")
    resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />

          <Textarea
            placeholder="Short details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Year</label>
              <Input value={String(currentYear)} readOnly />
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-medium text-gray-500">Month</label>
              <Input
                inputMode="numeric"
                max={12}
                min={1}
                placeholder="MM"
                value={appointmentMonth}
                onChange={(event) => {
                  const nextMonth = clampMonth(event.target.value)
                  setAppointmentMonth(nextMonth)
                  setAppointmentDay((currentDay) =>
                    clampDay(
                      currentDay,
                      nextMonth ? getDaysInMonth(currentYear, Number(nextMonth)) : 31
                    )
                  )
                }}
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-medium text-gray-500">Day</label>
              <Input
                inputMode="numeric"
                max={maxDayForSelectedMonth}
                min={1}
                placeholder="DD"
                value={appointmentDay}
                onChange={(event) =>
                  setAppointmentDay(
                    clampDay(event.target.value, maxDayForSelectedMonth)
                  )
                }
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Appointment date:{" "}
            {appointmentDate
              ? `${appointmentMonth.padStart(2, "0")}/${appointmentDay.padStart(2, "0")}/${currentYear}`
              : `MM/DD/${currentYear}`}
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Time</label>
            <Input
              type="time"
              step={60}
              min={minimumTimeForSelectedDate}
              value={appointmentTime}
              onChange={(event) => setAppointmentTime(event.target.value)}
            />
          </div>

          <Button
            className="w-full bg-blue-900 text-white hover:bg-blue-800"
            onClick={handleBookAppointment}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
