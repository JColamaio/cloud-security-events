#!/bin/sh
set -e

PUBSUB_HOST="http://pubsub-emulator:8085"
PROJECT_ID="local-project"

echo "Creating raw-events topic..."
curl -s -X PUT "${PUBSUB_HOST}/v1/projects/${PROJECT_ID}/topics/raw-events"

echo "Creating raw-events-sub subscription..."
curl -s -X PUT "${PUBSUB_HOST}/v1/projects/${PROJECT_ID}/subscriptions/raw-events-sub" \
  -H "Content-Type: application/json" \
  -d '{"topic":"projects/'"${PROJECT_ID}"'/topics/raw-events"}'

echo "Creating processed-events topic..."
curl -s -X PUT "${PUBSUB_HOST}/v1/projects/${PROJECT_ID}/topics/processed-events"

echo "Creating processed-events-sub subscription..."
curl -s -X PUT "${PUBSUB_HOST}/v1/projects/${PROJECT_ID}/subscriptions/processed-events-sub" \
  -H "Content-Type: application/json" \
  -d '{"topic":"projects/'"${PROJECT_ID}"'/topics/processed-events"}'

echo "Pub/Sub initialization complete!"
