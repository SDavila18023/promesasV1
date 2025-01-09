import neuronalNetwork from "../models/neuronalNetwork.js";
import User from "../models/user.js";
import { Engine } from 'json-rules-engine';

/**
 * Lógica para asignar rangos y calcular el score de una jugadora.
 * @param {Object} params - Los parámetros enviados en la solicitud.
 * @returns {Promise<Object>} - Retorna el score calculado y el usuario actualizado.
 */
const assignRanges = async ({
  email,
  position,
  height,
  weight,
  experience,
  criminalRecord,
  videoUploaded,
  ambidextrous,
  dominantFoot,
  versatility,
}) => {
  // Definición de los rangos de altura y peso por posición
  const positionAttributes = {
    0: { height: [175, 190], weight: [65, 80] }, // Portera (PO)
    1: { height: [170, 185], weight: [60, 75] }, // Defensora central (DFC)
    2: { height: [165, 180], weight: [55, 70] }, // Laterales (LI, LD)
    3: { height: [160, 175], weight: [50, 65] }, // Centrocampistas (MC)
    4: { height: [165, 180], weight: [55, 75] }, // Mediocampista Defensivo (MCD)
    5: { height: [160, 175], weight: [50, 70] }, // Mediocampista Ofensivo (MCO)
    6: { height: [160, 175], weight: [50, 65] }, // Extremos (MI, MD, EI, ED)
    7: { height: [165, 180], weight: [55, 70] }, // Delanteros (SD, DC)
  };

  // Validación de la posición
  if (typeof position !== "number" || position < 0 || position > 7) {
    throw new Error("Se requiere una posición válida (0-7)");
  }

  // Obtener los rangos de altura y peso para la posición seleccionada
  const { height: heightRangeLimits, weight: weightRangeLimits } = positionAttributes[position];

  // Asignación de rangos de altura
  const heightRange = (height >= heightRangeLimits[0] && height <= heightRangeLimits[1])
    ? 1
    : (height >= heightRangeLimits[0] - 10 && height < heightRangeLimits[0]) ? 0.7 : 0;

  // Asignación de rangos de peso
  const weightRange = (weight >= weightRangeLimits[0] && weight <= weightRangeLimits[1])
    ? 1
    : (weight >= weightRangeLimits[0] - 10 && weight < weightRangeLimits[0]) ? 0.7 : 0;

  // Asignación de rangos de experiencia
  const experienceRange = experience >= 5 ? 1 : (experience >= 2 && experience < 5) ? 0.5 : 0;

  // Penalizaciones y bonificaciones por otros factores
  const criminalRecordRange = criminalRecord ? 0.1 : 0;
  const videoUploadedRange = videoUploaded ? 1.2 : 0;
  const ambidextrousRange = ambidextrous ? 0.05 : 0;
  const dominantFootRange = dominantFoot === "left" ? 0.2 : 0.1;
  const versatilityRange = versatility ? 0.05 : 0;

  // Lista final de atributos
  const attributes = [
    heightRange,
    weightRange,
    experienceRange,
    criminalRecordRange,
    videoUploadedRange,
    ambidextrousRange,
    dominantFootRange,
    versatilityRange,
  ];

  // Añadir la posición a los atributos
  const input = [position, ...attributes];

  // Obtener el resultado de la red neuronal
  const result = neuronalNetwork.activate(input);
  let score = Array.isArray(result) ? result[0] : result;

  // Ajustar el score final
  score = score * 0.5 + heightRange * 0.3 + weightRange * 0.2;

  // Actualizar el score del usuario en la base de datos
  const user = await User.findOneAndUpdate({ email: email }, { score: score }, { new: true });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return { score, user };
};

const positionMap = {
  PO: 0,   // Portera
  DFC: 1,  // Defensora central
  LI: 2,   // Lateral izquierdo
  LD: 2,   // Lateral derecho
  MC: 3,   // Centrocampista
  MCD: 4,  // Mediocampista defensivo
  MCO: 5,  // Mediocampista ofensivo
  MI: 6,   // Extremo izquierdo
  MD: 6,   // Extremo derecho
  EI: 6,   // Extremo izquierdo
  ED: 6,   // Extremo derecho
  SD: 7,   // Delantero
  DC: 7,   // Delantero centro
};

