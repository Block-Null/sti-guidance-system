import { createHash } from "crypto"

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type AppointmentSubmission = {
  appointmentDate: string
  clientRequestId: string
  details: string
  reason: string
}

export type AnnouncementSubmission = {
  clientRequestId: string
  content: string
  duration: number
  image: string | null
  title: string
}

export type ScheduleSubmission = {
  clientRequestId: string
  endTime: string
  scheduleDate: string
  startTime: string
  title: string
}

export type ProfileCompletionSubmission = {
  birthdate: string
  course: string
  gender: string
  parentPhone: string
  phone: string
}

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9-]{16,128}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/
const PHONE_PATTERN = /^09\d{9}$/
const ALLOWED_GENDERS = new Set(["Male", "Female", "Prefer not to say"])

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value.trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function hashParts(parts: Array<string | number | null | undefined>) {
  const normalized = parts.map((part) => String(part ?? "")).join("|")
  return createHash("sha256").update(normalized).digest("hex")
}

export function normalizeDateTimeForStorage(dateTime: string) {
  const parsed = new Date(dateTime)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export function validateAppointmentSubmission(
  input: unknown,
  currentYear: number,
  now = new Date()
): ValidationResult<AppointmentSubmission> {
  if (!isRecord(input)) {
    return { success: false, error: "Invalid request body." }
  }

  const reason = normalizeWhitespace(String(input.reason ?? ""))
  const details = normalizeWhitespace(String(input.details ?? ""))
  const appointmentDate = String(input.appointmentDate ?? "")
  const clientRequestId = String(input.clientRequestId ?? "")

  if (!isValidRequestId(clientRequestId)) {
    return { success: false, error: "Missing or invalid request identifier." }
  }

  if (!reason || reason.length > 120) {
    return {
      success: false,
      error: "Reason is required and must be 120 characters or fewer.",
    }
  }

  if (details.length > 1000) {
    return {
      success: false,
      error: "Details must be 1000 characters or fewer.",
    }
  }

  const normalizedDate = normalizeDateTimeForStorage(appointmentDate)

  if (!normalizedDate) {
    return { success: false, error: "Appointment date and time is invalid." }
  }

  const parsedDate = new Date(normalizedDate)

  if (parsedDate < now) {
    return { success: false, error: "Appointment date must be in the future." }
  }

  if (parsedDate.getFullYear() !== currentYear) {
    return {
      success: false,
      error: `Appointments must stay within ${currentYear}.`,
    }
  }

  return {
    success: true,
    data: {
      appointmentDate: normalizedDate,
      clientRequestId: clientRequestId.trim(),
      details,
      reason,
    },
  }
}

export function validateAnnouncementSubmission(
  input: unknown
): ValidationResult<AnnouncementSubmission> {
  if (!isRecord(input)) {
    return { success: false, error: "Invalid request body." }
  }

  const clientRequestId = String(input.clientRequestId ?? "")
  const title = normalizeWhitespace(String(input.title ?? ""))
  const content = normalizeWhitespace(String(input.content ?? ""))
  const duration = Number(input.duration ?? 0)
  const image = input.image == null ? null : String(input.image)

  if (!isValidRequestId(clientRequestId)) {
    return { success: false, error: "Missing or invalid request identifier." }
  }

  if (!title || title.length > 150) {
    return {
      success: false,
      error: "Title is required and must be 150 characters or fewer.",
    }
  }

  if (!content || content.length > 5000) {
    return {
      success: false,
      error: "Content is required and must be 5000 characters or fewer.",
    }
  }

  if (!Number.isInteger(duration) || duration < 1 || duration > 30) {
    return {
      success: false,
      error: "Duration must be a whole number between 1 and 30 days.",
    }
  }

  if (image && (!image.startsWith("data:image/") || image.length > 3_000_000)) {
    return {
      success: false,
      error: "Image payload is invalid or too large.",
    }
  }

  return {
    success: true,
    data: {
      clientRequestId: clientRequestId.trim(),
      content,
      duration,
      image,
      title,
    },
  }
}

export function validateScheduleSubmission(
  input: unknown,
  currentYear: number,
  now = new Date()
): ValidationResult<ScheduleSubmission> {
  if (!isRecord(input)) {
    return { success: false, error: "Invalid request body." }
  }

  const clientRequestId = String(input.clientRequestId ?? "")
  const scheduleDate = String(input.scheduleDate ?? "")
  const startTime = String(input.startTime ?? "")
  const endTime = String(input.endTime ?? "")
  const title = normalizeWhitespace(String(input.title ?? ""))

  if (!isValidRequestId(clientRequestId)) {
    return { success: false, error: "Missing or invalid request identifier." }
  }

  if (!ISO_DATE_PATTERN.test(scheduleDate)) {
    return { success: false, error: "Schedule date is invalid." }
  }

  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return { success: false, error: "Schedule time is invalid." }
  }

  if (!title || title.length > 120) {
    return {
      success: false,
      error: "Title is required and must be 120 characters or fewer.",
    }
  }

  const startDateTime = new Date(`${scheduleDate}T${startTime}:00`)
  const endDateTime = new Date(`${scheduleDate}T${endTime}:00`)

  if (
    Number.isNaN(startDateTime.getTime()) ||
    Number.isNaN(endDateTime.getTime())
  ) {
    return { success: false, error: "Schedule date and time are invalid." }
  }

  if (startDateTime.getFullYear() !== currentYear) {
    return {
      success: false,
      error: `Schedules can only be created within ${currentYear}.`,
    }
  }

  if (startDateTime < now) {
    return { success: false, error: "You cannot create a schedule in the past." }
  }

  if (endDateTime <= startDateTime) {
    return {
      success: false,
      error: "End time must be later than the start time.",
    }
  }

  return {
    success: true,
    data: {
      clientRequestId: clientRequestId.trim(),
      endTime,
      scheduleDate,
      startTime,
      title,
    },
  }
}

