#!/usr/bin/env bash
# Starts api-stockline for local development (Development environment: migrates the database and
# seeds the demo users). Everything is overridable through environment variables.
set -euo pipefail

# Docker Engine, whatever context Docker Desktop (if installed) left selected.
export DOCKER_CONTEXT="${STOCKLINE_DOCKER_CONTEXT:-default}"

API_DIR="${STOCKLINE_API_DIR:-$(cd "$(dirname "$0")/../../api-stockline" && pwd)}"
PORT="${STOCKLINE_API_PORT:-5182}"
DB="${STOCKLINE_DB:-stockline}"
SQL_HOST="${STOCKLINE_SQL_HOST:-localhost,1433}"
SQL_CONTAINER="${STOCKLINE_SQL_CONTAINER:-scnexus-sqlserver}"

# Password of the local SQL Server: from the environment, or read from the Docker container running it.
SQL_PASSWORD="${STOCKLINE_SQL_PASSWORD:-$(docker exec "$SQL_CONTAINER" printenv MSSQL_SA_PASSWORD)}"

export ConnectionStrings__Default="Server=${SQL_HOST};Database=${DB};User Id=sa;Password=${SQL_PASSWORD};TrustServerCertificate=true"
export Jwt__Key="${STOCKLINE_JWT_KEY:-local-dev-signing-key-local-dev-signing-key-01}"
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS="http://localhost:${PORT}"
# Generous limit so repeated local logins and the e2e suite are not throttled (the API default is 10/min).
export RateLimiting__LoginPerMinute="${STOCKLINE_LOGIN_RATE_LIMIT:-1000}"

# Directory sign-in against the development Active Directory (api-stockline/dev/directory/up.sh).
if [ "${STOCKLINE_DIRECTORY:-}" = "1" ]; then
  export Directory__Enabled=true Directory__Host=localhost Directory__Port="${DIRECTORY_LDAPS_PORT:-1636}"
  export Directory__UseSsl=true Directory__ValidateCertificate=false # Samba's certificate is self-signed
  export Directory__BindDn="CN=svc-stockline,CN=Users,DC=stockline,DC=test"
  export Directory__BindPassword="${DIRECTORY_SERVICE_PASSWORD:-Svc-Bind-2026!}"
  export Directory__SearchBase="DC=stockline,DC=test"
  echo "directory sign-in: on (localhost:${Directory__Port})"
fi

echo "api-stockline → http://localhost:${PORT}  (database: ${DB})"
exec dotnet run --no-launch-profile --project "${API_DIR}/src/Stockline.Api"
