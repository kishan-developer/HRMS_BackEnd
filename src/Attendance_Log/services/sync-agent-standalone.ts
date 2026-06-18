#!/usr/bin/env node

/**
 * Standalone Sync Agent for Windows Service
 * Run with: node dist/Attendance_Log/services/sync-agent-standalone.js
 * 
 * To install as Windows Service:
 * npm install -g node-windows
 * Then use the install-service.js script
 */

import { SyncAgentService } from "./sync-agent.service";

const syncAgent = new SyncAgentService();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
  await syncAgent.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
  await syncAgent.stop();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  syncAgent.stop().then(() => process.exit(1));
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start the sync agent
syncAgent.start().catch((error) => {
  console.error("Failed to start sync agent:", error);
  process.exit(1);
});
