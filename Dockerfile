FROM node:20.19-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g @nestjs/cli
RUN npx prisma generate

CMD ["npm", "run", "start"]
