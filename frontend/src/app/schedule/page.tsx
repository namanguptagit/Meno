"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createMeeting } from "@/lib/api";
import { Calendar, Link as LinkIcon, Type } from "lucide-react";

export default function SchedulePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!url.includes("/j/")) {
      setError("Please enter a valid Zoom meeting URL");
      return;
    }
    
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication error");
      
      await createMeeting({
        meeting_url: url,
        meeting_name: name || "Untitled Meeting",
        scheduled_at: new Date(date).toISOString()
      }, token);
      
      router.push("/meetings");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Schedule a Recording</h1>
        <p className="text-zinc-400 mt-2">Meno will automatically join at the specified time.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Zoom URL
          </label>
          <input
            type="text"
            required
            placeholder="https://zoom.us/j/123456789?pwd=..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Meeting Name
          </label>
          <input
            type="text"
            placeholder="Friday Standup (Optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date & Time
          </label>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow [color-scheme:dark]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-zinc-950 font-semibold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center"
        >
          {loading ? "Scheduling..." : "Schedule Meno Bot"}
        </button>
      </form>
    </div>
  );
}
