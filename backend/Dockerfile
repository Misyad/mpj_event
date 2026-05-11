FROM node:20-alpine

WORKDIR /app

COPY backend/src ./src

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/server.mjs"]
