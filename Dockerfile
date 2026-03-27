FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

FROM base AS app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "5173"]

FROM base AS preview
COPY --from=build /app ./
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--hostname", "0.0.0.0", "--port", "4173"]
