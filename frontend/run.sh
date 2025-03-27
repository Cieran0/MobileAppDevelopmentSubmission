#!/bin/bash

echo "export const API_BASE = \"$API_URL\";" > app/services/config.ts
npx expo start --tunnel -c