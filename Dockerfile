# Entorno de demostración local. No desplegar esta imagen en Internet.
FROM node:24-bookworm-slim
WORKDIR /app
RUN mkdir -p /app/.wrangler/state /app/.sites-runtime && chown -R node:node /app
COPY --chown=node:node package.json package-lock.json .npmrc ./
COPY --chown=node:node scripts ./scripts
USER node
RUN npm run install:ci
COPY --chown=node:node . .
ENV CLOUDFLARE_CF_FETCH_ENABLED=false \
    WRANGLER_SEND_METRICS=false \
    WRANGLER_WRITE_LOGS=false
RUN npm run build
EXPOSE 3000
CMD ["node", "docker/start.mjs"]
