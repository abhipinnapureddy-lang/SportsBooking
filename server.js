require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { errorHandler } = require("./middleware/errorMiddleware");
const { initializeDb } = require("./database/initDb");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Smart Campus Sports Management System API is running...");
});

const PORT = process.env.PORT || 5000;

initializeDb()
    .then(() => {
        const authRoutes = require("./routes/authRoutes");
        const venueRoutes = require("./routes/venueRoutes");
        const courtRoutes = require("./routes/courtRoutes");
        const bookingRoutes = require("./routes/bookingRoutes");
        const userRoutes = require("./routes/userRoutes");
        const equipmentRoutes = require("./routes/equipmentRoutes");
        const notificationRoutes = require("./routes/notificationRoutes");
        const settingsRoutes = require("./routes/settingsRoutes");
        const groundRoutes = require("./routes/groundRoutes");
        const slotRoutes = require("./routes/slotRoutes");
        const inventoryRoutes = require("./routes/inventoryRoutes");
        const sportsRoutes = require("./routes/sportsRoutes");
        const studentsRoutes = require("./routes/studentsRoutes");

        app.use("/api/auth", authRoutes);
        app.use("/api/venues", venueRoutes);
        app.use("/api/courts", courtRoutes);
        app.use("/api/bookings", bookingRoutes);
        app.use("/api/users", userRoutes);
        app.use("/api/equipment", equipmentRoutes);
        app.use("/api/notifications", notificationRoutes);
        app.use("/api/settings", settingsRoutes);
        app.use("/api/grounds", groundRoutes);
        app.use("/api/slots", slotRoutes);
        app.use("/api/inventory", inventoryRoutes);
        app.use("/api/sports", sportsRoutes);
        app.use("/api/students", studentsRoutes);

        if (process.env.NODE_ENV === "production") {
            const frontendDist = path.join(__dirname, "frontend", "dist");
            app.use(express.static(frontendDist));
            app.get("*", (req, res, next) => {
                if (req.path.startsWith("/api")) {
                    return next();
                }
                res.sendFile(path.join(frontendDist, "index.html"));
            });
        }

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({ status: "error", message: "Route not found" });
        });

        // Error middleware
        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database initialization failed:", error);
        process.exit(1);
    });
