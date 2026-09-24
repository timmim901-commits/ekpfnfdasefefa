# Деплой WS-relay в Yandex Serverless Containers

## 0. Что это делает

Клиент (Shadowrocket/Happ) → WS-соединение → этот relay (на инфраструктуре Yandex Cloud) →
встречное WSS-соединение → твой origin-сервер (qwexiup.fun, HAProxy → Xray).

Домен relay будет вида `<id>.containers.yandexcloud.net` — это официальный домен
Yandex Cloud, который должен быть в белом списке провайдеров.

## 1. Установи инструменты

```bash
# yc CLI — консоль Yandex Cloud
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
yc init   # авторизация, выбор облака/каталога

# Docker (если ещё нет)
sudo apt install -y docker.io
```

## 2. Создай реестр контейнеров (один раз)

```bash
yc container registry create --name my-relay-registry
# запомни ID реестра из вывода, например crXXXXXXXXXXXXXXXXX

yc container registry configure-docker
```

## 3. Собери и запушь образ

Из папки с server.js, package.json, Dockerfile:

```bash
docker build -t cr.yandex/<ID_РЕЕСТРА>/ws-relay:v1 .
docker push cr.yandex/<ID_РЕЕСТРА>/ws-relay:v1
```

## 4. Создай Serverless Container

```bash
yc serverless container create --name ws-relay
```

## 5. Задеплой ревизию с нужными настройками

Это ключевой шаг — таймаут больше 10 минут делает контейнер "долгоживущим":

```bash
yc serverless container revision deploy \
  --container-name ws-relay \
  --image cr.yandex/<ID_РЕЕСТРА>/ws-relay:v1 \
  --cores 1 \
  --memory 256MB \
  --concurrency 16 \
  --execution-timeout 55m \
  --environment ORIGIN_HOST=qwexiup.fun,ORIGIN_PORT=443,ORIGIN_PATH=/твой_ws_путь,ORIGIN_SNI=qwexiup.fun \
  --service-account-id <ID_СЕРВИСНОГО_АККАУНТА>
```

Про `--concurrency 16` — сколько одновременных запросов (клиентских соединений)
один экземпляр контейнера обслуживает параллельно. Для личного использования
хватит 8-16.

## 6. Разреши публичный вызов (иначе Yandex потребует авторизацию на каждый запрос)

```bash
yc serverless container allow-unauthenticated-invoke --name ws-relay
```

## 7. Узнай публичный URL контейнера

```bash
yc serverless container get --name ws-relay
```
В выводе будет что-то вроде:
`https://bba********************.containers.yandexcloud.net`

## 8. Настрой конфиг клиента

В Shadowrocket/Happ меняешь адрес сервера на этот домен (без `https://`, порт 443),
путь — тот же `/твой_ws_путь`, что указан в ORIGIN_PATH. UUID/пароль/шифрование
остаются от твоего оригинального inbound — relay их не трогает, просто переливает байты.

## 9. Проверка

```bash
curl -v --http1.1 \
  -H "Upgrade: websocket" -H "Connection: Upgrade" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://<твой-container-id>.containers.yandexcloud.net/твой_ws_путь
```
Ждём `101 Switching Protocols`.

## Важные нюансы

- **HAProxy на origin (серв1) должен видеть правильный SNI** — relay посылает
  `ORIGIN_SNI=qwexiup.fun`, это должно совпадать с тем, что HAProxy ожидает для
  маршрутизации на Xray (не на Caddy).
- **Таймаут контейнера (55m)** — это максимум на один вызов. Для VPN-сессии
  дольше часа клиент должен будет переподключиться — WS-клиенты в Xray обычно
  переподключаются автоматически при разрыве, так что это не критично, но
  ощутимо на длинных загрузках.
- **Concurrency** — если один инстанс контейнера упрётся в лимит одновременных
  соединений, Yandex поднимет второй инстанс автоматически (масштабирование
  включено по умолчанию у Serverless Containers).
- **Логи** смотри через `yc logging read` или в консоли — там будут все
  console.log из server.js, полезно для отладки, если что-то не коннектится.
- **Early data (`?ed=2048` в пути клиента)** — relay пробрасывает заголовок
  `Sec-WebSocket-Protocol` на origin, так что early data Xray работает.
- **Keepalive** — relay пингует клиента каждые `PING_INTERVAL_MS` (по умолчанию
  25000 мс) и закрывает соединения, которые не отвечают.
- **Если в логах `origin ответил HTTP 4xx вместо 101`** — неверный `ORIGIN_PATH`
  или HAProxy по SNI отправил соединение не в Xray.
- **Сначала выполни проверку из п. 9.** Если прокси Yandex не пропускает WebSocket
  Upgrade к контейнеру, вместо `101` придёт другой ответ, и дальше настраивать
  клиента нет смысла.
