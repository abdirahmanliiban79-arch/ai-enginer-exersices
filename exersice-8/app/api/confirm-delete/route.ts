import { NextResponse } from "next/server";
import { inngest } from "../../inngest/client";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
    }

    await inngest.send({
      name: "user/delete.confirmed",
      data: { userId }
    });

    return NextResponse.json({ success: true, message: 'Confirmation request processed' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }

}