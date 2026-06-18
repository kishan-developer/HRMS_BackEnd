/**
 * Windows Service Uninstaller for Attendance Sync Agent
 * Run with: node scripts/uninstall-windows-service.js
 */

const Service = require("node-windows").Service;
const path = require("path");

// Create a new service object
const svc = new Service({
  name: "Attendance Sync Agent",
  script: path.join(__dirname, "../../dist/Attendance_Log/services/sync-agent-standalone.js")
});

// Listen for the "uninstall" event
svc.on("uninstall", function() {
  console.log("Attendance Sync Agent service uninstalled successfully");
});

// Uninstall the service
svc.uninstall();
