import User from "../models/user.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // Añadido la importación faltante
import dotenv from "dotenv";

dotenv.config();

// Configuración especial para solucionar el problema de certificados SSL
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD, // Debe ser una contraseña de aplicación de Google
  },
  tls: {
    // Esta es la clave para solucionar el problema
    rejectUnauthorized: false // PERMITE conexiones con certificados no verificados
  }
});

// Verificar la conexión al iniciar
transporter.verify(function(error, success) {
  if (error) {
    console.log("Error en la verificación del transportador:", error);
  } else {
    console.log("Servidor de correo listo para enviar mensajes");
  }
});


// Función auxiliar para enviar correos electrónicos
const sendEmail = async (options) => {
  try {
    console.log("Intentando enviar correo a:", options.to);
    
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text,
    });
    
    console.log("Correo enviado exitosamente a:", options.to);
    return true;
  } catch (error) {
    console.error("Error al enviar correo:", error);
    // Loguear detalles específicos del error para diagnóstico
    if (error.code) {
      console.error(`Código de error: ${error.code}`);
    }
    if (error.command) {
      console.error(`Comando fallido: ${error.command}`);
    }
    return false;
  }
};

// Obtener todos los usuarios (sin cambios)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los usuarios", error: error.message });
  }
};

// Obtener usuario por ID (sin cambios)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el usuario", error: error.message });
  }
};

// Actualizar usuario (sin cambios)
export const updateUser = async (req, res) => {
  try {
    const { email, ...updateData } = req.body;
    const result = await User.updateOne({ email }, { $set: updateData });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el usuario", error: error.message });
  }
};

// Eliminar usuario (sin cambios)
export const deleteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await User.deleteOne({ email });
    res.json({ success: true, message: "Usuario eliminado", result });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el usuario", error: error.message });
  }
};

// Registro de usuario - OPTIMIZADO
export const signUp = async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);
    
    const { name, email, password, role, typeid, identification, domain } = req.body;

    // Validación de datos
    if (!email || !password || !name || !domain) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    // Verificar usuario existente
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    // Crear nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      typeid,
      identification,
      isVerified: false,
    });

    // Guardar el usuario
    const user = await newUser.save();
    
    // Generar token de verificación
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Aumentado a 24h para dar más tiempo
    );
    
    const verificationUrl = `${domain}/verify-email?token=${verificationToken}`;
    
    // Responder al cliente inmediatamente para evitar timeouts
    res.json({ 
      message: "Registro exitoso. Verifica tu correo.", 
      userId: user._id,
      emailStatus: "pendiente" // Indica que el email se procesará
    });

    // Enviar correo de verificación (ya sin bloquear la respuesta)
    const emailSent = await sendEmail({
      to: user.email,
      subject: "Verifica tu correo electrónico",
      html: `<p>Hola ${user.name},</p>
             <p>Verifica tu correo haciendo clic en el siguiente enlace:</p>
             <a href="${verificationUrl}">Verificar correo</a>
             <p>Este enlace expira en 24 horas.</p>`,
    });

    // Opcionalmente, registrar si el correo se envió correctamente (para debugging)
    if (!emailSent) {
      console.log("No se pudo enviar el correo de verificación a:", user.email);
      // Aquí podrías implementar una cola de reintentos o notificación alternativa
    }
  } catch (error) {
    console.error("Error en signUp:", error);
    res.status(500).json({ message: "Error al registrar el usuario", error: error.message });
  }
};

// Verificar email (sin cambios mayores)
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res
        .status(400)
        .send({ message: "Token inválido o usuario no encontrado." });
    }

    user.isVerified = true;
    await user.save();

    res.send({ message: "Correo verificado exitosamente." });
  } catch (error) {
    res.status(500).send({ message: "Error al verificar el correo.", error });
  }
};

// Iniciar sesión (sin cambios)
export const signIn = async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email });

    if (!userFound) {
      return res.status(401).send({ message: "Email o contraseña inválidos." });
    }

    if (!userFound.isVerified) {
      return res
        .status(401)
        .send({ message: "Tu correo no ha sido verificado." });
    }

    if (bcrypt.compareSync(req.body.password, userFound.password)) {
      return res.send(userFound);
    } else {
      return res.status(401).send({ message: "Email o contraseña inválidos." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error del servidor.", error });
  }
};

// Recuperar contraseña - OPTIMIZADO
export const recoverPassword = async (req, res) => {
  const { email, domain } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "El correo electrónico no está registrado." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 86400000; // 24 horas en lugar de 1

    // Guardar usuario primero
    await user.save();
    
    // Responder al cliente inmediatamente
    res.status(200).json({
      message: "Se ha enviado un correo para recuperar tu contraseña.",
      status: "processing"
    });

    // Enviar correo sin bloquear la respuesta
    await sendEmail({
      to: email,
      subject: "Recuperación de Contraseña",
      html: `<p>Para recuperar tu contraseña, haz clic en el siguiente enlace:</p>
             <a href="${domain}/reset-password?token=${token}">Restablecer contraseña</a>
             <p>Este enlace expira en 24 horas.</p>`
    });

  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al recuperar la contraseña.", error });
  }
};

// Restablecer contraseña (sin cambios mayores)
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido o ha expirado." });
    }

    user.password = bcrypt.hashSync(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      message: "Tu contraseña ha sido restablecida exitosamente.",
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al restablecer la contraseña.", error });
  }
};

// Cambiar estado de usuario - OPTIMIZADO
export const changeState = async (req, res) => {
  try {
    const { email, ...infoToUpdate } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const result = await User.updateOne({ email }, { $set: infoToUpdate });
    
    // Responder de inmediato
    res.send(result);
    
    // Si el estado cambió a activo, enviar correo sin bloquear
    if (infoToUpdate.state === "active") {
      const updatedUser = await User.findOne({ email });
      
      await sendEmail({
        to: email,
        subject: "Cuenta Activada",
        text: `Hola ${updatedUser.name},\n\nTu cuenta ha sido activada exitosamente.\n\nSaludos,\nEl equipo de Promesas a la Cancha`,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar el estado.", error });
  }
};