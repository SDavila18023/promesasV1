import mongoose from "mongoose";

/**
 * Esquema de un mensaje en la base de datos.
 * @typedef {Object} MessageSchema
 * @property {string} from - El remitente del mensaje.
 * @property {string} to - El destinatario del mensaje.
 * @property {string} content - El contenido del mensaje.
 * @property {Date} timestamp - Fecha y hora en que el mensaje fue enviado. Por defecto, se establece en la fecha y hora actuales.
 * @property {boolean} read - Indica si el mensaje ha sido leído o no. Por defecto es `false`.
 */
const messageSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Remitente del mensaje
  to: { type: String, required: true }, // Destinatario del mensaje
  content: { type: String, required: true }, // Contenido del mensaje
  timestamp: { type: Date, default: Date.now }, // Marca de tiempo (fecha y hora del mensaje)
  read: { type: Boolean, default: false }, // Indicador de si el mensaje ha sido leído
});

/**
 * Modelo de Mongoose para la colección de mensajes.
 * @typedef {mongoose.Model} Message
 */
const Message = mongoose.model("Message", messageSchema);

export default Message;
