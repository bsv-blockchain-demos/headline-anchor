# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Auth for the private @bsv-blockchain-demos scope comes from a BuildKit secret
# (never a layer). The .npmrc is written and removed inside one RUN so the token
# is never persisted in the image.
RUN --mount=type=secret,id=github_token \
    printf '@bsv-blockchain-demos:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/github_token)" > .npmrc \
 && npm ci \
 && rm -f .npmrc
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
# float-balance-route is a production dependency, so this install needs auth too.
RUN --mount=type=secret,id=github_token \
    printf '@bsv-blockchain-demos:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/github_token)" > .npmrc \
 && npm ci --omit=dev \
 && rm -f .npmrc
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/sources.config.json ./
EXPOSE 3000
CMD ["node", "dist-server/index.js"]
