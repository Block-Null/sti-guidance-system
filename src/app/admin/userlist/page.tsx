"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type Role = "student" | "faculty" | "guidance"

type UserProfile = {
  id: string
  fullname: string | null
  email: string | null
  role: string | null
  studentnumber: string | null
  phone: string | null
  created_at: string | null
}

export default function AdminUserListPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedRole, setSelectedRole] = useState<Role>("student")
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  /* =========================
     FETCH USERS
  ========================= */
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, fullname, email, role, studentnumber, phone, created_at")
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setProfiles(data || [])
      }

      setLoading(false)
    }

    fetchProfiles()
  }, [])

  /* =========================
     FILTERED USERS
  ========================= */
  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => (p.role || "student") === selectedRole)
      .filter((p) =>
        (p.fullname || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
  }, [profiles, selectedRole, search])

  /* =========================
     ROLE UPDATE
  ========================= */
  const updateRole = async (id: string, newRole: Role) => {
    if (updatingId) return

    setUpdatingId(id)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id)

      if (error) throw error

      // update UI locally
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, role: newRole } : p
        )
      )
    } catch (err: any) {
      console.error("Role update error:", err)
      setError("Failed to update role.")
    } finally {
      setUpdatingId(null)
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <Card>
      <CardHeader className="space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User List</CardTitle>
            <p className="text-sm text-slate-500">
              Manage system users and roles.
            </p>
          </div>

          {/* SEARCH */}
          <Input
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        {/* ROLE SWITCH */}
        <Tabs
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as Role)}
        >
          <TabsList>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
          </TabsList>
        </Tabs>

      </CardHeader>

      <CardContent>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading users...</p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Student No.</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y bg-white">

                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((profile) => {

                      const role = profile.role as Role

                      return (
                        <tr key={profile.id}>
                          <td className="px-4 py-3 font-medium">
                            {profile.fullname || "N/A"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {profile.email || "N/A"}
                          </td>

                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="capitalize">
                              {role || "N/A"}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {profile.studentnumber || "N/A"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {profile.phone || "N/A"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {profile.created_at
                              ? new Date(profile.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-4 py-3 text-right">

                            {/* ONLY FOR FACULTY */}
                            {role === "faculty" && (
                              <Button
                                size="sm"
                                disabled={updatingId === profile.id}
                                onClick={() =>
                                  updateRole(profile.id, "guidance")
                                }
                              >
                                Promote to Guidance
                              </Button>
                            )}

                            {/* ONLY FOR GUIDANCE */}
                            {role === "guidance" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={updatingId === profile.id}
                                onClick={() =>
                                  updateRole(profile.id, "faculty")
                                }
                              >
                                Remove as Guidance
                              </Button>
                            )}

                          </td>
                        </tr>
                      )
                    })
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}