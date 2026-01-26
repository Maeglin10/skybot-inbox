#!/usr/bin/env bash
set -uo pipefail

echo "# ports"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true

echo "# debug counts via proxy"
curl -sS "http://localhost:3000/api/proxy/debug/counts" | node -p 'JSON.stringify(JSON.parse(fs.readFileSync(0,"utf8")), null, 2)' || true

echo "# conversations"
curl -sS "http://localhost:3000/api/proxy/conversations?limit=1" > /tmp/conv.json
CID=$(cat /tmp/conv.json | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).items[0].id))')
echo "CID=$CID"

echo "# details"
curl -sS "http://localhost:3000/api/proxy/conversations/$CID" | head -c 300; echo

echo "# patch status"
curl -sS -X PATCH "http://localhost:3000/api/proxy/conversations/$CID/status" \
  -H "content-type: application/json" \
  -d '{"status":"OPEN"}' | head -c 200; echo

echo "# post message"
curl -sS -X POST "http://localhost:3000/api/proxy/messages" \
  -H "content-type: application/json" \
  -d "{\"conversationId\":\"$CID\",\"to\":\"573001112233\",\"text\":\"smoke ping\"}" | head -c 200; echo

echo "# done"
exit 0