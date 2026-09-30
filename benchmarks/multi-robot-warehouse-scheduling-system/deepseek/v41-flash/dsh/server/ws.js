// Minimal RFC6455 WebSocket server + Server-Sent-Events fallback.
// Implemented with node built-ins only so the project has zero dependencies.

import crypto from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function isWebSocketUpgrade(req) {
  return (
    (req.headers.upgrade ?? '').toLowerCase() === 'websocket' &&
    (req.headers.connection ?? '').toLowerCase().includes('upgrade') &&
    typeof req.headers['sec-websocket-key'] === 'string'
  );
}

function encodeFrame(payload, opcode = 0x1) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, data]);
}

class WsSocket {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.closed = false;
    this.handlers = { message: [], close: [] };
    this.fragments = [];
    this.fragmentOpcode = 0;
    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('close', () => this.finish());
    socket.on('error', () => this.finish());
  }

  on(event, handler) {
    this.handlers[event]?.push(handler);
    return this;
  }

  onData(chunk) {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
    for (;;) {
      if (this.buffer.length < 2) return;
      const b0 = this.buffer[0];
      const b1 = this.buffer[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let offset = 2;
      if (len === 126) {
        if (this.buffer.length < 4) return;
        len = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (len === 127) {
        if (this.buffer.length < 10) return;
        const big = this.buffer.readBigUInt64BE(2);
        if (big > BigInt(8 * 1024 * 1024)) {
          this.close(1009, 'message too large');
          return;
        }
        len = Number(big);
        offset = 10;
      }
      let maskKey = null;
      if (masked) {
        if (this.buffer.length < offset + 4) return;
        maskKey = this.buffer.subarray(offset, offset + 4);
        offset += 4;
      }
      if (this.buffer.length < offset + len) return;
      let payload = Buffer.from(this.buffer.subarray(offset, offset + len));
      this.buffer = this.buffer.subarray(offset + len);
      if (maskKey) for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i & 3];

      if (opcode === 0x8) {
        this.close(1000, 'client closed');
        return;
      }
      if (opcode === 0x9) {
        this.sendRaw(encodeFrame(payload, 0xa));
        continue;
      }
      if (opcode === 0xa) continue;
      if (opcode === 0x0) {
        this.fragments.push(payload);
        if (fin) {
          const full = Buffer.concat(this.fragments);
          this.fragments = [];
          if (this.fragmentOpcode === 0x1) this.emitMessage(full.toString('utf8'));
        }
        continue;
      }
      if (opcode === 0x1) {
        if (fin) {
          this.emitMessage(payload.toString('utf8'));
        } else {
          this.fragmentOpcode = opcode;
          this.fragments = [payload];
        }
        continue;
      }
      // binary frames are ignored (protocol is JSON text)
    }
  }

  emitMessage(text) {
    for (const handler of this.handlers.message) {
      try {
        handler(text);
      } catch (err) {
        console.error('[ws] message handler failed:', err.message);
      }
    }
  }

  sendRaw(buf) {
    if (this.closed) return false;
    try {
      return this.socket.write(buf);
    } catch {
      this.finish();
      return false;
    }
  }

  send(text) {
    return this.sendRaw(encodeFrame(text, 0x1));
  }

  close(code = 1000, reason = '') {
    if (this.closed) return;
    const reasonBuf = Buffer.from(reason, 'utf8');
    const payload = Buffer.alloc(2 + reasonBuf.length);
    payload.writeUInt16BE(code, 0);
    reasonBuf.copy(payload, 2);
    this.sendRaw(encodeFrame(payload, 0x8));
    try {
      this.socket.end();
    } catch {
      /* ignore */
    }
    this.finish();
  }

  finish() {
    if (this.closed) return;
    this.closed = true;
    for (const handler of this.handlers.close) {
      try {
        handler();
      } catch {
        /* ignore */
      }
    }
    try {
      this.socket.destroy();
    } catch {
      /* ignore */
    }
  }
}

export function attachWebSocket(server, { path = '/ws', onConnection }) {
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname !== path || !isWebSocketUpgrade(req)) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    const key = req.headers['sec-websocket-key'];
    const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '\r\n',
      ].join('\r\n'),
    );
    if (head && head.length > 0) socket.unshift(head);
    socket.setNoDelay(true);
    const ws = new WsSocket(socket);
    onConnection(ws, req, url);
  });
}

/** Server-Sent-Events fallback so the UI still streams if WebSockets are blocked. */
export function attachSse(req, res, { path = '/api/stream', onConnection }) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname !== path) return false;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  const client = {
    kind: 'sse',
    send(text) {
      try {
        res.write(`data: ${text}\n\n`);
        return true;
      } catch {
        return false;
      }
    },
    close() {
      try {
        res.end();
      } catch {
        /* ignore */
      }
    },
  };
  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* ignore */
    }
  }, 15000);
  // NOTE: Date.now() only feeds log metadata, never simulation decisions.
  if (typeof ping.unref === 'function') ping.unref();
  onConnection(client, req, url);
  req.on('close', () => {
    clearInterval(ping);
    client.closed = true;
  });
  return true;
}
