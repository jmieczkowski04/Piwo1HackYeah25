FROM node:20-alpine AS builder


ENV COREPACK_ENABLE_DOWNLOADPROMPT=0
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .


ARG VITE_API_URL=http://gateaway/api
RUN VITE_API_URL=$VITE_API_URL pnpm build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


