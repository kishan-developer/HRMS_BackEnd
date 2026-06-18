/**
 * Windows Service Installer for Attendance Sync Agent
 * Run with: node scripts/install-windows-service.js
 * 
 * Requirements:
 * npm install -g node-windows
 */

const Service = require("node-windows").Service;
const path = require("path");

// Create a new service object
const svc = new Service({
  name: "Attendance Sync Agent",
  description: "HRMS Biometric Attendance Sync Agent - Syncs attendance from ZKTeco devices to API",
  script: path.join(__dirname, "../../dist/Attendance_Log/services/sync-agent-standalone.js"),
  nodeOptions: [
    "--harmony",
    "--max_old_space_size=4096"
  ],
  // Service working directory
  workingDirectory: path.join(__dirname, "../.."),
  // Allow service to interact with desktop
  allowServiceLogon: true
});

// Listen for the "install" event
svc.on("install", function() {
  console.log("Attendance Sync Agent service installed successfully");
  svc.start();
});

// Listen for the "start" event
svc.on("start", function() {
  console.log("Attendance Sync Agent service started successfully");
});

// Listen for errors
svc.on("error", function(err) {
  console.error("Service error:", err);
});

// Install the service
svc.install();

// To uninstall:
// svc.uninstall();
