const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

let drivers = {}; // Stores driver locations

// REST API to get all active drivers
app.get("/dashboard/drivers/all", (req, res) => {
    res.json(Object.values(drivers));
});

// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("A driver connected:", socket.id);

    socket.on("sendLocation", (data) => {
        console.log(`Received location from ${data.userId}:`, data);
        drivers[data.userId] = { userId: data.userId, lat: data.lat, lng: data.lng };
        io.emit("locationUpdate", drivers); // Broadcast updated locations
    });

    socket.on("disconnect", () => {
        console.log("Driver disconnected:", socket.id);
        for (let userId in drivers) {
            if (drivers[userId].socketId === socket.id) {
                delete drivers[userId];
                io.emit("locationUpdate", drivers);
                break;
            }
        }
    });
});

server.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
});
