"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        router.push("/home")
      }

      setLoading(false)
    }

    checkUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (session?.user) {
          router.push("/home")
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid profile email",
        redirectTo: "http://localhost:3000/home",
      },
    })
  }

  if (loading) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-95">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Counseling Appointment System
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in using your Microsoft student account.
          </p>

          <Button
            className="w-full bg-blue-900 text-white"
            onClick={signInWithMicrosoft}
          >
            Login with Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}