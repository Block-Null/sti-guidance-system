"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import GuidanceSidebar from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export default function Page() {

  const [appointments, setAppointments] = useState<any[]>([])

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "pending")

    setAppointments(data || [])
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)

    fetchAppointments()
  }

  return (
    <div className="flex">
      <GuidanceSidebar/>

      <div className="p-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Pending Appointments</h1>

        {appointments.map((appt) => (
          <div key={appt.id} className="border p-4 rounded-xl mb-4">

            <p><b>Reason:</b> {appt.reason}</p>
            <p><b>Date:</b> {appt.appointment_date}</p>

            <div className="flex gap-2 mt-3">
              <Button onClick={() => updateStatus(appt.id, "approved")}>
                Approve
              </Button>

              <Button variant="destructive"
                onClick={() => updateStatus(appt.id, "denied")}>
                Deny
              </Button>
            </div>

          </div>
        ))}

      </div>
    </div>
  )
}