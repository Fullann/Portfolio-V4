FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install && npm audit fix

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
