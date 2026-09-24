// WS Relay для Yandex Serverless Containers
// Принимает WebSocket-соединение от клиента, открывает встречное WSS-соединение
// к origin-серверу (твой Xray inbound) и прозрачно переливает байты в обе стороны.

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

// ---- Настройки через переменные окружения (задаются в консоли Serverless Containers) ----
const ORIGIN_HOST = process.env.ORIGIN_HOST || 'qwexiup.fun'; // домен твоего origin (серв1)
const ORIGIN_PORT = process.env.ORIGIN_PORT || 443;           // порт origin (там, где HAProxy/Xray слушает)
const ORIGIN_PATH = process.env.ORIGIN_PATH || '/';           // WS-путь твоего Xray inbound
const ORIGIN_SNI  = process.env.ORIGIN_SNI  || ORIGIN_HOST;   // SNI для HAProxy-роутинга на origin
const LISTEN_PORT = process.env.PORT || 8080;                 // порт, который слушает контейнер (Yandex сам его пробрасывает)
const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS) || 25000; // keepalive, чтобы прокси не рвали простаивающие соединения

const ORIGIN_URL = `wss://${ORIGIN_HOST}:${ORIGIN_PORT}${ORIGIN_PATH}`;

const server = http.createServer((req, res) => {
  // обычные HTTP GET без Upgrade отвечают 200 — удобно для ручной проверки
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

// handleProtocols: отвечаем клиенту тем же Sec-WebSocket-Protocol, что он прислал.
// Xray передаёт в этом заголовке early data (?ed=2048 в пути), его надо вернуть как есть.
const wss = new WebSocketServer({
  noServer: true,
  handleProtocols: (protocols) => (protocols.size ? protocols.values().next().value : false),
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (clientWs) => {
    handleConnection(clientWs, req);
  });
});

function handleConnection(clientWs, req) {
  console.log(`[relay] новое клиентское WS-соединение: ${req.url}`);

  // Пробрасываем Sec-WebSocket-Protocol (early data Xray) на origin
  const protocolHeader = req.headers['sec-websocket-protocol'];
  const protocols = protocolHeader
    ? protocolHeader.split(',').map((p) => p.trim()).filter(Boolean)
    : undefined;

  // Открываем встречное соединение к origin по TLS, с нужным SNI и заголовками
  const originWs = new WebSocket(ORIGIN_URL, protocols, {
    headers: {
      Host: ORIGIN_HOST, // Host-заголовок для origin (важно для HAProxy/Xray роутинга)
    },
    servername: ORIGIN_SNI, // TLS SNI — критично для правильной маршрутизации на origin
    rejectUnauthorized: true,
    perMessageDeflate: false, // трафик и так зашифрован, сжатие только тратит CPU
  });

  const queueToOrigin = [];
  let closed = false;

  // Закрывает обе стороны один раз. terminate() работает и для соединения,
  // которое ещё в состоянии CONNECTING (close() в этом случае не отработал бы).
  function shutdown(reason) {
    if (closed) return;
    closed = true;
    clearInterval(pingTimer);
    queueToOrigin.length = 0;
    console.log(`[relay] закрываю пару соединений: ${reason}`);
    for (const ws of [clientWs, originWs]) {
      if (ws.readyState === WebSocket.OPEN) ws.close();
      else if (ws.readyState === WebSocket.CONNECTING) ws.terminate();
    }
  }

  // Keepalive в сторону клиента: если pong не пришёл за интервал — соединение мёртвое
  let clientAlive = true;
  clientWs.on('pong', () => { clientAlive = true; });
  const pingTimer = setInterval(() => {
    if (!clientAlive) {
      clientWs.terminate();
      return shutdown('клиент не отвечает на ping');
    }
    clientAlive = false;
    if (clientWs.readyState === WebSocket.OPEN) clientWs.ping();
  }, PING_INTERVAL_MS);

  originWs.on('open', () => {
    console.log('[relay] соединение с origin установлено');
    // Отправляем всё, что накопилось от клиента, пока origin коннектился
    for (const [data, isBinary] of queueToOrigin) originWs.send(data, { binary: isBinary });
    queueToOrigin.length = 0;
  });

  // Клиент -> Origin
  clientWs.on('message', (data, isBinary) => {
    if (originWs.readyState === WebSocket.OPEN) {
      originWs.send(data, { binary: isBinary });
    } else if (originWs.readyState === WebSocket.CONNECTING) {
      queueToOrigin.push([data, isBinary]);
    }
  });

  // Origin -> Клиент
  originWs.on('message', (data, isBinary) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary });
    }
  });

  clientWs.on('close', () => shutdown('клиент отключился'));
  originWs.on('close', () => shutdown('origin отключился'));

  // Ответ origin с кодом != 101 (например 404 — неверный ORIGIN_PATH, или HAProxy отправил не туда)
  originWs.on('unexpected-response', (_req, res) => {
    console.error(`[relay] origin ответил HTTP ${res.statusCode} вместо 101 — проверь ORIGIN_PATH/SNI`);
    shutdown(`origin HTTP ${res.statusCode}`);
  });

  clientWs.on('error', (err) => {
    console.error('[relay] ошибка клиентского сокета:', err.message);
    shutdown('ошибка клиента');
  });

  originWs.on('error', (err) => {
    console.error('[relay] ошибка соединения с origin:', err.message);
    shutdown('ошибка origin');
  });
}

server.listen(LISTEN_PORT, () => {
  console.log(`[relay] слушаю порт ${LISTEN_PORT}, origin: ${ORIGIN_URL} (SNI: ${ORIGIN_SNI})`);
});
