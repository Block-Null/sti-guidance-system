"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

type StudentProfileFields = {
  birthdate: string | null
  course: string | null
  gender: string | null
  parentphone: string | null
  phone: string | null
}

type StudentProfileCompletionDialogProps = {
  initialValues: StudentProfileFields
  open: boolean
  userId: string
  onCompleted: () => void
}

function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input bg-transparent h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none transition",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  )
}

function isBlank(value: string | null | undefined) {
  return !value || !value.trim()
}

export default function StudentProfileCompletionDialog({
  initialValues,
  open,
  userId,
  onCompleted,
}: StudentProfileCompletionDialogProps) {

  const [gender, setGender] = useState(initialValues.gender ?? "")
  const [phone, setPhone] = useState(initialValues.phone ?? "")
  const [birthdate, setBirthdate] = useState(initialValues.birthdate ?? "")
  const [parentPhone, setParentPhone] = useState(initialValues.parentphone ?? "")
  const [course, setCourse] = useState(initialValues.course ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const saveProfile = async () => {
    if (saving) return

    setError("")

    if (
      isBlank(gender) ||
      isBlank(phone) ||
      isBlank(birthdate) ||
      isBlank(parentPhone) ||
      isBlank(course)
    ) {
      setError("Complete all required fields before continuing.")
      return
    }

    const selectedBirthdate = new Date(`${birthdate}T00:00:00`)
    const today = new Date()

    if (isNaN(selectedBirthdate.getTime()) || selectedBirthdate > today) {
      setError("Birthdate must be valid and not in the future.")
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          birthdate,
          course: course.trim(),
          gender: gender.trim(),
          parentphone: parentPhone.trim(),
          phone: phone.trim(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error("Profile update failed. No row returned.")
      }

      onCompleted()

    } catch (err: any) {
      console.error("Save profile error:", err)
      setError(err.message || "Failed to save profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete Your Student Profile</DialogTitle>
          <DialogDescription>
            Fill in your information before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Birthdate</label>
            <Input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              placeholder="09XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Phone</label>
            <Input
              placeholder="09XXXXXXXXX"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Course</label>
            <Input
              placeholder="Enter your course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>

        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <DialogFooter>
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save and Continue"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}