FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY server.js .

# Yandex Serverless Containers сам передаёт нужный порт через переменную PORT,
# но задаём дефолт на случай локального теста
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
