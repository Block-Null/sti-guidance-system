"use client"

import { useEffect, useMemo, useState } from "react"
import GuidanceSidebar from "@/components/ui/sidebar"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClientRequestId, postJson } from "@/lib/api-client"
import { supabase } from "@/lib/supabase"
import { useSubmissionGuard } from "@/lib/use-submission-guard"

type ScheduleItem = {
  id: string
  schedule_date: string
  start_time: string
  end_time: string
  title: string | null
  type: string
}

type DailySlot = {
  available: boolean
  label: string
  reason: string
  time: string
}

const now = new Date()
const currentYear = now.getFullYear()
const startOfToday = new Date(currentYear, now.getMonth(), now.getDate())
const endOfYear = new Date(currentYear, 11, 31)

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

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function formatDisplayTime(value: string) {
  const [hours, minutes] = value.split(":")
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function generateDailySlots(schedules: ScheduleItem[]) {
  const slots: DailySlot[] = []

  for (let hour = 8; hour <= 16; hour++) {
    const label = `${hour}:00`
    const matchingSchedule = schedules.find((schedule) => {
      const startHour = Number(schedule.start_time.split(":")[0])
      return startHour === hour
    })

    let available = true
    let reason = "Available"

    if (hour === 12) {
      available = false
      reason = "Lunch Break"
    }

    if (hour >= 16) {
      available = false
      reason = "Office Closed"
    }

    if (matchingSchedule) {
      available = false
      reason = matchingSchedule.title || "Scheduled"
    }

    slots.push({
      available,
      label,
      reason,
      time: label,
    })
  }

  return slots
}

function hasOverlap(
  schedules: ScheduleItem[],
  nextStartTime: string,
  nextEndTime: string
) {
  const nextStart = combineDateAndTime("2000-01-01", nextStartTime)
  const nextEnd = combineDateAndTime("2000-01-01", nextEndTime)

  return schedules.some((schedule) => {
    const scheduleStart = combineDateAndTime("2000-01-01", schedule.start_time)
    const scheduleEnd = combineDateAndTime("2000-01-01", schedule.end_time)

    return nextStart < scheduleEnd && nextEnd > scheduleStart
  })
}

export default function Page() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday)
  const [visibleMonth, setVisibleMonth] = useState(startOfToday)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [title, setTitle] = useState("")
  const [selectedSchedules, setSelectedSchedules] = useState<ScheduleItem[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const { run, submitting } = useSubmissionGuard()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedDateValue = selectedDate ? formatDateForInput(selectedDate) : ""
  const isToday = selectedDateValue === formatDateForInput(startOfToday)

  const minimumStartTime = useMemo(() => {
    if (!isToday) {
      return "00:00"
    }

    return formatTimeForInput(new Date())
  }, [isToday])

  const minimumEndTime = useMemo(() => {
    if (!startTime) {
      return minimumStartTime
    }

    return startTime > minimumStartTime ? startTime : minimumStartTime
  }, [minimumStartTime, startTime])

  const dailySlots = useMemo(
    () => generateDailySlots(selectedSchedules),
    [selectedSchedules]
  )

  const fetchSelectedSchedules = async (dateValue: string) => {
    setLoadingSchedules(true)

    const { data, error: fetchError } = await supabase
      .from("schedule")
      .select("id, schedule_date, start_time, end_time, title, type")
      .eq("schedule_date", dateValue)
      .order("start_time", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setSelectedSchedules([])
      setLoadingSchedules(false)
      return
    }

    setSelectedSchedules((data as ScheduleItem[]) ?? [])
    setLoadingSchedules(false)
  }

  useEffect(() => {
    if (!selectedDateValue) {
      return
    }

    let active = true

    const loadSchedules = async () => {
      setLoadingSchedules(true)

      const { data, error: fetchError } = await supabase
        .from("schedule")
        .select("id, schedule_date, start_time, end_time, title, type")
        .eq("schedule_date", selectedDateValue)
        .order("start_time", { ascending: true })

      if (!active) {
        return
      }

      if (fetchError) {
        setError(fetchError.message)
        setSelectedSchedules([])
        setLoadingSchedules(false)
        return
      }

      setSelectedSchedules((data as ScheduleItem[]) ?? [])
      setLoadingSchedules(false)
    }

    void loadSchedules()

    return () => {
      active = false
    }
  }, [selectedDateValue])

  const addSchedule = async () => {
    if (submitting) {
      return
    }

    setError("")
    setSuccess("")

    if (!selectedDate || !selectedDateValue || !startTime || !endTime || !title.trim()) {
      setError("Complete the date, time, and title before saving the schedule.")
      return
    }

    const startDateTime = combineDateAndTime(selectedDateValue, startTime)
    const endDateTime = combineDateAndTime(selectedDateValue, endTime)

    if (selectedDate.getFullYear() !== currentYear) {
      setError(`Schedules can only be created within ${currentYear}.`)
      return
    }

    if (startDateTime < new Date()) {
      setError("You cannot create a schedule in the past.")
      return
    }

    if (endDateTime <= startDateTime) {
      setError("End time must be later than the start time.")
      return
    }

    if (hasOverlap(selectedSchedules, startTime, endTime)) {
      setError("This time overlaps with an existing schedule for the selected date.")
      return
    }

    await run(async () => {
      const response = await postJson<{
        ignored: boolean
        scheduleId: string | null
      }>("/api/schedules", {
        clientRequestId: createClientRequestId(),
        endTime,
        scheduleDate: selectedDateValue,
        startTime,
        title: title.trim(),
      })

      if (!response.ok) {
        setError(response.error)
        return
      }

      setSuccess(
        response.data.ignored
          ? "That schedule entry was already submitted."
          : "Schedule added successfully."
      )
      setStartTime("")
      setEndTime("")
      setTitle("")
      await fetchSelectedSchedules(selectedDateValue)
    })
  }

  const deleteSchedule = async (scheduleId: string) => {
    setError("")
    setSuccess("")
    setDeletingId(scheduleId)

    const { error: deleteError } = await supabase
      .from("schedule")
      .delete()
      .eq("id", scheduleId)

    setDeletingId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess("Schedule deleted successfully.")
    await fetchSelectedSchedules(selectedDateValue)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <GuidanceSidebar />

      <div className="w-full p-8">
        <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <p className="text-sm text-slate-500">
                  Select an available date within {currentYear}. Previous dates are blocked.
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  onSelect={(date) => {
                    if (!date) {
                      return
                    }

                    setSelectedDate(date)
                    setError("")
                    setSuccess("")
                  }}
                  disabled={(date) =>
                    date < startOfToday || date.getFullYear() !== currentYear
                  }
                  startMonth={startOfToday}
                  endMonth={endOfYear}
                  fromDate={startOfToday}
                  toDate={endOfYear}
                  className="rounded-lg border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Day Schedule</CardTitle>
                <p className="text-sm text-slate-500">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) ?? "Select a date"}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingSchedules ? (
                  <p className="text-sm text-slate-500">Loading day schedule...</p>
                ) : (
                  dailySlots.map((slot) => (
                    <div
                      key={slot.time}
                      className={`flex items-center justify-between rounded-md px-4 py-2 text-sm ${
                        slot.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span>{slot.label}</span>
                      <span>{slot.reason}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manage Schedule</CardTitle>
              <p className="text-sm text-slate-500">
                Create, review, and clear schedules for the selected date.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Selected date
                  </label>
                  <Input value={selectedDateValue} readOnly />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Year
                  </label>
                  <Input value={String(currentYear)} readOnly />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Start time
                  </label>
                  <Input
                    type="time"
                    step={60}
                    min={minimumStartTime}
                    value={startTime}
                    onChange={(event) => {
                      setStartTime(event.target.value)
                      setError("")
                      setSuccess("")
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    End time
                  </label>
                  <Input
                    type="time"
                    step={60}
                    min={minimumEndTime}
                    value={endTime}
                    onChange={(event) => {
                      setEndTime(event.target.value)
                      setError("")
                      setSuccess("")
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Title
                </label>
                <Input
                  placeholder="Enter event title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setError("")
                    setSuccess("")
                  }}
                />
              </div>

              <div className="rounded-lg border bg-slate-100 p-4 text-sm text-slate-600">
                <p>Date: {selectedDate?.toLocaleDateString() ?? "No date selected"}</p>
                <p>
                  Time range:{" "}
                  {startTime && endTime ? `${startTime} to ${endTime}` : "Choose both start and end time"}
                </p>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}

              {success ? (
                <p className="text-sm font-medium text-emerald-600">{success}</p>
              ) : null}

              <Button onClick={addSchedule} disabled={submitting}>
                {submitting ? "Saving..." : "Add Schedule"}
              </Button>

              <div className="grid gap-4 border-t pt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Saved Schedules for Selected Date
                    </h3>
                    <p className="text-sm text-slate-500">
                      Review and remove schedules to clear that time slot for the day.
                    </p>
                  </div>

                  {loadingSchedules ? (
                    <p className="text-sm text-slate-500">Loading schedules...</p>
                  ) : selectedSchedules.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
                      No schedules have been created for this date yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {schedule.title || "Untitled schedule"}
                            </p>
                            <p className="text-sm text-slate-600">
                              {formatDisplayTime(schedule.start_time)} to{" "}
                              {formatDisplayTime(schedule.end_time)}
                            </p>
                          </div>

                          <Button
                            variant="destructive"
                            onClick={() => void deleteSchedule(schedule.id)}
                            disabled={deletingId === schedule.id}
                          >
                            {deletingId === schedule.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
