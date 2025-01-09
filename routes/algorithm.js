// algorithm.js
import express from "express";
import algorithmController from "../controllers/algorithmController.js";
import User from "../models/user.js";

const algorithm = express.Router();

// Ruta para asignar rangos y evaluar los atributos de la jugadora
algorithm.post("/assign-ranges", async (req, res) => {
  try {
    const result = await algorithmController.assignRanges(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error al calcular el score");
  }
});

// Ruta para obtener recomendaciones basadas en el puntaje y la posición
algorithm.get("/recommendation/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId); // Obtener usuario desde la base de datos
    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }
    const recommendations = await algorithmController.getRecommendations(user);
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error al obtener la recomendación");
  }
});

export default algorithm;
