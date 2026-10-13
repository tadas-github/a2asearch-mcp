FROM node:26-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY index.js cli.js ./
COPY lib ./lib
USER node
CMD ["node", "index.js"]
