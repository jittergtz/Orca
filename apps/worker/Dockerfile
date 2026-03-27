FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.json turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/config/package.json packages/config/package.json

RUN npm ci

COPY apps/worker apps/worker
COPY packages/ai packages/ai
COPY packages/db packages/db
COPY packages/config packages/config

RUN npm run build -w packages/config
RUN npm run build -w packages/db
RUN npm run build -w packages/ai
RUN npm run build -w apps/worker

CMD ["npm", "run", "start", "-w", "apps/worker"]
