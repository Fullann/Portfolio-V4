FROM node:20-slim

# Installe les outils requis pour build better-sqlite3 et sharp
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Changer le propriétaire du répertoire de travail pour l'utilisateur non-root 'node'
RUN chown -R node:node /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Donner les droits sur les dossiers qui nécessitent une écriture
RUN chown -R node:node /usr/src/app/public/assets/images /usr/src/app/public/assets/documents

# Basculer vers l'utilisateur non-root
USER node

EXPOSE 3000
CMD ["node", "server.js"]
