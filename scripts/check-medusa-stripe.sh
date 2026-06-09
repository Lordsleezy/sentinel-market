#!/usr/bin/env bash
sshpass -p maddy123 ssh -o StrictHostKeyChecking=no sentinel@192.168.0.117 \
  'grep -i stripe /opt/sentinel/medusa/apps/backend/package.json; head -80 /opt/sentinel/medusa/apps/backend/medusa-config.ts 2>/dev/null'
