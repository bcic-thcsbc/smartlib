FROM node:22-trixie-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p /app/data/uploads /app/data/backups && chown -R node:node /app
USER node
ENV NODE_ENV=production DATABASE_PATH=/app/data/smartlib.sqlite UPLOAD_DIR=/app/data/uploads BACKUP_DIR=/app/data/backups
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
