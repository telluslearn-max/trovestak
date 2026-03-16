FROM nginx:1.27-alpine

# Install envsubst (part of gettext, for env var substitution in nginx.conf)
RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/nginx.conf.template

# Runtime: substitute env vars into nginx.conf, then start nginx
CMD ["/bin/sh", "-c", \
    "envsubst '${STOREFRONT_HOST} ${STOREFRONT_PORT} ${ORDER_SERVICE_HOST} ${ORDER_SERVICE_PORT} ${CATALOG_SERVICE_HOST} ${CATALOG_SERVICE_PORT} ${AGENT_SERVICE_HOST} ${AGENT_SERVICE_PORT}' \
    < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
    nginx -g 'daemon off;'"]

EXPOSE 8080
