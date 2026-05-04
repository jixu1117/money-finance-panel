FROM node:24-alpine

WORKDIR /app
COPY package.json server.mjs ./
COPY public ./public
COPY tests ./tests

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["npm", "start"]
