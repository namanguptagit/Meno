"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchMeeting, summarizeMeeting } from "@/lib/api";
import { useParams } from "next/navigation";
import { Copy, Clock, CheckCircle, Sparkles } from "lucide-react";

export default function MeetingDetailsPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [tokenState, setTokenState] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (token) {
          setTokenState(token);
          const data = await fetchMeeting(params.id as string, token);
          setMeeting(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken, params.id]);

  const handleCopy = () => {
    if (!meeting || !meeting.transcript) return;
    const fullText = meeting.transcript.map((t: any) => t.text).join(" ");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true);
      setSummaryError("");
      const token = await getToken();
      if (token) {
        const data = await summarizeMeeting(params.id as string, token);
        setMeeting({ ...meeting, summary: data.summary });
      }
    } catch (e: any) {
      setSummaryError(e.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-zinc-500 animate-pulse">Loading transcript...</div>;
  }

  if (!meeting) {
    return <div className="text-center p-12 text-zinc-500">Meeting not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{meeting.meeting_name}</h1>
          <div className="flex items-center gap-4 mt-3 text-zinc-400 text-sm">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(meeting.scheduled_at).toLocaleString()}</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-xs">{meeting.status}</span>
          </div>
        </div>
        {meeting.status === 'completed' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing || !!meeting.summary}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSummarizing ? "Summarizing..." : meeting.summary ? "Summarized" : "Summarize"}
            </button>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Full Text"}
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 space-y-6">
        {summaryError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
            {summaryError}
          </div>
        )}
        
        {meeting.summary && (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" /> AI Summary
            </h2>
            <div className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {meeting.summary}
            </div>
          </div>
        )}

        {meeting.status === 'completed' && (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sticky top-4 z-10 shadow-lg shadow-zinc-950/50">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Meeting Audio</h3>
            <audio ref={audioRef} controls src={`/api/meetings/${meeting.id}/audio?token=${tokenState}`} className="w-full" />
          </div>
        )}

        {meeting.status === 'completed' && meeting.transcript ? (
          <div className="space-y-1 bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            {meeting.transcript.map((segment: any, i: number) => (
              <div 
                key={i} 
                onClick={() => handleSeek(segment.start)} 
                className={`flex gap-4 p-3 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors ${i % 2 === 0 ? 'bg-zinc-900' : 'bg-transparent'}`}
              >
                <span className="text-blue-400/70 font-mono text-sm shrink-0 mt-0.5">{formatTime(segment.start)}</span>
                <div className="flex flex-col">
                  {segment.speaker && <span className="text-xs font-bold text-zinc-500 mb-1">{segment.speaker}</span>}
                  <p className="text-zinc-200 leading-relaxed">{segment.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            {meeting.status === 'failed' ? (
              <div className="text-red-400">
                <p className="font-semibold mb-2">Bot Failed</p>
                <p className="font-mono text-xs bg-red-950/50 p-4 rounded text-left overflow-auto mt-4">{meeting.error_message}</p>
              </div>
            ) : (
              <p className="text-zinc-400 text-lg">Bot is currently in status: <span className="font-mono text-blue-400">{meeting.status}</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
