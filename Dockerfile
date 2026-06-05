FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860

CMD ["node", "dist/server.cjs"]
