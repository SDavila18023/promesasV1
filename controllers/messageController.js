import Message from "../models/message.js";
import User from "../models/user.js";

/**
 * @function getUnreadCount
 * @description Obtener el conteo de mensajes no leídos para un usuario específico.
 * @param {Object} req - El objeto de solicitud que contiene el parámetro `username` en `req.params`.
 * @param {Object} res - El objeto de respuesta que se utiliza para enviar el conteo de mensajes no leídos.
 * @returns {Object} Un objeto JSON con el número de mensajes no leídos.
 * @throws {500} Error al obtener el conteo de mensajes no leídos.
 */
export const getUnreadCount = async (req, res) => {
  const { username } = req.params;

  try {
    const unreadCount = await Message.countDocuments({
      to: username,
      read: false,
    });
    res.json({ count: unreadCount });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error al obtener el conteo de mensajes no leídos");
  }
};

/**
 * @function getAllMessages
 * @description Obtener todos los mensajes ordenados por fecha de forma descendente.
 * @param {Object} req - El objeto de solicitud, no se requiere ningún parámetro en este caso.
 * @param {Object} res - El objeto de respuesta que se utiliza para devolver la lista de mensajes.
 * @returns {Array} Una lista de objetos de mensajes ordenada por fecha (más reciente primero).
 * @throws {500} Error al obtener los mensajes.
 */
export const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error al obtener los mensajes");
  }
};

/**
 * @function deleteMessage
 * @description Eliminar un mensaje por su ID.
 * @param {Object} req - El objeto de solicitud que contiene el parámetro `id` en `req.params`.
 * @param {Object} res - El objeto de respuesta que se utiliza para confirmar la eliminación del mensaje.
 * @returns {Object} Un mensaje JSON indicando que el mensaje ha sido eliminado exitosamente.
 * @throws {500} Error al eliminar el mensaje.
 */
export const deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    await Message.findByIdAndDelete(id);
    res.status(200).send({ message: "Mensaje eliminado exitosamente" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error al eliminar el mensaje");
  }
};

/**
 * @function getContacts
 * @description Obtener la lista de usuarios que han intercambiado mensajes con el usuario actual.
 * @param {Object} req - El objeto de solicitud que contiene el parámetro `username` en `req.params`.
 * @param {Object} res - El objeto de respuesta que se utiliza para devolver la lista de contactos.
 * @returns {Array} Una lista de objetos de usuarios que han intercambiado mensajes con el usuario.
 * @throws {500} Error al obtener los contactos.
 */
export const getContacts = async (req, res) => {
  const { username } = req.params;

  try {
    const sentMessages = await Message.find({ to: username }).distinct("from");
    const receivedMessages = await Message.find({ from: username }).distinct("to");
    const contactUsernames = [
      ...new Set([...sentMessages, ...receivedMessages]),
    ];

    const contacts = await User.find({ name: { $in: contactUsernames } });
    res.json(contacts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error al obtener los contactos");
  }
};

/**
 * @function getMessagesBetweenUsers
 * @description Obtener los mensajes entre dos usuarios, ordenados por fecha.
 * @param {Object} req - El objeto de solicitud que contiene los parámetros `from` y `to` en `req.params`.
 * @param {Object} res - El objeto de respuesta que se utiliza para devolver los mensajes entre los dos usuarios.
 * @returns {Array} Una lista de mensajes entre los dos usuarios, ordenados por fecha de forma ascendente.
 * @throws {500} Error al obtener los mensajes entre los usuarios.
 */
export const getMessagesBetweenUsers = async (req, res) => {
  const { from, to } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    }).sort("timestamp");

    res.json(messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error al obtener los mensajes entre usuarios");
  }
};

/**
 * @function markMessagesAsRead
 * @description Marcar todos los mensajes como leídos para un usuario específico.
 * @param {Object} req - El objeto de solicitud que contiene el campo `to` en `req.body`.
 * @param {Object} res - El objeto de respuesta que se utiliza para confirmar que los mensajes fueron marcados como leídos.
 * @returns {Object} Un mensaje JSON indicando que los mensajes han sido marcados como leídos.
 * @throws {500} Error al marcar los mensajes como leídos.
 */
export const markMessagesAsRead = async (req, res) => {
  const { to } = req.body;

  try {
    await Message.updateMany({ to, read: false }, { $set: { read: true } });
    res.status(200).send({ message: "Mensajes marcados como leídos" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Error al marcar los mensajes como leídos");
  }
};
