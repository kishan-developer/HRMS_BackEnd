// Socket.IO configuration for real-time attendance updates
// This will be initialized when socket.io is available in the main server

let socketInstance: any = null;

export const initializeSocket = (io: any) => {
  socketInstance = io;
  console.log("Attendance socket initialized");
};

export const getAttendanceSocket = (): any => {
  return socketInstance;
};
