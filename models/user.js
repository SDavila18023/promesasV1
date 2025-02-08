import mongoose from "mongoose";


/**
 * Esquema de un usuario en la base de datos.
 * @typedef {Object} UserSchema
 * @property {string} name - Nombre del usuario. Es requerido.
 * @property {string} email - Correo electrónico único del usuario. Es requerido.
 * @property {string} password - Contraseña del usuario. Es requerido.
 * @property {string} role - Rol del usuario (ej. admin, scout, etc.). Es requerido.
 * @property {number} [phone] - Número de teléfono del usuario.
 * @property {number} [weight] - Peso del usuario en kilogramos.
 * @property {number} [height] - Altura del usuario en centímetros.
 * @property {number} [age] - Edad del usuario.
 * @property {string} [organization] - Organización a la que pertenece el usuario.
 * @property {string} [position] - Posición dentro de la organización (si aplica).
 * @property {string} [gender] - Género del usuario.
 * @property {string} [photo] - URL de la foto del usuario.
 * @property {string} [genposition] - Posición general del usuario en el equipo.
 * @property {string[]} [natposition] - Posiciones naturales del usuario.
 * @property {number} [yearsexp] - Años de experiencia del usuario.
 * @property {string} [description] - Descripción o biografía del usuario.
 * @property {string} [foot] - Pie dominante del usuario (ej. left, right).
 * @property {string} [typeid] - Tipo de identificación (ej. ID, pasaporte).
 * @property {number} [identification] - Número de identificación del usuario.
 * @property {string[]} [videos] - URLs de videos relacionados al usuario.
 * @property {string} [resetPasswordToken] - Token para restablecer la contraseña.
 * @property {Date} [resetPasswordExpires] - Fecha de expiración del token de restablecimiento de contraseña.
 * @property {number} [score] - Puntuación general del usuario.
 * @property {string} [license] - Licencia del usuario (ej. de entrenador o scout).
 * @property {string} [state] - Estado del usuario (ej. activo, inactivo).
 * @property {boolean} [isVerified] - Indica si el usuario ha sido verificado.
 * @property {Date} createdAt - Fecha de creación del registro.
 * @property {Date} updatedAt - Fecha de la última actualización del registro.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Nombre del usuario
    email: { type: String, required: true, unique: true }, // Correo único
    password: { type: String, required: true }, // Contraseña del usuario
    role: { type: String, required: true }, // Rol (ej. admin, scout)
    phone: { type: Number }, // Teléfono del usuario
    weight: { type: Number }, // Peso en kilogramos
    height: { type: Number }, // Altura en centímetros
    age: { type: Number }, // Edad del usuario
    organization: { type: String }, // Organización asociada
    position: { type: String }, // Posición en la organización
    gender: { type: String }, // Género del usuario
    photo: { type: String }, // URL de la foto del usuario
    genposition: { type: String }, // Posición general del usuario
    natposition: { type: [String] }, // Posiciones naturales del usuario
    yearsexp: [
      {
        startYear: { type: Number, required: true },
        endYear: { type: Number }, // Si está vacío, el jugador sigue activo en el club
        club: { type: String, required: true },
        description: { type: String }
      }
    ],
    description: { type: String }, // Descripción o biografía
    foot: { type: String }, // Pie dominante
    typeid: { type: String }, // Tipo de identificación
    identification: { type: Number, unique: true }, // Número de identificación
    videos: { type: [String] }, // Videos asociados
    injuryHistory: {type: Number}, // Historial de lesiones
    trainingHoursPerWeek: {type: Number}, // Horas de entrenamiento por semana
    achievements: [
      {
        year: { type: Number, required: true }, // Año del logro
        title: { type: String, required: true }, // Nombre o título del logro
        type: { type: String, enum: ["trophy", "medal", "star"], required: true } // Tipo de logro
      }
    ],    
    resetPasswordToken: { type: String }, // Token de restablecimiento
    resetPasswordExpires: { type: Date }, // Expiración del token
    score: { type: Number }, // Puntuación general
    license: { type: String }, // Licencia del usuario
    state: { type: String }, // Estado del usuario (ej. activo)
    isVerified: { type: Boolean }, // Verificación de usuario
  },
  {
    timestamps: true, // Incluye campos createdAt y updatedAt
  }
);




/**
 * Modelo de Mongoose para la colección de usuarios.
 * @typedef {mongoose.Model} User
 */
const User = mongoose.model("User", userSchema);


export default User;



