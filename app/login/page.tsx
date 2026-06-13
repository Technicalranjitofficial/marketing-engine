"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050A15]">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06D6FF]/20 to-[#9333EA]/20 border border-[#06D6FF]/30 mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Marketing Engine</h1>
          <p className="text-[#7AAFC8] text-sm">Enter password to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-[#080E1E] border border-[#06D6FF]/20 text-white placeholder-[#4A6580] outline-none focus:border-[#06D6FF]/50 focus:ring-1 focus:ring-[#06D6FF]/30 transition-all"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2 px-3 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06D6FF] to-[#9333EA] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-[#4A6580] text-xs mt-8">
          KIIT Connect Campaigns Dashboard
        </p>
      </div>
    </div>
  );
}
