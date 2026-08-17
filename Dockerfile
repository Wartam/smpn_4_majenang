FROM oven/bun:1-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN bun install --production

COPY src ./src
COPY public ./public
RUN mkdir -p /app/data

EXPOSE 3000
VOLUME ["/app/data"]
CMD ["bun", "run", "start"]
