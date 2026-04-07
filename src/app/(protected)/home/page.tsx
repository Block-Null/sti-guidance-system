"use client"

import { useState, useEffect } from "react" // Added useEffect import
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

import {
  MessageCircle,
  Heart,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from "lucide-react"

import BookingDialog from "@/components/ui/booking"

type Announcement = {
  id: string
  title: string
  content: string
  image: string | null
  date_posted: string
  duration: number
}

export default function HomePage() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedPost, setSelectedPost] = useState<Announcement | null>(null)
  const [openPost, setOpenPost] = useState(false)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("date_posted", { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      const validAnnouncements = data?.filter((post) => {
        const posted = new Date(post.date_posted)
        const expiry = new Date(posted)
        expiry.setDate(posted.getDate() + post.duration)
        return expiry >= new Date()
      })

      setAnnouncements(validAnnouncements || [])
    }

    fetchAnnouncements()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-12">
        <div className="grid md:grid-cols-7 gap-10 items-center">
          <div className="md:col-span-5 bg-blue-900 text-white rounded-3xl p-10 shadow-lg h-full flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Your Journey, <span className="block text-yellow-400">Our Priority</span>
            </h1>
            <p className="mt-5 text-blue-100 max-w-lg">
              Welcome to the STI College Guidance Center. We're here to listen, support, and help you navigate through your academic and personal life with confidence.
            </p>
            <Button
              onClick={() => setOpen(true)}
              className="mt-6 bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-semibold px-6 py-3 rounded-xl w-fit"
            >
              Book an Appointment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Card className="md:col-span-2 p-3 rounded-3xl shadow-lg bg-gray-100 border h-fit">
            <CardContent className="p-0">
              <div className="bg-white rounded-2xl p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 mt-16">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">Support that Grows with you</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Feature icon={<MessageCircle className="text-indigo-500" />} title="Confidentiality" desc="Your privacy is our priority." />
          <Feature icon={<Heart className="text-red-400" />} title="Well-being" desc="Holistic support for your mental health." />
          <Feature icon={<Sparkles className="text-yellow-400" />} title="Development" desc="Resources for personal growth." />
          <Feature icon={<ShieldCheck className="text-green-500" />} title="Safe Haven" desc="A non-judgmental space." />
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <section className="max-w-7xl mx-auto px-6 mt-16">
        <h2 className="text-2xl font-bold text-blue-900">What's New?</h2>
        <p className="text-gray-500 mt-2 mb-6">Stay updated with the latest announcements.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {announcements.length === 0 ? (
            <Card className="rounded-2xl p-8 text-center col-span-2">
              <CardContent>
                <p className="text-gray-500">There are no announcements currently.</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((post) => (
              <AnnouncementCard
                key={post.id}
                post={post}
                onClick={() => {
                  setSelectedPost(post)
                  setOpenPost(true)
                }}
              />
            ))
          )}
        </div>
      </section>

      {/* MODAL FOR POSTS */}
      <Dialog open={openPost} onOpenChange={setOpenPost}>
        <DialogContent className="max-w-lg">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPost.title}</DialogTitle>
              </DialogHeader>
              {selectedPost.image && (
                <img src={selectedPost.image} alt="announcement" className="rounded-lg mb-3 object-cover w-full h-48" />
              )}
              <p className="text-sm text-gray-400 mb-2">
                {new Date(selectedPost.date_posted).toLocaleDateString()}
              </p>
              <p className="text-gray-700 whitespace-pre-line">{selectedPost.content}</p>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BookingDialog open={open} setOpen={setOpen} />
    </div>
  )
}

/* Feature Card Component */
function Feature({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="rounded-2xl p-6 text-center hover:shadow-lg transition">
      <CardContent className="space-y-3">
        <div className="flex justify-center text-2xl">{icon}</div>
        <h3 className="font-semibold text-blue-900">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </CardContent>
    </Card>
  )
}

/* Renamed NewsCard to AnnouncementCard and added props */
function AnnouncementCard({ post, onClick }: { post: Announcement, onClick: () => void }) {
  return (
    <Card 
      className="rounded-2xl overflow-hidden hover:shadow-lg transition cursor-pointer"
      onClick={onClick}
    >
      <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
        {post.image ? (
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-gray-400 mb-1">
          {new Date(post.date_posted).toLocaleDateString()}
        </p>
        <h3 className="font-semibold text-blue-900 line-clamp-1">{post.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
        <p className="text-blue-900 text-sm mt-3 font-medium">Read More</p>
      </CardContent>
    </Card>
  )
}