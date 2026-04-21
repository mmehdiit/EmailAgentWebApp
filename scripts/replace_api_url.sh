find '/usr/share/nginx/html' -name '*.js' -exec sed -i \
    -e 's,_EMAIL_AI_AGENT_URL_,'"$EMAIL_AI_AGENT_URL"',g' {} \

# Start NGINX
nginx -g "daemon off;"