import { NextResponse } from "next/server"
import { normalizeRole } from "@/lib/roles"
import {
  appointmentDedupeHash,
  validateAppointmentSubmission,
} from "@/lib/submission-security"
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

  const validation = validateAppointmentSubmission(
    await request.json(),
    new Date().getFullYear()
  )

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string | null }>()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (normalizeRole(profile.role) !== "student") {
    return NextResponse.json(
      { error: "Only students can create appointments." },
      { status: 403 }
    )
  }

  const submission = validation.data
  const dedupeHash = appointmentDedupeHash(user.id, submission)

  const { data: existingByRequestId } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("client_request_id", submission.clientRequestId)
    .maybeSingle()

  if (existingByRequestId) {
    return NextResponse.json({
      appointmentId: existingByRequestId.id,
      ignored: true,
      status: existingByRequestId.status ?? "pending",
    })
  }

  const { data: existingByHash } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("dedupe_hash", dedupeHash)
    .maybeSingle()

  if (existingByHash) {
    return NextResponse.json({
      appointmentId: existingByHash.id,
      ignored: true,
      status: existingByHash.status ?? "pending",
    })
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      appointment_date: submission.appointmentDate,
      client_request_id: submission.clientRequestId,
      dedupe_hash: dedupeHash,
      details: submission.details,
      reason: submission.reason,
      student_id: user.id,
    })
    .select("id, status")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: duplicateRecord } = await supabase
        .from("appointments")
        .select("id, status")
        .or(
          `client_request_id.eq.${submission.clientRequestId},dedupe_hash.eq.${dedupeHash}`
        )
        .maybeSingle()

      return NextResponse.json({
        appointmentId: duplicateRecord?.id ?? null,
        ignored: true,
        status: duplicateRecord?.status ?? "pending",
      })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    appointmentId: data.id,
    ignored: false,
    status: data.status ?? "pending",
  })
}
