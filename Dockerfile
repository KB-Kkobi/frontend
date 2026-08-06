# 1단계: Node 22 환경에서 Vue 애플리케이션 빌드
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Git Hook 설정용 prepare 스크립트는 Docker 빌드에서 제외
RUN npm pkg delete scripts.prepare && npm ci

COPY . .

RUN npm run build


# 2단계: Nginx에서 빌드 결과물 제공
FROM nginx:alpine

# 기본 Nginx 설정 제거
RUN rm /etc/nginx/conf.d/default.conf

# 서비스용 Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vue 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]