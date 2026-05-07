import { NextResponse } from "next/server"
import { normalizeRole } from "@/lib/roles"
import {
  announcementDedupeHash,
  validateAnnouncementSubmission,
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

  const validation = validateAnnouncementSubmission(await request.json())

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

  const role = normalizeRole(profile.role)

  if (role !== "guidance" && role !== "admin") {
    return NextResponse.json(
      { error: "You are not allowed to create announcements." },
      { status: 403 }
    )
  }

  const submission = validation.data
  const dedupeHash = announcementDedupeHash(submission)

  const { data: existingByRequestId } = await supabase
    .from("announcements")
    .select("id")
    .eq("client_request_id", submission.clientRequestId)
    .maybeSingle()

  if (existingByRequestId) {
    return NextResponse.json({
      announcementId: existingByRequestId.id,
      ignored: true,
    })
  }

  const { data: existingByHash } = await supabase
    .from("announcements")
    .select("id")
    .eq("dedupe_hash", dedupeHash)
    .maybeSingle()

  if (existingByHash) {
    return NextResponse.json({
      announcementId: existingByHash.id,
      ignored: true,
    })
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      client_request_id: submission.clientRequestId,
      content: submission.content,
      dedupe_hash: dedupeHash,
      duration: submission.duration,
      image: submission.image,
      title: submission.title,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: duplicateRecord } = await supabase
        .from("announcements")
        .select("id")
        .or(
          `client_request_id.eq.${submission.clientRequestId},dedupe_hash.eq.${dedupeHash}`
        )
        .maybeSingle()

      return NextResponse.json({
        announcementId: duplicateRecord?.id ?? null,
        ignored: true,
      })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    announcementId: data.id,
    ignored: false,
  })
}
