"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import GuidanceSidebar from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function Page() {

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [image, setImage] = useState("")
  const [duration, setDuration] = useState(1)
  const [posts, setPosts] = useState<any[]>([])

  const fetchPosts = async () => {
    const { data } = await supabase.from("announcements").select("*")
    setPosts(data || [])
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const createPost = async () => {

    await supabase.from("announcements").insert([
      {
        title,
        content,
        image: image || null,
        duration
      }
    ])

    fetchPosts()
  }

  return (
    <div className="flex">
      <GuidanceSidebar/>

      <div className="p-8 w-full space-y-6">

        <h1 className="text-2xl font-bold">Announcements</h1>

        <div className="space-y-3">
          <Input placeholder="Title" onChange={(e)=>setTitle(e.target.value)}/>
          <Textarea placeholder="Content" onChange={(e)=>setContent(e.target.value)}/>
          <Input placeholder="Image URL (optional)" onChange={(e)=>setImage(e.target.value)}/>
          <Input type="number" placeholder="Duration (days)" onChange={(e)=>setDuration(Number(e.target.value))}/>

          <Button onClick={createPost}>
            Create Announcement
          </Button>
        </div>

        <div>
          {posts.map((p)=>(
            <div key={p.id} className="border p-4 rounded-xl mt-3">
              <h3 className="font-bold">{p.title}</h3>
              <p>{p.content}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}