const getRecommendations = async (user) => {
  try {
    const { score, natposition } = user; // Obtenemos el puntaje y las posiciones naturales de la jugadora
    console.log(`Puntaje de la jugadora: ${score}`);
    console.log(`Posiciones naturales de la jugadora: ${natposition}`);

    // Mapear la posición a un número
    const positions = natposition.map(pos => positionMap[pos]); // Mapea todas las posiciones naturales
    console.log(`Posiciones mapeadas: ${positions}`);

    // Supongamos que tomamos la primera posición mapeada para compararla con los puntajes ideales
    const position = positions[0]; // Seleccionar la primera posición de la lista
    console.log(`Posición seleccionada para comparación: ${position}`);

    // Puntajes ideales por posición
    const idealScores = {
      0: 0.75, // Portera (PO)
      1: 0.80, // Defensora central (DFC)
      2: 0.80, // Laterales (LI, LD)
      3: 0.85, // Centrocampistas (MC)
      4: 0.85, // Mediocampista Defensivo (MCD)
      5: 0.85, // Mediocampista Ofensivo (MCO)
      6: 0.75, // Extremos (MI, MD, EI, ED)
      7: 0.90, // Delanteros (SD, DC)
    };

    console.log("Puntajes ideales por posición:", idealScores);
    console.log("Puntaje ideal para la posición seleccionada:", idealScores[position]);

    // Inicializar el motor de reglas
    const engine = new Engine();

    // Regla para verificar si el puntaje es adecuado para la posición actual
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'score',
            operator: 'greaterThanInclusive',
            value: idealScores[position],
          },
        ],
      },
      event: {
        type: 'score-sufficient',
        params: { message: 'El puntaje es suficiente para la posición seleccionada.' },
      },
    });

    // Regla para verificar si el puntaje es insuficiente para la posición
    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'score',
            operator: 'lessThan',
            value: idealScores[position],
          },
        ],
      },
      event: {
        type: 'score-insufficient',
        params: { message: 'El puntaje no es suficiente para la posición seleccionada.' },
      },
    });

    // Evaluar las condiciones usando los datos de entrada
    const facts = { score };
    const { events } = await engine.run(facts);

    let recommendation = "Tu puntaje sugiere que podrías mejorar en tu posición actual.";
    let suggestedPosition = null;

    // Procesar los eventos generados por el motor de reglas
    events.forEach(event => {
      if (event.type === 'score-sufficient') {
        recommendation = "Tu puntaje es bueno para tu posición actual. Sigue así y considera roles de liderazgo en tu equipo.";
      }
      if (event.type === 'score-insufficient') {
        recommendation = "Tu puntaje sugiere que podrías mejorar en tu posición actual.";

        // Buscar posiciones alternativas que se ajusten al puntaje de la jugadora
        const alternativePositions = Object.keys(idealScores)
          .filter(pos => Math.abs(idealScores[pos] - score) <= 0.1 && pos != position)
          .map(pos => {
            switch (pos) {
              case "0": return "Portera";
              case "1": return "Defensora Central";
              case "2": return "Lateral";
              case "3": return "Centrocampista";
              case "4": return "Mediocampista Defensivo";
              case "5": return "Mediocampista Ofensivo";
              case "6": return "Extremo";
              case "7": return "Delantero";
              default: return "";
            }
          });

        suggestedPosition = alternativePositions.length > 0
          ? alternativePositions
          : ["Considera mejorar tus habilidades para tu posición actual."];
      }
    });

    console.log("Recomendación final:", recommendation);
    console.log("Posición sugerida final:", suggestedPosition);

    return { recommendation, suggestedPosition };
  } catch (error) {
    console.error("Error al obtener la recomendación: " + error.message);
    throw new Error("Error al obtener la recomendación: " + error.message);
  }
};

export default { assignRanges, getRecommendations };
