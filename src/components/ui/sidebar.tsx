"use client"

import { useRouter } from "next/navigation"
import { CalendarCheck, Megaphone, LayoutDashboard } from "lucide-react"

export default function GuidanceSidebar() {

  const router = useRouter()

  return (
    <div className="w-64 h-screen bg-white border-r p-6 space-y-6">

      <h2 className="text-lg font-bold text-blue-900">
        Guidance Panel
      </h2>

      <nav className="space-y-4 text-gray-600">

        <button onClick={() => router.push("/guidance/dashboard")}
          className="flex gap-2 items-center hover:text-blue-900">
          <LayoutDashboard size={18}/> Dashboard
        </button>

        <button onClick={() => router.push("/guidance/appointment")}
          className="flex gap-2 items-center hover:text-blue-900">
          <CalendarCheck size={18}/> Appointments
        </button>

        <button onClick={() => router.push("/guidance/schedule")}
          className="flex gap-2 items-center hover:text-blue-900">
          <CalendarCheck size={18}/> Schedule
        </button>

        <button onClick={() => router.push("/guidance/announcements")}
          className="flex gap-2 items-center hover:text-blue-900">
          <Megaphone size={18}/> Announcements
        </button>

      </nav>
    </div>
  )
}