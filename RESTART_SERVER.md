# Restart Backend Server

## Quick Restart

### If server is running in terminal:
1. Press `Ctrl+C` to stop the server
2. Run again:
   ```bash
   cd Backend
   npm start
   ```

### If server is running in background:
```bash
# Find the process
ps aux | grep "node server.js"

# Kill it (replace PID with actual process ID)
kill <PID>

# Or kill all node processes (be careful!)
pkill -f "node server.js"

# Then restart
cd Backend
npm start
```

## Verify It's Working

After restart, test the endpoints:

```bash
# Test GET endpoint (should work now)
curl http://localhost:4000/api/analytics/event

# Test POST endpoint
curl -X POST http://localhost:4000/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{}}'
```

Both should return JSON responses now.

