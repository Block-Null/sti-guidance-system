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

      {/* Main Login Section */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl w-full items-center">

          {/* Left Info Section */}
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
              your official Microsoft student account to book sessions,
              monitor appointments, and receive support from the
              Guidance Office.
            </p>

            <Separator />

            <div className="grid grid-cols-2 gap-4">

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Confidential
                  </p>
                  <p className="text-sm text-gray-500">
                    All counseling sessions are handled with strict privacy.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Easy Scheduling
                  </p>
                  <p className="text-sm text-gray-500">
                    Book appointments with the guidance office online.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Student Support
                  </p>
                  <p className="text-sm text-gray-500">
                    Academic, personal, and career guidance resources.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <p className="font-semibold text-blue-900">
                    Secure Login
                  </p>
                  <p className="text-sm text-gray-500">
                    Sign in using your official STI Microsoft account.
                  </p>
                </CardContent>
              </Card>

            </div>

          </div>

          {/* Login Card */}
          <Card className="w-full max-w-md mx-auto shadow-lg">

            <CardHeader>
              <CardTitle className="text-center text-xl text-blue-900">
                Login
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">

              <p className="text-sm text-gray-500 text-center">
                Sign in using your official STI Microsoft account
                to continue.
              </p>

              <Button
                onClick={signInWithMicrosoft}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white h-11"
              >
                Login with Microsoft
              </Button>

              <p className="text-xs text-gray-400 text-center">
                By signing in, you agree to the STI Guidance Office
                privacy and confidentiality policies.
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