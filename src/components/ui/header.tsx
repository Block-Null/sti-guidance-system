"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import { Home, CalendarPlus, Clock, User } from "lucide-react"

import BookingDialog from "@/components/ui/booking"

export default function Header() {

  const router = useRouter()

  const [open, setOpen] = useState(false)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (

    <div className="w-full border-b bg-white px-6 py-3 flex items-center justify-between">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-yellow-400 p-2 rounded-xl"></div>

        <h1 className="font-semibold text-blue-900 text-lg">
          STI Guidance
        </h1>
      </div>


      {/* Navigation */}
      <div className="flex items-center gap-8 text-gray-600">

        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 hover:text-blue-900"
        >
          <Home size={18} />
          Home
        </button>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 hover:text-blue-900"
        >
          <CalendarPlus size={18} />
          Book Appointment
        </button>

        <button
          onClick={() => router.push("/appointments")}
          className="flex items-center gap-2 hover:text-blue-900"
        >
          <Clock size={18} />
          My Appointments
        </button>

      </div>


      {/* Profile */}
      <DropdownMenu>

        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="rounded-full p-2">
            <User />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">

          <DropdownMenuItem onClick={() => router.push("/profile")}>
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={signOut}
            className="text-red-500"
          >
            Logout
          </DropdownMenuItem>

        </DropdownMenuContent>

      </DropdownMenu>

      {/* BOOKING MODAL */}
      <BookingDialog open={open} setOpen={setOpen} />

    </div>
  )
}