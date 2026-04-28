find '/usr/share/nginx/html' -name '*.js' \
    -exec sed -i 's,_EMAIL_AI_AGENT_URL_,'"$EMAIL_AI_AGENT_URL"',g' {} \;

nginx -g "daemon off;"