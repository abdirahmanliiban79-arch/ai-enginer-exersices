"use client"

import { Sparkles } from "lucide-react";



export function WelcomeScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
        <Sparkles className="size-7" />
      </div>
      <h2 className="mb-1.5 text-2xl font-semibold tracking-tight">What can I help with?</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Ask me anything — I&apos;m here to help you build, learn, and create.
      </p>
    </div>
  );
}