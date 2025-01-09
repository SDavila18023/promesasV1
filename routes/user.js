import express from "express";
import {
  getAllUsers,
  getUserById,
  signUp,
  verifyEmail,
  signIn,
  recoverPassword,
  resetPassword,
  deleteUser,
  updateUser,
  changeState,
} from "../controllers/userController.js";

const user = express.Router();

/**
 * @route GET /
 * @description Obtiene todos los usuarios.
 * @access Public
 */
user.get("/", getAllUsers);

/**
 * @route GET /playerId/:id
 * @description Obtiene un usuario por su ID.
 * @param {string} id - ID del usuario a buscar.
 * @access Public
 */
user.get("/playerId/:id", getUserById);

/**
 * @route POST /signup
 * @description Registra un nuevo usuario.
 * @access Public
 */
user.post("/signup", signUp);

/**
 * @route GET /verify-email
 * @description Verifica el correo electrónico de un usuario mediante un token.
 * @access Public
 */
user.get("/verify-email", verifyEmail);

/**
 * @route POST /signin
 * @description Inicia sesión para un usuario registrado.
 * @access Public
 */
user.post("/signin", signIn);

/**
 * @route POST /recover-password
 * @description Solicita la recuperación de contraseña enviando un correo al usuario.
 * @access Public
 */
user.post("/recover-password", recoverPassword);

/**
 * @route POST /reset-password
 * @description Restablece la contraseña de un usuario utilizando un token válido.
 * @access Public
 */
user.post("/reset-password", resetPassword);

/**
 * @route DELETE /
 * @description Elimina un usuario del sistema.
 * @access Private (Admin)
 */
user.delete("/", deleteUser);

/**
 * @route PUT /change-state
 * @description Cambia el estado de un usuario (activo/inactivo).
 * @access Private (Admin)
 */
user.put("/change-state", changeState);

/**
 * @route PUT /update-user
 * @description Actualiza los datos de un usuario existente.
 * @access Private (Admin o usuario propietario)
 */
user.put("/update-user", updateUser);

export default user;
