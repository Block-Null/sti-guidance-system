import GuidanceSidebar from "@/components/ui/sidebar"
import Header from "@/components/ui/header"

export default function GuidancePage() {
  return (
    <div className="flex">
      <GuidanceSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold">Guidance Dashboard</h1>
      </div>
    </div>
  )
}