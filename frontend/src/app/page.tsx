"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMeetings } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { PlusCircle, Calendar, FileText } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken();
        if (token) {
          const data = await fetchMeetings(token);
          setMeetings(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [getToken]);

  const upcoming = meetings.filter((m: any) => m.status === 'scheduled' || m.status === 'joining' || m.status === 'recording');
  const completed = meetings.filter((m: any) => m.status === 'completed');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hey, {user?.firstName || "there"}</h1>
        <p className="text-zinc-400 mt-2">Welcome to Meno. Your personal Zoom meeting transcriber.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Upcoming</span>
          </div>
          <div className="text-3xl font-bold">{upcoming.length}</div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Transcribed</span>
          </div>
          <div className="text-3xl font-bold">{completed.length}</div>
        </div>

        <Link href="/schedule" className="group bg-blue-600 hover:bg-blue-500 transition-colors border border-blue-500 rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <PlusCircle className="w-8 h-8 mb-2 text-blue-200 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-lg">Schedule Recording</span>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transcripts</h2>
        {loading ? (
          <div className="animate-pulse flex gap-4">
            <div className="h-24 bg-zinc-800 rounded-xl w-full"></div>
          </div>
        ) : completed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.slice(0, 4).map((m: any) => (
              <Link key={m.id} href={`/meetings/${m.id}`} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl p-5 block">
                <h3 className="font-medium truncate">{m.meeting_name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{new Date(m.scheduled_at).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
            No transcripts yet. Schedule a bot to join your next meeting!
          </div>
        )}
      </div>
    </div>
  );
}
