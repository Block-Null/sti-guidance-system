"use client"

import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const items = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/userlist",
    label: "User List",
    icon: Users,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-blue-900">Admin Panel</h2>
        <p className="text-sm text-slate-500">System management</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => router.push(item.href)}
            >
              <Icon size={18} />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
