const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8081';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getStatus: () => request('/setup/status'),
  startGoal: (name: string, why: string) => request('/setup/start', { method: 'POST', body: JSON.stringify({ name, why }) }),
  getInterview: (goal_id: number) => request(`/setup/interview/${goal_id}`),
  submitInterview: (goal_id: number, answers: string[]) => request('/setup/interview', { method: 'POST', body: JSON.stringify({ goal_id, answers }) }),
  raiseBand: (goal_id: number, band: 'stretch' | 'realistic') => request('/goals/raise', { method: 'POST', body: JSON.stringify({ goal_id, band }) }),
  logNight: (goal_id: number, kind: 'stretch' | 'realistic' | 'floor' | 'none') => {
    const map: Record<string, string> = { stretch: 'S', realistic: 'R', floor: 'F', none: 'N' };
    return request('/logs/log', { method: 'POST', body: JSON.stringify({ goal_id, result: map[kind] }) });
  },
  shutdown: (goal_id: number, text: string) => request('/ai/shutdown', { method: 'POST', body: JSON.stringify({ goal_id, text }) }),
  weekCheck: (goal_id: number) => request(`/week/check/${goal_id}`, { method: 'POST' }),
  updateRank: (goal_id: number) => request(`/rank/update/${goal_id}`, { method: 'POST' }),
};
