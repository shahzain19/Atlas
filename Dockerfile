FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

FROM base AS deps
COPY package.json package-lock.json ./
COPY atlas-cli/package.json atlas-cli/
COPY atlas-simulation/package.json atlas-simulation/
COPY atlas-studio/package.json atlas-studio/
COPY atlas-supabase/package.json atlas-supabase/
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY atlas-kernel/ atlas-kernel/
COPY atlas-runtime/ atlas-runtime/
COPY atlas-ai/ atlas-ai/
COPY atlas-agents/ atlas-agents/
COPY atlas-hardware/ atlas-hardware/
COPY atlas-network/ atlas-network/
COPY atlas-fleet/ atlas-fleet/
COPY atlas-security/ atlas-security/
COPY atlas-memory/ atlas-memory/
COPY atlas-navigation/ atlas-navigation/
COPY atlas-perception/ atlas-perception/
COPY atlas-examples/ atlas-examples/
COPY atlas-sdk/ atlas-sdk/
COPY atlas-cli/ atlas-cli/
COPY atlas-simulation/ atlas-simulation/
COPY atlas-studio/ atlas-studio/
COPY atlas-supabase/ atlas-supabase/
COPY atlas-tests/ atlas-tests/
COPY main.ts ./
RUN npm test

FROM base AS runtime
RUN npm ci --production
COPY --from=build /app/dist ./dist
COPY --from=build /app/atlas-kernel ./atlas-kernel
COPY --from=build /app/atlas-runtime ./atlas-runtime
COPY --from=build /app/atlas-ai ./atlas-ai
COPY --from=build /app/atlas-agents ./atlas-agents
COPY --from=build /app/atlas-hardware ./atlas-hardware
COPY --from=build /app/atlas-network ./atlas-network
COPY --from=build /app/atlas-fleet ./atlas-fleet
COPY --from=build /app/atlas-security ./atlas-security
COPY --from=build /app/atlas-memory ./atlas-memory
COPY --from=build /app/atlas-navigation ./atlas-navigation
COPY --from=build /app/atlas-perception ./atlas-perception
COPY --from=build /app/atlas-examples ./atlas-examples
COPY --from=build /app/atlas-cli ./atlas-cli
COPY --from=build /app/main.ts ./
COPY --from=build /app/tsconfig.json ./
CMD ["npx", "ts-node", "main.ts"]
