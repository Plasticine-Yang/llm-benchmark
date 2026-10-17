async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON error page
  }
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `Request failed (${response.status}).`);
  }
  return payload;
}

export async function fetchState() {
  return request('/api/state');
}

export async function fetchHealth() {
  return request('/api/health');
}

export async function fetchMeta() {
  return request('/api/meta');
}

export async function postAction(path, body = undefined) {
  return request(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function createJob(payload) {
  return postAction('/api/jobs', payload);
}

export async function setCellBlocked(x, y, blocked) {
  return postAction('/api/block', { x, y, blocked });
}

export async function clearBlocks() {
  return postAction('/api/blocks/clear');
}

export async function pauseSimulation() {
  return postAction('/api/sim/pause');
}

export async function resumeSimulation() {
  return postAction('/api/sim/resume');
}

export async function stepSimulation() {
  return postAction('/api/sim/step');
}

export async function resetSimulation(seed) {
  return postAction('/api/sim/reset', seed === undefined ? {} : { seed });
}
