"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

import { supabase } from "@/lib/supabase"

type Appointment = {
  date: string
  time: string
  description: string
}

export default function AppointmentDemo() {
  const router = useRouter()

  const [view, setView] = useState<"student" | "guidance">("student")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)

  const [user, setUser] = useState<any>(null)

  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/")
        return
      }

      setUser(data.user)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (!session?.user) {
          router.push("/")
        }

        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const selectedDateKey = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : null

  const appointmentsForDate = appointments.filter(
    (a) => a.date === selectedDateKey
  )

  const createAppointment = () => {
    if (!date || !time || !description) return

    setAppointments((prev) => [
      ...prev,
      { date, time, description },
    ])

    setDate("")
    setTime("")
    setDescription("")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-white p-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">
          Appointment System (Demo)
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-sm">{user.email}</span>

          <Button
            variant="outline"
            onClick={signOut}
          >
            Logout
          </Button>

          <div className="flex gap-2 ml-4">
            <Button
              className="bg-blue-900 text-white"
              variant={view === "student" ? "default" : "outline"}
              onClick={() => setView("student")}
            >
              Student
            </Button>

            <Button
              className="bg-yellow-400 text-black"
              variant={view === "guidance" ? "default" : "outline"}
              onClick={() => setView("guidance")}
            >
              Guidance
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader className="font-semibold text-blue-900">
            Calendar
          </CardHeader>

          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                      booked: appointments.map(
                        (a) => new Date(a.date)
                      ),
                    }}
                    modifiersClassNames={{
                      booked:
                        "bg-yellow-400 text-black rounded-md",
                    }}
                  />
                </div>
              </PopoverTrigger>

              <PopoverContent className="w-64">
                {!selectedDate && (
                  <p className="text-sm text-gray-500">
                    Select a date
                  </p>
                )}

                {selectedDate &&
                  appointmentsForDate.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No appointments on this date
                    </p>
                  )}

                {appointmentsForDate.map((a, i) => (
                  <div
                    key={i}
                    className="border rounded p-2 mb-2 text-sm"
                  >
                    <p>
                      <strong>Time:</strong> {a.time}
                    </p>

                    {view === "guidance" && (
                      <p>
                        <strong>Student:</strong> Juan Dela Cruz
                      </p>
                    )}

                    <p>
                      <strong>Info:</strong> {a.description}
                    </p>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Right Side */}
        <div className="md:col-span-2 space-y-6">
          {view === "student" && (
            <Card>
              <CardHeader className="font-semibold text-blue-900">
                Create Appointment
              </CardHeader>

              <CardContent className="space-y-3">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />

                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />

                <Textarea
                  placeholder="Short description of concern"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                />

                <Button
                  className="bg-blue-900 text-white"
                  onClick={createAppointment}
                >
                  Create Appointment
                </Button>
              </CardContent>
            </Card>
          )}

          {view === "guidance" && (
            <Card>
              <CardHeader className="font-semibold text-blue-900">
                All Appointments
              </CardHeader>

              <CardContent className="space-y-2">
                {appointments.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No appointments created
                  </p>
                )}

                {appointments.map((a, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      setSelectedAppointment(a)
                    }
                  >
                    {a.date} — {a.time}
                  </Button>
                ))}

                {selectedAppointment && (
                  <div className="mt-4 border rounded p-3 text-sm">
                    <p>
                      <strong>Date:</strong>{" "}
                      {selectedAppointment.date}
                    </p>

                    <p>
                      <strong>Time:</strong>{" "}
                      {selectedAppointment.time}
                    </p>

                    <p>
                      <strong>Student:</strong> Juan Dela Cruz
                    </p>

                    <p>
                      <strong>Agenda:</strong>{" "}
                      {selectedAppointment.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}