export function validateProfileCompletionSubmission(
  input: unknown
): ValidationResult<ProfileCompletionSubmission> {
  if (!isRecord(input)) {
    return { success: false, error: "Invalid request body." }
  }

  const birthdate = String(input.birthdate ?? "").trim()
  const course = normalizeWhitespace(String(input.course ?? ""))
  const gender = normalizeWhitespace(String(input.gender ?? ""))
  const parentPhone = String(input.parentPhone ?? "").trim()
  const phone = String(input.phone ?? "").trim()

  if (
    !birthdate ||
    !course ||
    !gender ||
    !parentPhone ||
    !phone
  ) {
    return {
      success: false,
      error: "Complete all required fields before continuing.",
    }
  }

  if (!ISO_DATE_PATTERN.test(birthdate)) {
    return {
      success: false,
      error: "Birthdate must use a valid YYYY-MM-DD format.",
    }
  }

  const selectedBirthdate = new Date(`${birthdate}T00:00:00`)

  if (
    Number.isNaN(selectedBirthdate.getTime()) ||
    selectedBirthdate > new Date()
  ) {
    return {
      success: false,
      error: "Birthdate must be valid and not in the future.",
    }
  }

  if (!ALLOWED_GENDERS.has(gender)) {
    return { success: false, error: "Select a valid gender option." }
  }

  if (!PHONE_PATTERN.test(phone) || !PHONE_PATTERN.test(parentPhone)) {
    return {
      success: false,
      error: "Phone numbers must use the 09XXXXXXXXX format.",
    }
  }

  if (course.length > 120) {
    return {
      success: false,
      error: "Course must be 120 characters or fewer.",
    }
  }

  return {
    success: true,
    data: {
      birthdate,
      course,
      gender,
      parentPhone,
      phone,
    },
  }
}

export function appointmentDedupeHash(
  studentId: string,
  submission: AppointmentSubmission
) {
  return hashParts([
    "appointment",
    studentId,
    submission.reason.toLowerCase(),
    submission.details.toLowerCase(),
    submission.appointmentDate,
  ])
}

export function announcementDedupeHash(submission: AnnouncementSubmission) {
  return hashParts([
    "announcement",
    submission.title.toLowerCase(),
    submission.content.toLowerCase(),
    submission.duration,
    submission.image ?? "",
  ])
}

export function scheduleDedupeHash(submission: ScheduleSubmission) {
  return hashParts([
    "schedule",
    submission.scheduleDate,
    submission.startTime,
    submission.endTime,
    submission.title.toLowerCase(),
  ])
}
