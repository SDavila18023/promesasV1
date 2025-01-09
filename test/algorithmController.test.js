// test/algorithmController.test.js
import assert from 'assert';
import sinon from 'sinon';
import algorithmController from '../controllers/algorithmController.js';
import neuronalNetwork from '../models/neuronalNetwork.js';
import User from '../models/user.js';

describe('algorithmController - assignRanges', function () {
  let userFindOneAndUpdateStub;
  let neuronalNetworkActivateStub;

  beforeEach(() => {
    // Crear un stub de la función findOneAndUpdate de User
    userFindOneAndUpdateStub = sinon.stub(User, 'findOneAndUpdate').resolves({
      email: 'test@user.com',
      score: 80
    });

    // Crear un stub de la función activate de neuronalNetwork
    neuronalNetworkActivateStub = sinon.stub(neuronalNetwork, 'activate').returns([0.9]); // Simula un retorno de la red neuronal
  });

  afterEach(() => {
    // Restaurar los stubs después de cada prueba
    sinon.restore();
  });

  it('debería calcular el puntaje correctamente para una jugadora con diferentes características', async () => {
    const params = {
      email: 'test@user.com',
      position: 3,  // Centrocampistas (MC)
      height: 165,
      weight: 55,
      experience: 3,
      criminalRecord: false,
      videoUploaded: false,
      ambidextrous: true,
      dominantFoot: 'left',
      versatility: false
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la jugadora con parámetros ${JSON.stringify(params)}:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });

  it('debería calcular el puntaje correctamente para una jugadora sin experiencia', async () => {
    const params = {
      email: 'test@user.com',
      position: 3,  // Centrocampistas (MC)
      height: 165,
      weight: 55,
      experience: 0,  // Sin experiencia
      criminalRecord: false,
      videoUploaded: false,
      ambidextrous: true,
      dominantFoot: 'left',
      versatility: false
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la jugadora sin experiencia:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });

  it('debería calcular el puntaje correctamente para una jugadora con experiencia y video subido', async () => {
    const params = {
      email: 'test@user.com',
      position: 2,  // Defensora central (DFC)
      height: 170,
      weight: 70,
      experience: 5,  // Alta experiencia
      criminalRecord: false,
      videoUploaded: true,  // Video subido
      ambidextrous: false,
      dominantFoot: 'right',
      versatility: true
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la jugadora con experiencia y video subido:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });

  it('debería calcular el puntaje correctamente para una jugadora con altura y peso fuera del rango', async () => {
    const params = {
      email: 'test@user.com',
      position: 1,  // Defensora central (DFC)
      height: 150,  // Fuera del rango
      weight: 85,  // Fuera del rango
      experience: 2,
      criminalRecord: false,
      videoUploaded: false,
      ambidextrous: true,
      dominantFoot: 'right',
      versatility: true
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la jugadora con altura y peso fuera del rango:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });

  // Nueva prueba para una arquera con poca altura y peso
  it('debería calcular el puntaje correctamente para una arquera con poca altura y peso', async () => {
    const params = {
      email: 'test@user.com',
      position: 0,  // Portera (PO)
      height: 160,  // Poca altura para portera
      weight: 55,   // Poca peso para portera
      experience: 2,
      criminalRecord: false,
      videoUploaded: false,
      ambidextrous: false,
      dominantFoot: 'right',
      versatility: true
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la arquera con poca altura y peso:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });

  // Nueva prueba para una defensa alta
  it('debería calcular el puntaje correctamente para una defensa alta', async () => {
    const params = {
      email: 'test@user.com',
      position: 1,  // Defensora central (DFC)
      height: 185,  // Alta para defensa
      weight: 75,
      experience: 4,
      criminalRecord: false,
      videoUploaded: true,
      ambidextrous: true,
      dominantFoot: 'left',
      versatility: false
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la defensa alta:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });

  // Nueva prueba para una mediocampista con datos normales
  it('debería calcular el puntaje correctamente para una mediocampista con datos normales', async () => {
    const params = {
      email: 'test@user.com',
      position: 3,  // Centrocampistas (MC)
      height: 170,  // Altura normal
      weight: 65,   // Peso normal
      experience: 3, // Experiencia media
      criminalRecord: false,
      videoUploaded: true,  // Video subido
      ambidextrous: false,
      dominantFoot: 'right',
      versatility: true
    };

    const result = await algorithmController.assignRanges(params);

    console.log(`Puntaje para la mediocampista con datos normales:`, result.score);

    assert(result.score >= 0); // Solo verificar que el puntaje es un valor válido
  });
});
