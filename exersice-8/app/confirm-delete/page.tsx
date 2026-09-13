"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ConfirmDeleteContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || searchParams.get("userid"); 
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleConfirm = async () => {
    if (!userId) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/confirm-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-red-500 font-semibold">Invalid or expired confirmation link.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md border text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Account Deletion</h2>
        
        {status === "idle" && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Are you absolute sure? This action is permanent and cannot be undone.
            </p>
            <button
              onClick={handleConfirm}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded text-sm transition-colors"
            >
              Permanently Delete My Account
            </button>
          </>
        )}

        {status === "loading" && (
          <p className="text-sm text-gray-500 animate-pulse font-medium">Communicating with the engine...</p>
        )}

        {status === "success" && (
          <div className="space-y-2">
            <p className="text-emerald-600 font-semibold text-lg">✨ Confirmed successfully!</p>
            <p className="text-xs text-gray-500">Your background workflow has been unpaused and account cleanup is underway.</p>
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-red-500 font-medium">Something went wrong. Please try again later.</p>
        )}
      </div>
    </main>
  );
}

export default function ConfirmDeletePage() {
  return (
    <Suspense fallback={<p className="text-center p-8 text-gray-500">Loading...</p>}>
      <ConfirmDeleteContent />
    </Suspense>
  );
}
