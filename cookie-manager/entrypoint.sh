#!/bin/bash
# Start cookie manager (Chromium CDP binds to 127.0.0.1:9222)
node index.js &
NODE_PID=$!

# Wait for Chromium CDP to be ready
echo "[entrypoint] Waiting for CDP on 127.0.0.1:9222..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
    echo "[entrypoint] CDP is ready"
    break
  fi
  sleep 1
done

# Forward 0.0.0.0:9223 → 127.0.0.1:9222 so Docker port mapping works
socat TCP-LISTEN:9223,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:9222 &
SOCAT_PID=$!

echo "[entrypoint] socat forwarding 0.0.0.0:9223 → 127.0.0.1:9222"

# Wait for node process
wait $NODE_PID
