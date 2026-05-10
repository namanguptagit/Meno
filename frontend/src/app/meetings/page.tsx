"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchMeetings, deleteMeeting } from "@/lib/api";
import Link from "next/link";
import { Trash2, Search } from "lucide-react";

export default function MeetingsPage() {
  const { getToken } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const token = await getToken();
      if (token) {
        const data = await fetchMeetings(token, search);
        setMeetings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [getToken, search]);

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      if (token) {
        await deleteMeeting(id, token);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled': return <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium border border-blue-500/30">Scheduled</span>;
      case 'joining': return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-medium border border-yellow-500/30 animate-pulse">Joining</span>;
      case 'recording': return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium border border-red-500/30 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Recording</span>;
      case 'transcribing': return <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-medium border border-orange-500/30">Transcribing</span>;
      case 'completed': return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium border border-green-500/30">Completed</span>;
      case 'failed': return <span className="bg-red-900/40 text-red-400 px-2 py-1 rounded text-xs font-medium border border-red-800">Failed</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Meetings</h1>
          <p className="text-zinc-400 mt-2">Manage and view all your recorded sessions.</p>
        </div>
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search transcripts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 animate-pulse">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No meetings scheduled yet.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {meetings.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                <Link href={m.status === 'completed' ? `/meetings/${m.id}` : '#'} className={`flex-1 ${m.status !== 'completed' ? 'cursor-default pointer-events-none' : ''}`}>
                  <div className="font-medium text-lg text-zinc-200">{m.meeting_name}</div>
                  <div className="text-sm text-zinc-500 mt-1">{new Date(m.scheduled_at).toLocaleString()}</div>
                </Link>
                <div className="flex items-center gap-4">
                  {getStatusBadge(m.status)}
                  {m.status === 'scheduled' && (
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
