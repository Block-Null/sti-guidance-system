"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import Header from "@/components/ui/header"

export default function ProtectedLayout({
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

      setLoading(false)
    }

    checkUser()

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_, session) => {
          if (!session?.user) {
            router.push("/")
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