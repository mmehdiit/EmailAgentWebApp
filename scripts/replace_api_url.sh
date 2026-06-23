find '/usr/share/nginx/html' -name '*.js' -exec sed -i \
    -e 's,_EMAIL_AI_AGENT_URL_,'"$EMAIL_AI_AGENT_URL"',g' \
    -e 's,_MICROSOFT_CLIENT_ID_,'"$MICROSOFT_CLIENT_ID"',g' \
    -e 's,_MICROSOFT_TENANT_ID_,'"$MICROSOFT_TENANT_ID"',g' {} \;

nginx -g "daemon off;"