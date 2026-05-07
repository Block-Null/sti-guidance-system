import { NextResponse } from "next/server"
import { normalizeRole } from "@/lib/roles"
import {
  scheduleDedupeHash,
  validateScheduleSubmission,
} from "@/lib/submission-security"
import { createAuthenticatedSupabaseClient } from "@/lib/supabase-server"

type ExistingSchedule = {
  end_time: string
  id: string
  start_time: string
}

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function hasOverlap(
  schedules: ExistingSchedule[],
  scheduleDate: string,
  startTime: string,
  endTime: string
) {
  const nextStart = combineDateAndTime(scheduleDate, startTime)
  const nextEnd = combineDateAndTime(scheduleDate, endTime)

  return schedules.some((schedule) => {
    const scheduleStart = combineDateAndTime(scheduleDate, schedule.start_time)
    const scheduleEnd = combineDateAndTime(scheduleDate, schedule.end_time)
    return nextStart < scheduleEnd && nextEnd > scheduleStart
  })
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const validation = validateScheduleSubmission(
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

  const role = normalizeRole(profile.role)

  if (role !== "guidance" && role !== "admin") {
    return NextResponse.json(
      { error: "You are not allowed to manage schedules." },
      { status: 403 }
    )
  }

  const submission = validation.data
  const dedupeHash = scheduleDedupeHash(submission)

  const { data: existingByRequestId } = await supabase
    .from("schedule")
    .select("id")
    .eq("client_request_id", submission.clientRequestId)
    .maybeSingle()

  if (existingByRequestId) {
    return NextResponse.json({
      ignored: true,
      scheduleId: existingByRequestId.id,
    })
  }

  const { data: existingByHash } = await supabase
    .from("schedule")
    .select("id")
    .eq("dedupe_hash", dedupeHash)
    .maybeSingle()

  if (existingByHash) {
    return NextResponse.json({
      ignored: true,
      scheduleId: existingByHash.id,
    })
  }

  const { data: sameDaySchedules, error: sameDayError } = await supabase
    .from("schedule")
    .select("id, start_time, end_time")
    .eq("schedule_date", submission.scheduleDate)
    .order("start_time", { ascending: true })

  if (sameDayError) {
    return NextResponse.json({ error: sameDayError.message }, { status: 500 })
  }

  if (
    hasOverlap(
      (sameDaySchedules as ExistingSchedule[]) ?? [],
      submission.scheduleDate,
      submission.startTime,
      submission.endTime
    )
  ) {
    return NextResponse.json(
      { error: "This time overlaps with an existing schedule." },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("schedule")
    .insert({
      client_request_id: submission.clientRequestId,
      dedupe_hash: dedupeHash,
      end_time: submission.endTime,
      schedule_date: submission.scheduleDate,
      start_time: submission.startTime,
      title: submission.title,
      type: "event",
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: duplicateRecord } = await supabase
        .from("schedule")
        .select("id")
        .or(
          `client_request_id.eq.${submission.clientRequestId},dedupe_hash.eq.${dedupeHash}`
        )
        .maybeSingle()

      return NextResponse.json({
        ignored: true,
        scheduleId: duplicateRecord?.id ?? null,
      })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ignored: false,
    scheduleId: data.id,
  })
}
