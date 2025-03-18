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
  dominantFoot,
  versatility,
  achievements,
  injuryHistory,
  trainingHoursPerWeek,
}) => {
  console.log(email, position, height, weight, yearsexp, videoUploaded, ambidextrous, dominantFoot, versatility, achievements, injuryHistory, trainingHoursPerWeek);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Si el pie dominante es "both", aseguramos que ambidextrous sea 1 y asignamos un valor válido a dominantFoot
    if (dominantFoot === "both") {
      ambidextrous = 1;  // Asegurar que ambidextrous sea 1
      dominantFoot = "right"; // Enviar un valor válido a la API
    }

    const adjustedExperience = yearsexp * 0.5;
    const adjustedAchievements = achievements * 0.3;

    const payload = {
      position,
      height,
      weight,
      experience: adjustedExperience,
      videoUploaded: videoUploaded ? 1 : 0,
      ambidextrous: ambidextrous ? 1 : 0,
      dominantFoot,
      versatility,
      achievements: adjustedAchievements,
      injuryHistory,
      trainingHoursPerWeek,
    };

    const response = await axios.post(`${process.env.RED_API}/predict`, payload);

    if (!response.data || typeof response.data.puntaje !== "number") {
      throw new Error("Respuesta inválida de la API de predicción");
    }

    const { puntaje } = response.data;
    console.log('Puntaje asignado:', puntaje);

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
