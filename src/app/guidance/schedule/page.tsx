"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import GuidanceSidebar from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export default function Page() {

  const [date, setDate] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [title, setTitle] = useState("")

  const addSchedule = async () => {

    await supabase.from("schedule").insert([
      {
        schedule_date: date,
        start_time: start,
        end_time: end,
        title,
        type: "event"
      }
    ])

    alert("Schedule Added")
  }

  return (
    <div className="flex">
      <GuidanceSidebar/>

      <div className="p-8 w-full space-y-4">

        <h1 className="text-2xl font-bold">Manage Schedule</h1>

        <input type="date" onChange={(e)=>setDate(e.target.value)}/>
        <input type="time" onChange={(e)=>setStart(e.target.value)}/>
        <input type="time" onChange={(e)=>setEnd(e.target.value)}/>
        <input placeholder="Title" onChange={(e)=>setTitle(e.target.value)}/>

        <Button onClick={addSchedule}>
          Add Schedule
        </Button>

      </div>
    </div>
  )
}