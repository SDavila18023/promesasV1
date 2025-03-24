// Imports
import express from "express";
import cors from "cors";
import http from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Imports Archivos JS
import user from "./routes/user.js";
import message from "./routes/message.js";
import algorithm from "./routes/algorithm.js";
import Message from "./models/message.js";
import User from "./models/user.js"; // Se agregó la importación de User

dotenv.config();

// Init Express
const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors({
  origin: "https://www.promesasalacancha.pro",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware para manejar preflight requests
app.options("*", cors());

// Middlewares
app.use(express.json());
app.use(morgan("dev"));

// Configuración de WebSockets con CORS
const io = new Server(server, {
  cors: {
    origin: "https://www.promesasalacancha.pro",
    methods: ["GET", "POST"]
  }
});

/**
 * @function initializeSocket
 * @description Inicializa la conexión de sockets y gestiona eventos.
 */
const initializeSocket = () => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", async (message) => {
      try {
        const newMessage = new Message(message);
        await newMessage.save();
        io.emit("receiveMessage", message);
      } catch (error) {
        console.error("Error saving message:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

/**
 * @function connectToDatabase
 * @description Conecta a la base de datos MongoDB.
 */
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // Se eliminaron opciones innecesarias
    console.log("✅ Base de datos conectada");
  } catch (err) {
    console.error("❌ Error conectando a la base de datos:", err.message);
  }
};


/**
 * @function getContacts
 * @description Obtiene los contactos del usuario actual basándose en los mensajes enviados y recibidos.
 * @param {string} username - Nombre de usuario para buscar contactos.
 * @returns {Promise<void>}
 */
const getContacts = async (username) => {
  try {
    const sentMessages = await Message.find({ to: username }).distinct("from");
    const receivedMessages = await Message.find({ from: username }).distinct("to");
    const contactUsernames = [...new Set([...sentMessages, ...receivedMessages])];

    const contacts = await User.find({ username: { $in: contactUsernames } });

    console.log("📩 Sent Messages:", sentMessages);
    console.log("📨 Received Messages:", receivedMessages);
    console.log("👥 Contacts:", contacts);

    return contacts;
  } catch (error) {
    console.error("❌ Error obteniendo contactos:", error.message);
    throw error;
  }
};

// Rutas
app.use("/api/user", user);
app.use("/api/message", message);
app.use("/api/algorithm", algorithm);

/**
 * @route GET /contacts/:username
 * @description Obtiene la lista de contactos de un usuario.
 */
app.get("/contacts/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const contacts = await getContacts(username);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /messages/:from/:to
 * @description Obtiene los mensajes entre dos usuarios.
 */
app.get("/messages/:from/:to", async (req, res) => {
  const { from, to } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { from, to },
        { from: to, to: from }
      ]
    }).sort("timestamp");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servidor
const port = process.env.PORT || 5000;

/**
 * @function startServer
 * @description Inicia el servidor Express.
 */
const startServer = () => {
  server.listen(port, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${port}`);
  });
};

// Conexiones
connectToDatabase();
initializeSocket();
startServer();

export default app;
