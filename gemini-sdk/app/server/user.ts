"use server"

import { headers } from "next/headers"
import { auth } from "../lib/auth"

// signup
export async function signUpUser(email: string, password: string , name?: string) {

    const user = await auth.api.signUpEmail({
       body:{
        email,
        password,
        name: name || email,
       }
    })

return user
}

// signin
export async function signInUser(email: string, password: string) {
    
    const user = await auth.api.signInEmail({
       body:{
        email,
        password,
       }
    })

    

}
export async function getUserInfo () {
    const session = await auth.api.getSession({
        headers : await headers()
    })
    return session
}