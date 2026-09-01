"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { signUpUser } from "../server/user"
import { signIn } from "../lib/auth-client"

export default function SignUpPage() {

    const [error , setError] = useState('')
    const {register,handleSubmit} = useForm()
    
const onSubmit = async(data:any) => {
    signUpUser(data.email , data.password , data.name).then((res) => {
        console.log(res)
    }).catch((err) => {
        console.log(err)
        setError(err.message)
    })

}
 const handleAuthWithGoogle = async () => {
    signIn.social({provider:'google'}).then((res) => {
        console.log(res)
    }).catch((err) => {
        console.log(err)
        setError(err.message)
    })
 }
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
            <input className="border border-gray-300 rounded-md p-2" type="email" {...register('email',{required:true,pattern:/^[^\s@]+@[^\s@]+\.[^\s@]+$/})} placeholder='Email' />
            <input className="border border-gray-300 rounded-md p-2" type="password" {...register('password',{required:true,minLength:6})} placeholder='Password' />
            <button className="bg-blue-500 text-white p-2 rounded-md" type='submit'>Sign Up</button>
            <button className="bg-blue-500 text-white p-2 rounded-md cursor-pointer" type='button' onClick={handleAuthWithGoogle}>Sign Up with Google</button>
        </form>
     
    </div>
  )
}
