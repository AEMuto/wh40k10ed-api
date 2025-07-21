# ---- Base Stage ----
FROM node:22-alpine AS base
WORKDIR /usr/src/app
ARG USER_ID=1000
ARG GROUP_ID=1000

# ---- User Setup Stage ----
FROM base AS user_setup
# Re-declare ARGs as they are not inherited automatically across stages
ARG USER_ID
ARG GROUP_ID
# Modify the existing 'node' user and group to match the host.
# This is cleaner than creating a new user.
# It handles cases where the default GID (1000) might already exist.
RUN if [ "$GROUP_ID" != "1000" ]; then \
        # Use delgroup/addgroup to handle existing GID
        delgroup node && \
        addgroup -g $GROUP_ID -S node; \
    fi && \
    if [ "$USER_ID" != "1000" ]; then \
        # Use deluser/adduser to handle existing UID
        deluser node && \
        adduser -u $USER_ID -S node -G node; \
    fi


# ---- Dependencies Stage ----
FROM user_setup AS deps
# Copy user from the setup stage
COPY --from=user_setup /etc/passwd /etc/passwd
COPY --from=user_setup /etc/group /etc/group

RUN apk add --no-cache --virtual .build-deps build-base python3
# Copy package files first to leverage Docker cache
COPY app/package.json app/package-lock.json* ./
# Install dependencies. --unsafe-perm is needed when running npm install as root.
RUN npm install --frozen-lockfile --unsafe-perm
# Clean up the build dependencies now that npm install is done.
RUN apk del .build-deps
# Grant ownership of the app directory (including node_modules) to the node user
RUN chown -R node:node /usr/src/app
USER node

# ---- Build Stage ----
FROM user_setup AS build
USER root
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY app/ .
# Ensure all files are owned by the 'node' user before building
RUN chown -R node:node .
USER node
RUN npm run build

# ---- Production Stage ----
FROM base AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy user from the setup stage
COPY --from=user_setup /etc/passwd /etc/passwd
COPY --from=user_setup /etc/group /etc/group

# Install cron and set up permissions
RUN apk add --no-cache cron && \
    # Create a crontab file for the 'node' user
    mkdir -p /var/spool/cron/crontabs && \
    chown -R node:node /var/spool/cron/crontabs

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY app/package.json .

# Copy the crontab and entrypoint, ensuring correct ownership
COPY --chown=node:node crontab /var/spool/cron/crontabs/node
COPY --chown=node:node entrypoint.sh .
RUN chmod +x ./entrypoint.sh

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Set the user for the final image
USER node

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "start"]
