const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ✅ Enable CORS for API requests
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    },
    transports: ["polling"] // ✅ Only use polling (no WebSocket)
});

let drivers = {}; // Stores driver locations

// 📌 API Endpoint: Get all active driver locations
app.get("/dashboard/drivers/all", (req, res) => {
    res.json(Object.values(drivers));
});

// 📌 WebSocket Connection Handling
io.on("connection", (socket) => {
    console.log("A driver connected:", socket.id);

    socket.on("sendLocation", (data) => {
        // console.log(`📍 Location update from ${data.userId}:`, data);
        drivers[data.userId] = { 
            userId: data.userId, 
            lat: data.lat, 
            lng: data.lng,
            socketId: socket.id
        };
        io.emit("locationUpdate", Object.values(drivers)); // Broadcast updates
    });

    // 📌 Handle Disconnection
    socket.on("disconnect", () => {
        // console.log("❌ Driver disconnected:", socket.id);
        for (let userId in drivers) {
            if (drivers[userId].socketId === socket.id) {
                delete drivers[userId];
                io.emit("locationUpdate", Object.values(drivers));
                break;
            }
        }
    });
});

// 🌍 Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
