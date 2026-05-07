"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Header from "@/components/ui/header"
import StudentProfileCompletionDialog from "@/components/ui/student-profile-completion-dialog"
import { getHomePathForRole } from "@/lib/roles"
import { ensureProfileExists } from "@/lib/profile"

type StudentProfile = {
  birthdate: string | null
  course: string | null
  gender: string | null
  parentphone: string | null
  phone: string | null
  role: string | null
}

function isProfileIncomplete(profile: StudentProfile | null) {
  if (!profile) return true

  return [profile.gender, profile.phone, profile.birthdate, profile.parentphone, profile.course]
    .some((value) => !value || !value.trim())
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileValues, setProfileValues] = useState<StudentProfile>({
    birthdate: null,
    course: null,
    gender: null,
    parentphone: null,
    phone: null,
    role: null
  })

  /* =========================
     AUTH + ROLE CHECK
  ========================= */
  useEffect(() => {

    const checkUser = async () => {

      try {
        const { data } = await supabase.auth.getUser()

        if (!data.user) {
          router.push("/")
          return
        }

        const profile = await ensureProfileExists(data.user)

        if (!profile) {
          console.error("Profile missing")
          router.push("/")
          return
        }

        const role = (profile.role || "student").toLowerCase()

        if (role !== "student") {
          router.push(getHomePathForRole(role))
          return
        }

        setUserId(data.user.id)

        setProfileValues({
          birthdate: profile.birthdate,
          course: profile.course,
          gender: profile.gender,
          parentphone: profile.parentphone,
          phone: profile.phone,
          role: profile.role
        })

        setProfileModalOpen(isProfileIncomplete(profile))

      } catch (err) {
        console.error("Auth error:", err)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: listener } =
      supabase.auth.onAuthStateChange(async (_, session) => {

        if (!session?.user) {
          router.push("/")
          return
        }

        const profile = await ensureProfileExists(session.user)

        if (!profile) return

        const role = (profile.role || "student").toLowerCase()

        if (role !== "student") {
          router.push(getHomePathForRole(role))
          return
        }

        setUserId(session.user.id)

        setProfileValues({
          birthdate: profile.birthdate,
          course: profile.course,
          gender: profile.gender,
          parentphone: profile.parentphone,
          phone: profile.phone,
          role: profile.role
        })

        setProfileModalOpen(isProfileIncomplete(profile))
      })

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [router])

  /* =========================
     LOADING GUARD
  ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6">{children}</main>

      {userId && (
        <StudentProfileCompletionDialog
          initialValues={profileValues}
          open={profileModalOpen}
          onCompleted={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  )
}
