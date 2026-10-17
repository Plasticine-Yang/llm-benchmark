import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchState } from './api';

function wsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

/**
 * One-way control-loop client.
 *
 * The hook never predicts robot positions. It applies complete authoritative
 * state messages, gates every non-snapshot update by a strictly increasing
 * seq, and accepts a fresh snapshot on every reconnect. This makes stale
 * state after reconnect impossible: the snapshot is installed wholesale and
 * any older update is then ignored.
 */
export function useSimulation() {
  const [state, setState] = useState(null);
  const [connection, setConnection] = useState('connecting');
  const [socketEpoch, setSocketEpoch] = useState(0);
  const [syncNotice, setSyncNotice] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);

  const stateRef = useRef(null);
  const lastSeqRef = useRef(-1);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const hadConnectionRef = useRef(false);
  const actionRef = useRef(0);
  const noticeTimerRef = useRef(null);

  const acceptSnapshot = useCallback((incoming, reason = 'snapshot') => {
    if (!incoming || typeof incoming.seq !== 'number') return false;
    lastSeqRef.current = incoming.seq;
    stateRef.current = incoming;
    setState(incoming);
    if (reason === 'reconnect') {
      setSyncNotice(`Resynchronised · snapshot at seq ${incoming.seq}`);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => setSyncNotice(null), 3800);
    }
    return true;
  }, []);

  const acceptUpdate = useCallback((incoming) => {
    if (!incoming || typeof incoming.seq !== 'number') return false;
    if (incoming.seq <= lastSeqRef.current) return false;
    lastSeqRef.current = incoming.seq;
    stateRef.current = incoming;
    setState(incoming);
    return true;
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (socketRef.current && socketRef.current.readyState <= 1) return;
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setConnection(attemptsRef.current === 0 && !hadConnectionRef.current ? 'connecting' : 'reconnecting');
    let socket;
    try {
      socket = new WebSocket(wsUrl());
    } catch (caught) {
      setError(caught.message);
      setConnection('offline');
      reconnectTimerRef.current = window.setTimeout(connect, 2500);
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current || socketRef.current !== socket) return;
      attemptsRef.current = 0;
      setConnection('live');
      setSocketEpoch((value) => value + 1);
    };

    socket.onmessage = (event) => {
      if (!mountedRef.current || socketRef.current !== socket) return;
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === 'snapshot') {
        const reconnect = hadConnectionRef.current;
        hadConnectionRef.current = true;
        acceptSnapshot(message.state, reconnect ? 'reconnect' : 'initial');
      } else if (message.type === 'update') {
        acceptUpdate(message.state);
      }
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      if (socketRef.current === socket) socketRef.current = null;
      setConnection('reconnecting');
      attemptsRef.current += 1;
      const delay = Math.min(5000, 450 * 2 ** Math.min(attemptsRef.current - 1, 4));
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {
        // no-op
      }
    };
  }, [acceptSnapshot, acceptUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    // HTTP fallback for the first paint in case the WS handshake is blocked.
    // It is sequence-gated like every other non-snapshot message.
    fetchState()
      .then((payload) => {
        if (cancelled) return;
        if (!stateRef.current) acceptSnapshot(payload.state, 'initial');
        else acceptUpdate(payload.state);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught.message);
      });

    connect();

    const onOnline = () => {
      if (!socketRef.current) connect();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!socketRef.current || socketRef.current.readyState > 1)) {
        attemptsRef.current = 0;
        connect();
      }
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onmessage = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [acceptSnapshot, acceptUpdate, connect]);

  const run = useCallback(
    async (key, operation) => {
      const token = ++actionRef.current;
      setPending(key);
      setError(null);
      try {
        const payload = await operation();
        if (!mountedRef.current) return payload;
        if (payload?.state) {
          if (!stateRef.current) acceptSnapshot(payload.state, 'initial');
          else acceptUpdate(payload.state);
        }
        return payload;
      } catch (caught) {
        if (mountedRef.current) setError(caught.message || 'Request failed.');
        throw caught;
      } finally {
        if (mountedRef.current && token === actionRef.current) setPending(null);
      }
    },
    [acceptSnapshot, acceptUpdate],
  );

  useEffect(() => {
    if (!socketEpoch) return;
    // A fresh socket epoch is useful telemetry for the UI; no state mutation.
  }, [socketEpoch]);

  const clearError = useCallback(() => setError(null), []);
  const clearSyncNotice = useCallback(() => setSyncNotice(null), []);

  return {
    state,
    connection,
    syncNotice,
    syncEpoch: socketEpoch,
    error,
    pending,
    run,
    clearError,
    clearSyncNotice,
  };
}
