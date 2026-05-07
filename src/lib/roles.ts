export type AppRole = "student" | "guidance" | "admin" | "faculty"

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) {
    return null
  }

  const normalized = role.toLowerCase().trim()

  if (
    normalized === "student" ||
    normalized === "guidance" ||
    normalized === "admin" ||
    normalized === "faculty"
  ) {
    return normalized
  }

  return null
}

export function getHomePathForRole(role: AppRole | null) {
  switch (role) {
    case "guidance":
      return "/guidance/dashboard"
    case "admin":
      return "/admin/dashboard"
    case "faculty":
      return "/faculty"
    case "student":
    default:
      return "/student/home"
  }
}
