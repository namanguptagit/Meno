export async function fetchMeetings(token: string, search?: string) {
  let url = "/api/meetings";
  if (search) {
    url += `?search=${encodeURIComponent(search)}`;
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export async function fetchMeeting(id: string, token: string) {
  const res = await fetch(`/api/meetings/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch meeting");
  return res.json();
}

export async function createMeeting(data: any, token: string) {
  const res = await fetch("/api/meetings", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to schedule meeting");
  }
  return res.json();
}

export async function deleteMeeting(id: string, token: string) {
  const res = await fetch(`/api/meetings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to cancel meeting");
}

export async function summarizeMeeting(id: string, token: string) {
  const res = await fetch(`/api/meetings/${id}/summarize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to summarize meeting");
  }
  return res.json();
}
