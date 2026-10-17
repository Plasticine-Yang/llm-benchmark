export const PRIORITY = {
  3: { label: 'HIGH', short: 'H', tone: 'high' },
  2: { label: 'NORMAL', short: 'N', tone: 'normal' },
  1: { label: 'LOW', short: 'L', tone: 'low' },
};

export const ROBOT_STATUS = {
  idle: { label: 'IDLE', tone: 'idle' },
  to_pickup: { label: 'TO PICKUP', tone: 'pickup' },
  loaded: { label: 'DELIVERING', tone: 'delivery' },
  returning: { label: 'RETURNING', tone: 'return' },
};

export const JOB_STATUS = {
  queued: { label: 'QUEUED', tone: 'queued' },
  assigned: { label: 'ASSIGNED', tone: 'active' },
  loaded: { label: 'IN TRANSIT', tone: 'loaded' },
  completed: { label: 'DELIVERED', tone: 'done' },
};

export const WAIT_LABEL = {
  TRAFFIC: 'Traffic reservation',
  CORRIDOR: 'Aisle lock',
  OBSTACLE: 'Obstacle ahead',
  NO_ROUTE: 'No safe route',
  SAFETY: 'Safety interlock',
};

export function robotStatus(robot) {
  if (robot.waiting) return { label: 'HOLDING', tone: 'held' };
  return ROBOT_STATUS[robot.status] ?? { label: robot.status.toUpperCase(), tone: 'idle' };
}

export function priorityOf(priority) {
  return PRIORITY[priority] ?? PRIORITY[2];
}

export function formatJobStatus(job) {
  return JOB_STATUS[job.status] ?? { label: job.status.toUpperCase(), tone: 'queued' };
}

export function formatClock(value) {
  if (!value) return '--:--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatTick(tick) {
  return `T${String(tick ?? 0).padStart(4, '0')}`;
}

export function compactRoute(route = []) {
  const points = [];
  for (const step of route) {
    const previous = points[points.length - 1];
    if (!previous || previous.x !== step.x || previous.y !== step.y) {
      points.push({ x: step.x, y: step.y });
    }
  }
  return points;
}

export function routeTicks(route = []) {
  if (!route.length) return 0;
  return route[route.length - 1].t ?? Math.max(0, route.length - 1);
}

export function statusToneForEvent(type) {
  if (['delivery', 'pickup', 'dispatch', 'blocked'].includes(type)) {
    return type === 'blocked' ? 'danger' : 'success';
  }
  if (['wait', 'aging', 'safety'].includes(type)) return 'warning';
  if (type === 'control') return 'control';
  return 'info';
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
