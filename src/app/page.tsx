"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  /* ----------------------------------
     ROLE-BASED REDIRECTION
  ---------------------------------- */
  const handleUserRedirect = async () => {
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setLoading(false)
      return
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single()

    if (error || !profile) {
      console.error("Profile fetch error:", error)
      setLoading(false)
      return
    }

    const role = profile.role

    if (role === "guidance") {
      router.push("/guidance")
    } else {
      router.push("/home") // default student
    }
  }

  /* ----------------------------------
     CHECK USER ON LOAD
  ---------------------------------- */
  useEffect(() => {
    handleUserRedirect()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          await handleUserRedirect()
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  /* ----------------------------------
     MICROSOFT LOGIN
  ---------------------------------- */
  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid profile email",
        redirectTo: "http://localhost:3000/api/auth/callback", 
        // redirect back here → we handle role routing after login
      },
    })
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Topbar */}
      <div className="w-full bg-white border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center font-bold">
          </div>
          <span className="font-semibold text-blue-900 text-lg">
            STI Guidance
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-600">
          <button className="hover:text-blue-900">About</button>
          <button className="hover:text-blue-900">FAQ</button>
          <button className="hover:text-blue-900">Support</button>
        </div>
      </div>

      {/* Main Section */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl w-full items-center">

          {/* LEFT INFO */}
          <div className="space-y-6">

            <Badge className="bg-yellow-400 text-black">
              STI College Alabang
            </Badge>

            <h1 className="text-4xl font-bold text-blue-900 leading-tight">
              Your Journey, <br />
              <span className="text-yellow-500">
                Our Priority
              </span>
            </h1>

            <p className="text-gray-600 max-w-md">
              Access the Guidance Counseling Appointment System using
              your official Microsoft account to book sessions,
              monitor appointments, and receive support.
            </p>

            <Separator />

            <div className="grid grid-cols-2 gap-4">

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Confidential
                  </p>
                  <p className="text-sm text-gray-500">
                    Sessions are handled with strict privacy.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Easy Scheduling
                  </p>
                  <p className="text-sm text-gray-500">
                    Book appointments online.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Student Support
                  </p>
                  <p className="text-sm text-gray-500">
                    Academic & personal guidance.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Secure Login
                  </p>
                  <p className="text-sm text-gray-500">
                    Microsoft account authentication.
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* LOGIN CARD */}
          <Card className="w-full max-w-md mx-auto shadow-lg">

            <CardHeader>
              <CardTitle className="text-center text-xl text-blue-900">
                Login
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">

              <p className="text-sm text-gray-500 text-center">
                Sign in using your official STI Microsoft account.
              </p>

              <Button
                onClick={signInWithMicrosoft}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white h-11"
              >
                Login with Microsoft
              </Button>

              <p className="text-xs text-gray-400 text-center">
                By signing in, you agree to STI Guidance policies.
              </p>

            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white py-6 text-center text-sm text-gray-500">
        STI College Alabang • Guidance Counseling System
      </div>

    </div>
  )
}