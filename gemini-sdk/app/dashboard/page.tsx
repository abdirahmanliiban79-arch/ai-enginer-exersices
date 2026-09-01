import { redirect } from "next/navigation"
import { getUserInfo } from "../server/user"


export default async function DashboardPage() {
    const session = await getUserInfo()

    if(!session) {
        redirect('/signin')
        return (
            <div>
                <h1>You are not logged in</h1>
            </div>
        )
    }
    return (
        <div>
            <h1>Dashboard : {session.user.email}</h1>
        </div>
    )
}