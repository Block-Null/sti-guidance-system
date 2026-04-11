"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

import { Home, CalendarPlus, Clock, User, Bell } from "lucide-react"
import BookingDialog from "@/components/ui/booking"

/* =========================
   TYPES
========================= */
type Notification = {
  id: string
  header: string
  content: string
  created_at: string
  is_read: boolean
}

/* =========================
   CLEAN NAME HELPER ONLY
   (NO DATABASE SIDE EFFECTS)
========================= */
const cleanMicrosoftName = (name: string) => {
  if (!name) return ""

  // "John Doe (Student)" → "John Doe"
  return name.replace(/\s*\(.*?\)\s*$/, "").trim()
}

export default function Header() {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const [role, setRole] = useState<string | null>(null)
  const [fullname, setFullname] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const hasUnread = notifications.some((n) => !n.is_read)

  /* =========================
     FETCH USER PROFILE
     (ROLE SOURCE OF TRUTH)
  ========================= */
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("fullname, role")
        .eq("id", userData.user.id)
        .single()

      if (error || !profile) {
        console.error(error)
        setLoading(false)
        return
      }

      setFullname(cleanMicrosoftName(profile.fullname))
      setRole(profile.role?.toLowerCase() || null)

      setLoading(false)
    }

    fetchProfile()
  }, [])

  /* =========================
     FETCH NOTIFICATIONS
  ========================= */
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })

      if (data) setNotifications(data)
    }

    fetchNotifications()
  }, [])

  /* =========================
     MARK AS READ
  ========================= */
  const markAllAsRead = async () => {
    if (!hasUnread) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    )

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userData.user.id)
      .eq("is_read", false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return null

  return (
    <div className="w-full border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">

      {/* =========================
         LOGO
      ========================= */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => router.push("/home")}
      >
        <div className="bg-yellow-400 w-8 h-8 rounded-xl flex items-center justify-center">
          <span className="text-blue-900 font-bold text-xs">STI</span>
        </div>
        <h1 className="font-semibold text-blue-900 text-lg">
          STI Guidance
        </h1>
      </div>

      {/* =========================
         STUDENT NAV ONLY
      ========================= */}
      {role === "student" && (
        <nav className="hidden md:flex items-center gap-8 text-gray-600">
          <button onClick={() => router.push("/home")} className="flex items-center gap-2 hover:text-blue-900">
            <Home size={18} />
            Home
          </button>

          <button onClick={() => setOpen(true)} className="flex items-center gap-2 hover:text-blue-900">
            <CalendarPlus size={18} />
            Book Appointment
          </button>

          <button onClick={() => router.push("/appointments")} className="flex items-center gap-2 hover:text-blue-900">
            <Clock size={18} />
            Appointments
          </button>
        </nav>
      )}

      {/* =========================
         RIGHT ACTIONS
      ========================= */}
      <div className="flex items-center gap-2">

        {/* NOTIFICATIONS */}
        <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative p-2 rounded-full">
              <Bell size={20} />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">
                No notifications
              </p>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`flex flex-col items-start p-3
                    ${notif.is_read ? "bg-white" : "bg-blue-50"}`}
                >
                  <span className="font-semibold text-sm text-blue-900">
                    {notif.header}
                  </span>

                  <span className="text-xs text-gray-600">
                    {notif.content}
                  </span>

                  <span className="text-[10px] text-gray-400">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* PROFILE */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-2 rounded-full">
              <User />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{fullname}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/profile")}>
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={signOut} className="text-red-500">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* BOOKING MODAL */}
      {role === "student" && (
        <BookingDialog open={open} setOpen={setOpen} />
      )}
    </div>
  )
}