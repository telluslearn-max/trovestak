FROM nginx:1.27-alpine

# Install envsubst (gettext) and Node.js for the JWT auth sidecar
RUN apk add --no-cache gettext nodejs

COPY nginx.conf /etc/nginx/nginx.conf.template
COPY auth.js /auth.js

# Runtime:
#   1. Substitute env vars into nginx.conf
#   2. Start the Node.js JWT auth sidecar in background
#   3. Start nginx in foreground
CMD ["/bin/sh", "-c", \
    "envsubst '${STOREFRONT_HOST} ${STOREFRONT_PORT} ${ORDER_SERVICE_HOST} ${ORDER_SERVICE_PORT} ${CATALOG_SERVICE_HOST} ${CATALOG_SERVICE_PORT} ${AGENT_SERVICE_HOST} ${AGENT_SERVICE_PORT}' \
    < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
    node /auth.js & \
    nginx -g 'daemon off;'"]

EXPOSE 8080
