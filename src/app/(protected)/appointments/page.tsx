"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

type Appointment = {
  id: string
  reason: string
  details: string
  appointment_date: string
  status: string
}

export default function MyAppointments() {

  const [pending, setPending] = useState<Appointment[]>([])
  const [finished, setFinished] = useState<Appointment[]>([])

  const [cancelDialog, setCancelDialog] = useState(false)
  const [rescheduleDialog, setRescheduleDialog] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  const [selected, setSelected] = useState<Appointment | null>(null)

  const [newDate, setNewDate] = useState("")

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("student_id", userData.user.id)
      .order("appointment_date", { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setPending(data.filter((a) => a.status === "pending"))
    setFinished(data.filter((a) => a.status === "finished"))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const handleCancel = async () => {

    if (!selected) return

    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", selected.id)

    setCancelDialog(false)
    fetchAppointments()
  }

  const handleReschedule = async () => {

    if (!selected) return

    await supabase
      .from("appointments")
      .update({ appointment_date: newDate })
      .eq("id", selected.id)

    setConfirmDialog(false)
    setRescheduleDialog(false)
    fetchAppointments()
  }

  return (

    <div className="p-6 space-y-8">

      <h1 className="text-2xl font-bold text-blue-900">
        My Appointments
      </h1>

      {/* Pending */}
      <div>

        <h2 className="text-lg font-semibold mb-3">
          Pending Appointments
        </h2>

        <div className="grid gap-4">

          {pending.length === 0 && (
            <p className="text-sm text-gray-500">
              No pending appointments.
            </p>
          )}

          {pending.map((appt) => (

            <Card key={appt.id}>

              <div className="flex justify-between items-center">

                <div className="flex-1">

                  <CardHeader className="font-semibold">
                    {appt.reason}
                  </CardHeader>

                  <CardContent className="text-sm space-y-1">

                    <p>{appt.details}</p>

                    <p className="text-gray-500">
                      {formatDate(appt.appointment_date)}
                    </p>

                  </CardContent>

                </div>

                {/* ACTION BUTTONS */}

                <div className="flex gap-2 pr-6">

                  <Button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => {
                      setSelected(appt)
                      setNewDate(appt.appointment_date)
                      setRescheduleDialog(true)
                    }}
                  >
                    Reschedule
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelected(appt)
                      setCancelDialog(true)
                    }}
                  >
                    Cancel
                  </Button>

                </div>

              </div>

            </Card>

          ))}

        </div>

      </div>

      {/* Finished */}

      <div>

        <h2 className="text-lg font-semibold mb-3">
          Finished Appointments
        </h2>

        <div className="grid gap-4">

          {finished.length === 0 && (
            <p className="text-sm text-gray-500">
              No finished appointments.
            </p>
          )}

          {finished.map((appt) => (

            <Card key={appt.id}>

              <CardHeader className="font-semibold">
                {appt.reason}
              </CardHeader>

              <CardContent className="text-sm space-y-1">

                <p>{appt.details}</p>

                <p className="text-gray-500">
                  {formatDate(appt.appointment_date)}
                </p>

              </CardContent>

            </Card>

          ))}

        </div>

      </div>

      {/* CANCEL CONFIRMATION */}

      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Cancel Appointment
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to cancel this appointment?
          </p>

          <DialogFooter className="flex gap-2">

            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
            >
              Back
            </Button>

            <Button
              variant="destructive"
              onClick={handleCancel}
            >
              Confirm Cancel
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* RESCHEDULE MODAL */}

      <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>

          {selected && (

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="font-medium">{selected.reason}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Details</p>
                <p className="font-medium">{selected.details}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  New Date & Time
                </p>

                <input
                  type="datetime-local"
                  value={newDate.slice(0,16)}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>

            </div>

          )}

          <DialogFooter className="flex gap-2 pt-4">

            <Button
              variant="outline"
              onClick={() => setRescheduleDialog(false)}
            >
              Cancel
            </Button>

            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => {
                setConfirmDialog(true)
              }}
            >
              Confirm Reschedule
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* RESCHEDULE CONFIRMATION */}

      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Confirm Reschedule
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to reschedule this appointment?
          </p>

          <DialogFooter className="flex gap-2">

            <Button
              variant="outline"
              onClick={() => setConfirmDialog(false)}
            >
              Go Back
            </Button>

            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={handleReschedule}
            >
              Confirm
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  )
}