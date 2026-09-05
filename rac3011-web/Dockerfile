FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium
COPY . .
ARG VITE_API_ORIGIN
ARG VITE_SENTRY_DSN
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_BUILD_SHA
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
