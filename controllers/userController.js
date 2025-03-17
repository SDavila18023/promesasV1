import User from "../models/user.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Configuración segura de nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los usuarios", error: error.message });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el usuario", error: error.message });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { email, ...updateData } = req.body;
    const result = await User.updateOne({ email }, { $set: updateData });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el usuario", error: error.message });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await User.deleteOne({ email });
    res.json({ success: true, message: "Usuario eliminado", result });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el usuario", error: error.message });
  }
};

// Registro de usuario
export const signUp = async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);
    
    const { name, email, password, role, typeid, identification, domain } = req.body;

    if (!email || !password || !name || !domain) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    const existingUser = await User.findOne({ email });
    console.log("Usuario existente:", existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

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

    const user = await newUser.save();
    console.log("Usuario guardado:", user);

    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Token generado:", verificationToken);

    const verificationUrl = `${domain}/verify-email?token=${verificationToken}`;

    res.json({ message: "Registro exitoso. Verifica tu correo.", userId: user._id });

    setImmediate(async () => {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Verifica tu correo electrónico",
          html: `<p>Hola ${user.name},</p>
                 <p>Verifica tu correo haciendo clic en el siguiente enlace:</p>
                 <a href="${verificationUrl}">Verificar correo</a>
                 <p>Este enlace expira en 1 hora.</p>`,
        });
        console.log("Correo enviado a:", user.email);
      } catch (error) {
        console.error("Error enviando correo:", error);
      }
    });
  } catch (error) {
    console.error("Error en signUp:", error);
    res.status(500).json({ message: "Error al registrar el usuario", error: error.message });
  }
};


/**
 * Verifica el correo electrónico de un usuario mediante un token.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
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
/**
 * Inicia sesión para un usuario registrado.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
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

/**
 * Solicita la recuperación de contraseña enviando un correo al usuario.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
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
    user.resetPasswordExpires = Date.now() + 3600000;

    // Guardar usuario y enviar correo en paralelo para mejorar el rendimiento
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Recuperación de Contraseña",
      text: `Para recuperar tu contraseña, haz clic en el siguiente enlace: \n
             ${domain}/reset-password?token=${token} \n
             Este enlace expira en 1 hora.`,
    };

    await Promise.all([
      user.save(), // Guardar cambios en la base de datos
      transporter.sendMail(mailOptions).catch(console.error), // Enviar email sin bloquear
    ]);

    res.status(200).json({
      message: "Se ha enviado un correo para recuperar tu contraseña.",
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al recuperar la contraseña.", error });
  }
};

/**
 * Restablece la contraseña de un usuario utilizando un token válido.
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
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

/**
 * Cambia el estado de un usuario (activo/inactivo).
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
export const changeState = async (req, res) => {
  try {
    const email = req.body.email;
    const infoToUpdate = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const result = await User.updateOne({ email }, { $set: infoToUpdate });
    const updatedUser = await User.findOne({ email });

    if (updatedUser.state === "active") {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Cuenta Activada",
        text: `Hola ${updatedUser.name},\n\nTu cuenta ha sido activada exitosamente.\n\nSaludos,\nEl equipo de Promesas a la Cancha`,
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar el estado.", error });
  }
};
