import express from "express";
import { 
  getUnreadCount,
  getAllMessages,
  deleteMessage,
  getContacts,
  getMessagesBetweenUsers,
  markMessagesAsRead
} from "../controllers/messageController.js";

const message = express.Router();

/**
 * @route GET /api/messages/unread-count/:username
 * @description Obtener el conteo de mensajes no leídos para un usuario específico.
 * @param {string} username - El nombre de usuario para el cual obtener los mensajes no leídos.
 * @returns {Object}  El número de mensajes no leídos para el usuario especificado.
 * @throws {500} Error al obtener el conteo de mensajes no leídos.
 */
message.get("/unread-count/:username", getUnreadCount);

/**
 * @route GET /api/messages
 * @description Obtener todos los mensajes ordenados por fecha de forma descendente.
 * @returns {Array} Lista de mensajes ordenados por fecha de forma descendente.
 * @throws {500} Error al obtener los mensajes.
 */
message.get("/", getAllMessages);

/**
 * @route DELETE /api/messages/:id
 * @description Eliminar un mensaje por su ID.
 * @param {string} id - El ID del mensaje a eliminar.
 * @returns {Object} Mensaje indicando que el mensaje ha sido eliminado exitosamente.
 * @throws {500} Error al eliminar el mensaje.
 */
message.delete("/:id", deleteMessage);

/**
 * @route GET /api/messages/contacts/:username
 * @description Obtener la lista de usuarios que han intercambiado mensajes con el usuario actual.
 * @param {string} username - El nombre de usuario para el cual obtener los contactos.
 * @returns {Array} Lista de usuarios con los que el usuario ha intercambiado mensajes.
 * @throws {500} Error al obtener los contactos.
 */
message.get("/contacts/:username", getContacts);

/**
 * @route GET /api/messages/messages/:from/:to
 * @description Obtener los mensajes entre dos usuarios, ordenados por fecha.
 * @param {string} from - El nombre del usuario que envía los mensajes.
 * @param {string} to - El nombre del usuario que recibe los mensajes.
 * @returns {Array} Lista de mensajes entre los dos usuarios, ordenados por fecha.
 * @throws {500} Error al obtener los mensajes entre los usuarios.
 */
message.get("/messages/:from/:to", getMessagesBetweenUsers);

/**
 * @route PUT /api/messages/mark-as-read
 * @description Marcar todos los mensajes como leídos para un usuario específico.
 * @body {Object} JSON con el campo `to`, que es el nombre de usuario para el cual marcar los mensajes como leídos.
 * @returns {Object} Mensaje indicando que los mensajes han sido marcados como leídos.
 * @throws {500} Error al marcar los mensajes como leídos.
 */
message.put("/mark-as-read", markMessagesAsRead);

export default message;
