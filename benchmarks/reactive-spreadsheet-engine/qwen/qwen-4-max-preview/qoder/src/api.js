async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
  return data;
}

export function fetchWorkbook() {
  return request('/api/workbook');
}

export function putWorkbook(cells) {
  return request('/api/workbook', { method: 'PUT', body: JSON.stringify({ cells }) });
}

export function clearWorkbookRemote() {
  return request('/api/workbook/clear', { method: 'POST' });
}