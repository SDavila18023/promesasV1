import synaptic from "synaptic";
import fs from "fs";
import csvParser from "csv-parser";

// Destructurar Synaptic
const { Layer, Network, Trainer } = synaptic;

/**
 * Crea una red neuronal con una capa de entrada, dos capas ocultas y una capa de salida.
 * @returns {Network} Red neuronal creada.
 */
function createNeuralNetwork() {
  const inputLayer = new Layer(8); // Número de atributos de entrada
  const hiddenLayer1 = new Layer(10); // Primera capa oculta con 10 neuronas
  const hiddenLayer2 = new Layer(5); // Segunda capa oculta con 5 neuronas
  const outputLayer = new Layer(1); // Capa de salida con una neurona

  // Conectar las capas
  inputLayer.project(hiddenLayer1);
  hiddenLayer1.project(hiddenLayer2);
  hiddenLayer2.project(outputLayer);

  return new Network({
    input: inputLayer,
    hidden: [hiddenLayer1, hiddenLayer2],
    output: outputLayer,
  });
}

/**
 * Normaliza un valor en un rango específico.
 * @param {number} value - El valor a normalizar.
 * @param {number} min - El valor mínimo del rango.
 * @param {number} max - El valor máximo del rango.
 * @returns {number} Valor normalizado en el rango de 0 a 1.
 */
const normalize = (value, min, max) => (value - min) / (max - min);

/**
 * Carga datos de entrenamiento desde un archivo CSV y los normaliza.
 * @param {string} filePath - Ruta al archivo CSV.
 * @param {function} callback - Función que recibe los datos de entrenamiento cargados.
 */
function loadTrainingData(filePath, callback) {
  const trainingData = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (row) => {
      const input = [
        parseFloat(row.position),
        normalize(parseFloat(row.height), 150, 200) * 1.2, // Aumentar importancia
        normalize(parseFloat(row.weight), 50, 100) * 1.2, // Aumentar importancia
        normalize(parseFloat(row.experience), 0, 20),
        parseInt(row.videoUploaded) * 1.5, // Aumentar importancia
        parseInt(row.ambidextrous) * 0.1, // Reducir importancia
        parseInt(row.dominantFoot === "left" ? 1 : 0),
        parseInt(row.versatility) * 0.1, // Reducir importancia
      ];

      const output = [normalize(parseFloat(row.output), 0, 1)]; // Normalizar salida
      trainingData.push({ input, output });
    })
    .on("end", () => callback(trainingData));
}

/**
 * Entrena la red neuronal con los datos proporcionados y aplica early stopping si es necesario.
 * @param {Network} network - La red neuronal a entrenar.
 * @param {Array} trainingData - Los datos de entrenamiento en formato {input, output}.
 */
function trainNetwork(network, trainingData) {
  const trainer = new Trainer(network);
  const maxIterations = 6000;
  const learningRate = 0.001;
  const patience = 2000;
  let previousError = Infinity;
  let noImprovementCount = 0;

  for (let i = 0; i < maxIterations; i++) {
    trainer.train(trainingData, {
      rate: learningRate,
      iterations: 1,
      shuffle: true,
      cost: Trainer.cost.CROSS_ENTROPY,
    });

    // Calcular el error promedio
    const totalError = trainingData.reduce((errorSum, data) => {
      const output = network.activate(data.input);
      return errorSum + Math.abs(output[0] - data.output[0]);
    }, 0);

    const currentError = totalError / trainingData.length;

    // Early stopping si no hay mejora
    if (currentError < previousError) {
      previousError = currentError;
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
      if (noImprovementCount >= patience) {
        console.log("Early stopping triggered at iteration", i);
        break;
      }
    }

    // Mostrar el error cada 1000 iteraciones
    if (i % 1000 === 0) {
      console.log(`Iteration ${i}: Error ${currentError}`);
    }
  }

  console.log("Training completed successfully.");
}

// Inicializar y entrenar la red neuronal
const neuralNetwork = createNeuralNetwork();

/**
 * Carga los datos de entrenamiento y entrena la red neuronal.
 */
loadTrainingData("./models/datos.csv", (trainingData) => {
  trainNetwork(neuralNetwork, trainingData);
});

export default neuralNetwork;
