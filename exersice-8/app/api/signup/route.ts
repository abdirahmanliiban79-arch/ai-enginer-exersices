import { NextResponse } from "next/server";
import { inngest } from "../.././inngest/client";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();


    await inngest.send({
      name: "user/signup",
      data: { email, password },
    });

    return NextResponse.json({ success: true, message: "Signup initiated!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "System error" }, { status: 500 });
  }
}
