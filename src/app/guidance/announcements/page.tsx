"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import GuidanceSidebar from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

type Announcement = {
  id: string
  title: string
  content: string
  image: string | null
  date_posted: string
  duration: number
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error("Unable to read the selected image."))
    }

    reader.onerror = () => reject(new Error("Unable to read the selected image."))
    reader.readAsDataURL(file)
  })
}

export default function Page() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageName, setImageName] = useState("")
  const [duration, setDuration] = useState(1)
  const [posts, setPosts] = useState<Announcement[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const postedAt = useMemo(() => new Date(), [])
  const expiresAt = useMemo(
    () => addDays(postedAt, Math.max(duration, 1)),
    [duration, postedAt]
  )

  const fetchPosts = async () => {
    const { data, error: fetchError } = await supabase
      .from("announcements")
      .select("*")
      .order("date_posted", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setPosts((data as Announcement[]) || [])
  }

  useEffect(() => {
    void fetchPosts()
  }, [])

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    setError("")
    setSuccess("")

    if (!file) {
      setImageDataUrl(null)
      setImageName("")
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Select a valid image file.")
      event.target.value = ""
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image size must be 2 MB or less.")
      event.target.value = ""
      return
    }

    try {
      const dataUrl = await toDataUrl(file)
      setImageDataUrl(dataUrl)
      setImageName(file.name)
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Unable to process the selected image."
      )
    }
  }

  const createPost = async () => {
    setError("")
    setSuccess("")

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.")
      return
    }

    if (!Number.isFinite(duration) || duration < 1) {
      setError("Duration must be at least 1 day.")
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from("announcements").insert([
      {
        title: title.trim(),
        content: content.trim(),
        image: imageDataUrl,
        duration,
      },
    ])

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSuccess("Announcement created successfully.")
    setTitle("")
    setContent("")
    setImageDataUrl(null)
    setImageName("")
    setDuration(1)
    await fetchPosts()
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <GuidanceSidebar />

      <div className="w-full p-8">
        <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
              <p className="text-sm text-slate-500">
                Images are optional. When provided, the image is stored directly with the announcement.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <Input
                  placeholder="Enter title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setError("")
                    setSuccess("")
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Content</label>
                <Textarea
                  placeholder="Write the announcement details"
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value)
                    setError("")
                    setSuccess("")
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Image attachment
                </label>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
                <p className="text-xs text-slate-500">
                  Optional. Supported image files only, maximum size 2 MB.
                </p>
                {imageName ? (
                  <p className="text-sm text-slate-600">Selected file: {imageName}</p>
                ) : null}
                {imageDataUrl ? (
                  <img
                    src={imageDataUrl}
                    alt="Announcement preview"
                    className="h-40 w-full rounded-lg border object-cover"
                  />
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Duration in days
                </label>
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value)
                    setDuration(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1)
                    setError("")
                    setSuccess("")
                  }}
                />
              </div>

              <div className="rounded-lg border bg-slate-100 p-4 text-sm text-slate-600">
                <p>Post starts: {postedAt.toLocaleString()}</p>
                <p>Announcement ends: {expiresAt.toLocaleString()}</p>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}

              {success ? (
                <p className="text-sm font-medium text-emerald-600">{success}</p>
              ) : null}

              <Button onClick={createPost} disabled={submitting}>
                {submitting ? "Saving..." : "Create Announcement"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published Announcements</CardTitle>
              <p className="text-sm text-slate-500">
                Review current posts with their active duration windows.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-slate-500">
                  No announcements have been posted yet.
                </div>
              ) : (
                posts.map((post) => {
                  const postDate = new Date(post.date_posted)
                  const endDate = addDays(postDate, post.duration)

                  return (
                    <div key={post.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {post.title}
                          </h3>
                          <span className="text-xs font-medium text-slate-500">
                            {post.duration} day{post.duration === 1 ? "" : "s"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">{post.content}</p>

                        {post.image ? (
                          <img
                            src={post.image}
                            alt={post.title}
                            className="h-48 w-full rounded-lg border object-cover"
                          />
                        ) : null}

                        <div className="text-xs text-slate-500">
                          <p>Posted: {postDate.toLocaleString()}</p>
                          <p>Active until: {endDate.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
