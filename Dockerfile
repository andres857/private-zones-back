# Stage 1: Base - Imagen base con Node y directorio de trabajo
# Usamos la versión completa de bullseye como base para tener herramientas disponibles
# si son necesarias durante la instalación de dependencias o el build.
FROM node:22.15.0 AS base
WORKDIR /usr/src/app
# Si 'yarn install' falla debido a módulos nativos que necesitan compilarse
# y las herramientas no están presentes, podrías necesitar:
# RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
#    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencias - Instala TODAS las dependencias necesarias
FROM base AS deps
COPY package.json yarn.lock ./
# --frozen-lockfile asegura que se usa yarn.lock
# --prefer-offline puede acelerar builds si las dependencias están cacheadas localmente por Yarn
RUN yarn install --frozen-lockfile --prefer-offline

# Stage 3: Builder - Copia el código fuente y construye la aplicación
FROM deps AS builder
COPY . .
RUN yarn build

# Stage 4: Production - Imagen final optimizada y más ligera
# Usamos la versión 'slim' de bullseye para producción para reducir el tamaño.
FROM node:22.15.0 AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copia los archivos de definición de dependencias necesarios para producción
# y para herramientas de escaneo de vulnerabilidades.
# El usuario 'node' (uid 1000) existe en las imágenes node:bullseye.
# Usamos --chown para que los archivos pertenezcan al usuario 'node'.
COPY --chown=node:node --from=deps /usr/src/app/package.json /usr/src/app/yarn.lock ./

# Copia el directorio 'dist' compilado desde el builder
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Opción A (Recomendada por velocidad y consistencia): Copiar node_modules de 'deps'
# Esto incluye devDependencies, pero asegura que se usan los mismos módulos que en el build.
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules

# Opción B (Alternativa para un node_modules más pequeño, pero build más lento):
# Reinstalar solo dependencias de producción.
# RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline
# Si se usa esta opción, el WORKDIR /usr/src/app y sus contenidos (node_modules)
# serían propiedad de root, así que se necesitaría un chown después, o correr yarn como 'node'.
# Por ejemplo: RUN chown -R node:node /usr/src/app

# Cambia al usuario no-root 'node'
USER node

EXPOSE 3000

# Comando por defecto para iniciar la aplicación compilada
CMD ["node", "dist/main.js"]

# --- Stage para Desarrollo ---
# Hereda de 'deps', que ya usó la imagen 'base' (node:22.15.0)
# y ya tiene todas las dependencias instaladas en /usr/src/app/node_modules.
FROM deps AS development

COPY . .

# CMD ["yarn", "start:dev"]

EXPOSE 3000
# El CMD/ENTRYPOINT para desarrollo se sobreescribirá en docker-compose.yml
# (e.g., command: yarn start:dev)