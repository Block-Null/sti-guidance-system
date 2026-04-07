'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Profile = {
    fullname: string | null
    email: string | null
    studentnumber: string | null
    gender: string | null
    phone: string | null
    birthdate: string | null
    avatar_url: string | null
}

export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: authData, error: authError } = await supabase.auth.getUser()

            if (authError || !authData.user) {
                router.push('/')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('fullname,email,studentnumber,gender,phone,birthdate,avatar_url')
                .eq('id', authData.user.id)
                .maybeSingle()

            if (error) {
                console.error('Profile fetch error:', error)
                return
            }

            setProfile(data)
        }

        fetchProfile()
    }, [router])

    if (!profile) return null

    return (
        <div className="min-h-screen bg-white px-16 py-10">
            {/* Page Title */}
            <h1 className="text-[20px] font-bold text-[#163A63] mb-6">My Profile</h1>

            {/* Profile Card */}
            <div className="border rounded-[20px] p-10 flex flex-wrap lg:flex-nowrap gap-20 bg-white shadow-sm">
                {/* LEFT SIDE */}
                <div className="flex flex-col items-center w-full lg:w-[260px]">
                    <div className="w-[130px] h-[130px] rounded-full overflow-hidden bg-gray-200">
                        <Image
                            src={
                                profile.avatar_url ||
                                "https://ui-avatars.com/api/?background=e5e7eb&color=6b7280&size=170"
                            }
                            alt="profile"
                            width={170}
                            height={170}
                            className="object-cover"
                        />
                    </div>

                    <h2 className="text-[18px] font-semibold text-[#163A63] mt-5 text-center">
                        {profile.fullname || 'LastName, FirstName M.I'}
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                        {profile.studentnumber || 'StudentNumber'}
                    </p>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex-1">
                    <h2 className="text-[16px] font-semibold text-[#163A63] mb-8">
                        Personal Information
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-500 text-sm">Email Address</p>
                            <p className="text-[15px] font-medium text-gray-800">
                                {profile.email || 'Email Address'}
                            </p>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm">Date of Birth</p>
                            <p className="text-[15px] font-medium text-gray-800">
                                {profile.birthdate || 'MM/DD/YYYY'}
                            </p>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm">Gender</p>
                            <p className="text-[15px] font-medium text-gray-800">
                                {profile.gender || 'Gender'}
                            </p>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm">Contact Number</p>
                            <p className="text-[15px] font-medium text-gray-800">
                                {profile.phone || '09--'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
