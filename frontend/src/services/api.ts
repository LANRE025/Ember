const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8082';

/** Error thrown for every non-2xx response. `message` is always safe to show to the user. */
export class ApiError extends Error {
  status: number;
  fallback: boolean;
  constructor(status: number, message: string, fallback = false) {
    super(message);
    this.status = status;
    this.fallback = fallback;
  }
}

async function request(path: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the Ember server. Is the backend running?');
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let fallback = false;
    try {
      const body = await res.json();
      const d = body?.detail;
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        if (d.message) message = String(d.message);
        fallback = !!d.fallback;
      } else if (typeof d === 'string') {
        message = d;
      }
    } catch {
      /* non-JSON error body: keep the generic message */
    }
    throw new ApiError(res.status, message, fallback);
  }
  return res.json();
}

export type InterviewAnswer = { question_id: string; answer: string };

export const api = {
  getStatus: () => request('/setup/status'),
  startGoal: (name: string, why: string) => request('/setup/start', { method: 'POST', body: JSON.stringify({ name, why }) }),
  getInterview: (goal_id: number) => request(`/setup/interview/${goal_id}`),
  submitInterview: (goal_id: number, answers: InterviewAnswer[]) =>
    request('/setup/interview', { method: 'POST', body: JSON.stringify({ goal_id, answers }) }),
  raiseBand: (goal_id: number, band: 'stretch' | 'realistic') => request('/goals/raise', { method: 'POST', body: JSON.stringify({ goal_id, band }) }),
  logNight: (goal_id: number, kind: 'stretch' | 'realistic' | 'floor' | 'none') => {
    const map: Record<string, string> = { stretch: 'S', realistic: 'R', floor: 'F', none: 'N' };
    return request('/logs/log', { method: 'POST', body: JSON.stringify({ goal_id, result: map[kind] }) });
  },
  shutdown: (goal_id: number, text: string) => request('/ai/shutdown', { method: 'POST', body: JSON.stringify({ goal_id, text }) }),
  getQuests: (goal_id: number) => request(`/ai/quests/${goal_id}`),
  chat: (goal_id: number, message: string) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ goal_id, message }) }),
  getChat: (goal_id: number) => request(`/ai/chat/${goal_id}`),
  getAiHealth: () => request('/ai/health'),
  weekOverview: (goal_id: number) => request(`/week/overview/${goal_id}`),
  weekStart: (goal_id: number) => request(`/week/start/${goal_id}`, { method: 'POST' }),
  weekAnswer: (checkin_id: number, question_id: string, answer: string) => request('/week/answer', { method: 'POST', body: JSON.stringify({ checkin_id, question_id, answer }) }),
  weekPropose: (checkin_id: number) => request('/week/propose', { method: 'POST', body: JSON.stringify({ checkin_id }) }),
  weekRespond: (checkin_id: number, accept: boolean) => request('/week/respond', { method: 'POST', body: JSON.stringify({ checkin_id, accept }) }),
  weekCheck: (goal_id: number) => request(`/week/check/${goal_id}`, { method: 'POST' }),
  updateRank: (goal_id: number) => request('/rank/update', { method: 'POST', body: JSON.stringify({ goal_id }) }),};
