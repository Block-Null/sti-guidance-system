"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { ensureProfileExists } from "@/lib/profile"

type Profile = {
  avatar_url: string | null
  birthdate: string | null
  email: string | null
  fullname: string | null
  gender: string | null
  phone: string | null
  role: string | null
  studentnumber?: string | null
}

function formatBirthdate(value: string | null) {
  if (!value) return "Not provided"

  const date = new Date(`${value}T00:00:00`)
  if (isNaN(date.getTime())) return value

  return date.toLocaleDateString()
}

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  /* =========================
     FETCH PROFILE
  ========================= */
  useEffect(() => {

    const fetchProfile = async () => {
      setError("")

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError || !authData.user) {
          router.push("/")
          return
        }

        const profileData = await ensureProfileExists(authData.user)

        if (!profileData) {
          throw new Error("Profile not found")
        }

        setProfile(profileData)

      } catch (err: unknown) {
        console.error("Profile fetch error:", err)
        setError(
          err instanceof Error ? err.message : "Unable to load your profile."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

  }, [router])

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Loading profile...
      </div>
    )
  }

  /* =========================
     ERROR STATE
  ========================= */
  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* =========================
     EMPTY STATE
  ========================= */
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              No profile data available.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* =========================
     MAIN UI
  ========================= */
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-[#163A63]">
        My Profile
      </h1>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap gap-10 p-8 lg:flex-nowrap">

          {/* LEFT */}
          <div className="flex w-full flex-col items-center lg:w-[260px]">

            <div className="h-[130px] w-[130px] overflow-hidden rounded-full bg-gray-200">
              <Image
                src={
                  profile.avatar_url ||
                  "https://ui-avatars.com/api/?background=e5e7eb&color=6b7280&size=170"
                }
                alt="profile"
                width={170}
                height={170}
                className="h-full w-full object-cover"
              />
            </div>

            <h2 className="mt-5 text-center text-[18px] font-semibold text-[#163A63]">
              {profile.fullname || "Name not provided"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {profile.studentnumber || "Student number pending"}
            </p>

          </div>

          {/* RIGHT */}
          <div className="flex-1">

            <h2 className="mb-8 text-[16px] font-semibold text-[#163A63]">
              Personal Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-[15px] font-medium text-gray-800">
                  {profile.email || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="text-[15px] font-medium text-gray-800">
                  {formatBirthdate(profile.birthdate)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-[15px] font-medium text-gray-800">
                  {profile.gender || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Contact Number</p>
                <p className="text-[15px] font-medium text-gray-800">
                  {profile.phone || "Not provided"}
                </p>
              </div>

            </div>

          </div>

        </CardContent>
      </Card>
    </div>
  )
}
