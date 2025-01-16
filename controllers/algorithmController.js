// Importar el modelo de usuario
import User from "../models/user.js";
import axios from "axios";

/**
 * Asigna un puntaje a un usuario basándose en los datos proporcionados.
 * @param {Object} data - Datos del usuario necesarios para calcular el puntaje.
 * @param {string} data.email - Correo del usuario.
 * @param {string} data.position - Posición general del usuario.
 * @param {number} data.height - Altura en cm.
 * @param {number} data.weight - Peso en kg.
 * @param {number} data.yearsexp - Años de experiencia.
 * @param {boolean} data.criminalRecord - Antecedentes penales.
 * @param {boolean} data.videoUploaded - Si el usuario subió videos.
 * @param {boolean} data.ambidextrous - Si es ambidiestro.
 * @param {string} data.foot - Pie dominante del usuario (left, right).
 * @param {number} data.versatility - Versatilidad del usuario.
 * @returns {Object} Resultado del proceso de asignación de puntaje.
 */
const assignRanges = async ({
  email,
  position,
  height,
  weight,
  yearsexp,
  videoUploaded,
  ambidextrous,
  foot,
  versatility,
}) => {
  console.log(email, position, height, weight, yearsexp, videoUploaded, ambidextrous, foot, versatility);
  

  try {
    // 1. Validar que el usuario existe en la base de datos
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Datos que se enviarán a la API Flask
    const payload = {
      position,
      height,
      weight,
      experience: yearsexp,
      videoUploaded: videoUploaded ? 1 : 0,
      ambidextrous: ambidextrous ? 1 : 0,
      dominantFoot: foot,
      versatility,
    };

    // 3. Realizar la solicitud POST a la API Flask
    const response = await axios.post( `${process.env.RED_API}/predict `, payload);
    const { puntaje } = response.data;
    console.log('Puntaje asignado:', puntaje);
    // 4. Guardar el puntaje en el usuario
    user.score = puntaje;
    await user.save();

    return {
      success: true,
      message: 'Puntaje asignado correctamente',
      puntaje,
    };
  } catch (error) {
    console.error('Error asignando puntaje:', error.message);
    return {
      success: false,
      message: 'Error asignando puntaje',
      error: error.message,
    };
  }
};

export default { assignRanges };
