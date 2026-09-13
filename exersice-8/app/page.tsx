"use client";

import { useState } from "react";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email , password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setMessage("🚀 Account creating in background! Watch your terminal.");
      setEmail("");
      setPassword("");
    } else {
      setMessage("❌ Failed to initiate signup.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSignup} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md border">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Create Account</h2>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 uppercase">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="hello@example.com"
            className="mt-1 w-full rounded border p-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 uppercase">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password"
            className="mt-1 w-full rounded border p-2 text-sm outline-none focus:border-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black py-2 text-sm font-medium text-white rounded hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? "Sending..." : "Sign Up"}
        </button>
        {message && <p className="mt-3 text-center text-xs font-medium text-gray-700">{message}</p>}
      </form>
    </main>
  );
}

