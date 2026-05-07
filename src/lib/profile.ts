import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { normalizeRole } from "@/lib/roles"

type ProfileRecord = {
  avatar_url: string | null
  birthdate: string | null
  course: string | null
  email: string | null
  fullname: string | null
  gender: string | null
  parentphone: string | null
  phone: string | null
  role: string | null
}

function getUserFullName(user: User) {
  const metadata = user.user_metadata

  if (typeof metadata?.full_name === "string" && metadata.full_name.trim()) {
    return metadata.full_name.trim()
  }

  if (typeof metadata?.name === "string" && metadata.name.trim()) {
    return metadata.name.trim()
  }

  return user.email ?? null
}

function getUserAvatarUrl(user: User) {
  const metadata = user.user_metadata

  if (typeof metadata?.avatar_url === "string" && metadata.avatar_url.trim()) {
    return metadata.avatar_url.trim()
  }

  if (typeof metadata?.picture === "string" && metadata.picture.trim()) {
    return metadata.picture.trim()
  }

  return null
}

export async function ensureProfileExists(user: User) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, fullname, email, avatar_url, gender, phone, birthdate, parentphone, course")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>()

  if (error) {
    throw error
  }

  if (profile) {
    return profile
  }

  const profilePayload = {
    id: user.id,
    email: user.email ?? null,
    fullname: getUserFullName(user),
    avatar_url: getUserAvatarUrl(user),
    role: "student",
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("role, fullname, email, avatar_url, gender, phone, birthdate, parentphone, course")
    .single<ProfileRecord>()

  if (insertError) {
    throw insertError
  }

  return insertedProfile
}

export function getNormalizedProfileRole(profile: ProfileRecord | null) {
  return normalizeRole(profile?.role)
}
