import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/app/db/drizzle";
import { schema } from "@/app/db/auth-schema";
import { nextCookies } from "better-auth/next-js";  

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
        maxPasswordLength: 20,
        
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            accessType:"offline",
            prompt:"select_account consent",
            
        }, 
    },
    plugins:[
        nextCookies()
    ]
});