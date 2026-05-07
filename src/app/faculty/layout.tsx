"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/ui/header"
import { supabase } from "@/lib/supabase"
import { getHomePathForRole, normalizeRole } from "@/lib/roles"

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()

      const role = normalizeRole(profile?.role)

      if (role !== "faculty") {
        router.push(getHomePathForRole(role))
        return
      }

      setLoading(false)
    }

    void checkUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!session?.user) {
          router.push("/")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()

        const role = normalizeRole(profile?.role)

        if (role !== "faculty") {
          router.push(getHomePathForRole(role))
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6">{children}</main>
    </div>
  )
}
