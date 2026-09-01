"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { redirect } from "next/navigation"
import { signInUser } from "../server/user"

export default function SignInPage() {
    
const [error , setError] = useState('')
const [success , setSuccess] = useState('')

    const {register,handleSubmit} = useForm()

    const onSubmit = async(data:any) => {
        signInUser(data.email , data.password).then((res) => {
           setSuccess('Login success')
           redirect('/dashboard')
        }).catch((err) => {
            setError(err.message)
        })
    }
    
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
            <input className="border border-gray-300 rounded-md p-2" type="email" {...register('email',{required:true,pattern:/^[^\s@]+@[^\s@]+\.[^\s@]+$/})} placeholder='Email' />
            <input className="border border-gray-300 rounded-md p-2" type="password" {...register('password',{required:true,minLength:6})} placeholder='Password' />
            <button className="bg-blue-500 text-white p-2 rounded-md" type='submit'>Sign In</button>
        </form>
     
    </div>
  )
}
