FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm run build:site

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3500
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/site ./site
COPY server ./server

EXPOSE 3500
CMD ["npm", "start"]
