// Imports
import express from "express";
import cors from "cors";
import http from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Imports Archivos js
import user from "./routes/user.js";
import Message from "./models/message.js";
import message from "./routes/message.js";
import algorithm from "./routes/algorithm.js";

dotenv.config();

// Init Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

/**
 * @function initializeSocket
 * @description Inicializa la conexión de sockets y gestiona eventos.
 */
const initializeSocket = () => {
  io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    socket.on("sendMessage", async (message) => {
      const newMessage = new Message(message);
      await newMessage.save();
      io.emit("receiveMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};

/**
 * @function connectToDatabase
 * @description Conecta a la base de datos MongoDB.
 */
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Base de datos conectada");
  } catch (err) {
    console.log(err.message);
  }
};

/**
 * @function getContacts
 * @description Obtiene los contactos del usuario actual basándose en los mensajes enviados y recibidos.
 * @param {string} username - Nombre de usuario para buscar contactos.
 * @returns {Promise<void>}
 */
const getContacts = async (username) => {
  const sentMessages = await Message.find({ to: username }).distinct("from");
  const receivedMessages = await Message.find({ from: username }).distinct(
    "to"
  );
  const contactUsernames = [...new Set([...sentMessages, ...receivedMessages])];
  const contacts = await User.find({ username: { $in: contactUsernames } });

  console.log("Sent Messages:", sentMessages); // Añadir logs para depuración
  console.log("Received Messages:", receivedMessages); // Añadir logs para depuración
  console.log("Contacts:", contacts); // Añadir logs para depuración

  return contacts;
};

// Rutas
app.use("/api/user", user);
app.use("/api/message", message);
app.use("/api/algorithm", algorithm);

/**
 * @route GET /contacts/:username
 * @param {string} username - Nombre de usuario
 * @returns {Object[]} Lista de contactos
 */
app.get("/contacts/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const contacts = await getContacts(username);
    res.json(contacts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @route GET /messages/:from/:to
 * @param {string} from - Usuario que envía el mensaje
 * @param {string} to - Usuario que recibe el mensaje
 * @returns {Object[]} Lista de mensajes entre dos usuarios
 */
app.get("/messages/:from/:to", async (req, res) => {
  const { from, to } = req.params;
  const messages = await Message.find({
    $or: [
      { from, to },
      { from: to, to: from },
    ],
  }).sort("timestamp");
  res.json(messages);
});

// Servidor
const port = process.env.PORT || 5000;

const startServer = () => {
  server.listen(port, () => {
    console.log(`Servidor en el puerto ${port}`);
  });
};

// Conexiones
connectToDatabase();
initializeSocket();
startServer();

export default app;