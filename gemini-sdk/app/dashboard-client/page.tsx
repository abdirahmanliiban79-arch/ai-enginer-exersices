"use client"
 
import { redirect } from "next/navigation"
// import { redirect } from "next/navigation"
import {  signOut, useSession } from "../lib/auth-client"


export default function DashboardClientPage() {
    const{ data : session , isPending } = useSession()
    if(isPending) {
        return <div>Loading...</div>
    }
    if(!session) {
        return <div>You are not logged in</div>
    }


    return (
        <div className="flex flex-col items-center justify-center h-screen">
           page : {session?.user.email}
           <button className="bg-blue-500 text-white p-2 rounded-md" onClick={() => signOut()}>Logout</button>
        </div>
    )
}