FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./

RUN npm install --production

COPY . ./

WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
RUN npm run build

WORKDIR /app
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
