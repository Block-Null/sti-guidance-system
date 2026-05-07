"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Header from "@/components/ui/header"
import StudentProfileCompletionDialog from "@/components/ui/student-profile-completion-dialog"
import { getHomePathForRole } from "@/lib/roles"

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
     SAFE PROFILE FETCH
  ========================= */
  const getOrCreateProfile = async (user: any) => {

    // 1. Try fetch
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    // 2. If not exists → create
    if (!profile) {
      const fullName = user.user_metadata?.full_name || ""
      const email = user.email

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email,
          fullname: fullName,
          role: "student" // default fallback
        })
        .select()
        .single()

      if (insertError) {
        console.error("Profile insert error:", insertError)
        return null
      }

      profile = newProfile
    }

    return profile
  }

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

        const profile = await getOrCreateProfile(data.user)

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

        const profile = await getOrCreateProfile(session.user)

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
          userId={userId}
          onCompleted={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  )
}