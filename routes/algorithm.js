// algorithm.js
import express from "express";
import algorithmController from "../controllers/algorithmController.js";

const algorithm = express.Router();

// Ruta para asignar rangos y evaluar los atributos de la jugadora
algorithm.post("/assign-ranges", async (req, res) => {
  try {
    console.log(req.body);
    
    const result = await algorithmController.assignRanges(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error al calcular el score");
  }
});

export default algorithm;
