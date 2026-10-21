import type { Priority, SimulationState } from "../shared/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export const api = {
  state: () => request<SimulationState>("/api/state"),
  control: (action: "pause" | "resume" | "step" | "reset") => request<SimulationState>(`/api/control/${action}`, { method: "POST" }),
  createJob: (shelfId: string, workstationId: string, priority: Priority) => request("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ shelfId, workstationId, priority }),
  }),
  setBlocked: (x: number, y: number, blocked: boolean) => request<SimulationState>(`/api/cells/${x}/${y}`, {
    method: "POST",
    body: JSON.stringify({ blocked }),
  }),
};
