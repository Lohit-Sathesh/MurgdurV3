#!/usr/bin/env bash
# Applies the WAF custom rules and cache (page) rules in this directory to a
# Cloudflare zone via the API. Requires:
#   CF_API_TOKEN  - API token with Zone:Edit permissions for the target zone
#   CF_ZONE_ID    - the zone ID for murgdur.example (Cloudflare dashboard > Overview, right sidebar)
#
# Usage: CF_API_TOKEN=... CF_ZONE_ID=... ./apply.sh
set -euo pipefail

: "${CF_API_TOKEN:?Set CF_API_TOKEN}"
: "${CF_ZONE_ID:?Set CF_ZONE_ID}"

API="https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID"
AUTH=(-H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json")

echo "==> Ensuring a custom ruleset exists for the http_request_firewall_custom phase"
RULESET_ID=$(curl -s "${AUTH[@]}" "$API/rulesets/phases/http_request_firewall_custom/entrypoint" \
  | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).result.id)}catch{console.log('')}})")

WAF_RULES=$(node -e "
const rules = require('./waf-rules.json').rules;
console.log(JSON.stringify(rules.map(r => ({
  description: r.description,
  expression: r.expression,
  action: r.action === 'block' ? 'block'
        : r.action === 'managed_challenge' ? 'managed_challenge'
        : r.action === 'challenge' ? 'challenge'
        : 'log',
  enabled: true,
}))));
")

if [ -n "$RULESET_ID" ]; then
  echo "==> Updating existing ruleset $RULESET_ID"
  curl -s "${AUTH[@]}" -X PUT "$API/rulesets/$RULESET_ID" \
    -d "{\"rules\": $WAF_RULES}" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).success))"
else
  echo "==> Creating new custom firewall ruleset"
  curl -s "${AUTH[@]}" -X POST "$API/rulesets" \
    -d "{\"name\":\"murgdur-custom\",\"kind\":\"zone\",\"phase\":\"http_request_firewall_custom\",\"rules\": $WAF_RULES}" \
    | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).success))"
fi

echo "==> Creating page (cache) rules"
node -e "
const rules = require('./page-rules.json').rules;
for (const r of rules) {
  const targets = [{ target: 'url', constraint: { operator: 'matches', value: r.target } }];
  const actions = [];
  if (r.cacheLevel) actions.push({ id: 'cache_level', value: r.cacheLevel });
  if (r.edgeCacheTtl) actions.push({ id: 'edge_cache_ttl', value: r.edgeCacheTtl });
  if (r.forwardingUrl) actions.push({ id: 'forwarding_url', value: r.forwardingUrl });
  console.log(JSON.stringify({ targets, actions, status: 'active' }));
}
" | while read -r rule; do
  curl -s "${AUTH[@]}" -X POST "$API/pagerules" -d "$rule" \
    | node -e "process.stdin.on('data',d=>{const j=JSON.parse(d); console.log(j.success ? 'created' : JSON.stringify(j.errors))})"
done

echo "==> Done"
