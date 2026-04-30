FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

FROM nginx:1.21.0-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/email-agent-web-app/browser /usr/share/nginx/html

COPY ./scripts/replace_api_url.sh /

EXPOSE 80

CMD ["sh", "replace_api_url.sh"]
