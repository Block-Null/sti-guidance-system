import { NextResponse } from "next/server"
import { normalizeRole } from "@/lib/roles"
import { validateProfileCompletionSubmission } from "@/lib/submission-security"
import { createAuthenticatedSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const supabase = await createAuthenticatedSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const validation = validateProfileCompletionSubmission(await request.json())

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const profileRole = normalizeRole(existingProfile?.role)

  if (profileRole && profileRole !== "student") {
    return NextResponse.json(
      { error: "Only student profiles can be completed here." },
      { status: 403 }
    )
  }

  const submission = validation.data

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        birthdate: submission.birthdate,
        course: submission.course,
        gender: submission.gender,
        id: user.id,
        parentphone: submission.parentPhone,
        phone: submission.phone,
        role: profileRole ?? "student",
      },
      { onConflict: "id" }
    )
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profileId: data.id, success: true })
}
