
#!/bin/sh
# Writes runtime config from the pod's env vars, then starts nginx.
cat > /usr/share/nginx/html/config.js <<JS
window.__ENV__ = { WP_API_URL: "${VITE_WP_API_URL}" };
JS
exec nginx -g 'daemon off;'
 