import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  signUp,
  signIn,
  changeState,
  resetPassword,
} from "../controllers/userController.js";
import sinon from "sinon";
import { expect } from "chai";
import User from "../models/user.js";
import nodemailer from "nodemailer"; // Import nodemailer for mocking transporter
import bcrypt from "bcryptjs";

describe("User Controller Tests", () => {
  let transporter;

  // Before each test, mock the transporter and set up necessary stubs
  beforeEach(() => {
    transporter = sinon.stub(nodemailer, "createTransport").returns({
      sendMail: sinon.stub().resolves(), // Mock sendMail to resolve successfully
    });
  });

  // Restore transporter after each test
  afterEach(() => {
    transporter.restore();
    sinon.restore(); // Ensure all stubs are restored properly
  });

  describe("signUp", () => {
    it("should return error if the email is already registered", async () => {
      const existingUser = { email: "juan@example.com" };

      sinon.stub(User, "findOne").resolves(existingUser);

      const req = { body: { email: "juan@example.com" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await signUp(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 400);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "El correo ya está registrado.",
      });

      User.findOne.restore();
    });
  });

  describe("User Controller - signIn", () => {
    afterEach(() => {
      // Restaurar los stubs después de cada prueba
      sinon.restore();
    });

    it("should return 401 if user is not found", async () => {
      sinon.stub(User, "findOne").resolves(null); // No se encuentra al usuario

      const req = { body: { email: "juan@example.com", password: "password" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await signIn(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 401);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Email o contraseña inválidos.",
      });
    });

    it("should return 401 if email is not verified", async () => {
      const mockUser = {
        email: "juan@example.com",
        password: "hashedpassword",
        isVerified: false,
      };

      sinon.stub(User, "findOne").resolves(mockUser); // Usuario encontrado, pero no verificado

      const req = { body: { email: "juan@example.com", password: "password" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await signIn(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 401);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Tu correo no ha sido verificado.",
      });
    });

    it("should return user data if email and password are correct", async () => {
      const mockUser = {
        email: "juan@example.com",
        password: bcrypt.hashSync("password", 10),
        isVerified: true,
      };

      // Simulamos que la contraseña coincide
      sinon.stub(User, "findOne").resolves(mockUser);
      const bcryptCompareStub = sinon.stub(bcrypt, "compareSync").returns(true); // La contraseña coincide

      const req = { body: { email: "juan@example.com", password: "password" } };
      const res = { send: sinon.stub() };

      await signIn(req, res);

      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, mockUser);
      sinon.assert.calledOnce(bcryptCompareStub); // Verifica que compareSync fue llamado

      bcryptCompareStub.restore();
    });

    it("should return 401 if password is incorrect", async () => {
      const mockUser = {
        email: "juan@example.com",
        password: bcrypt.hashSync("correctpassword", 10),
        isVerified: true,
      };

      // Simulamos que la contraseña no coincide
      sinon.stub(User, "findOne").resolves(mockUser);
      const bcryptCompareStub = sinon
        .stub(bcrypt, "compareSync")
        .returns(false); // La contraseña no coincide

      const req = {
        body: { email: "juan@example.com", password: "wrongpassword" },
      };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await signIn(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 401);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Email o contraseña inválidos.",
      });

      sinon.assert.calledOnce(bcryptCompareStub); // Verifica que compareSync fue llamado

      bcryptCompareStub.restore();
    });

    it("should handle server errors", async () => {
      sinon.stub(User, "findOne").rejects(new Error("Database error")); // Simula un error de base de datos

      const req = { body: { email: "juan@example.com", password: "password" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await signIn(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Error del servidor.",
        error: sinon.match.instanceOf(Error),
      });
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { _id: "1", name: "Juan", email: "juan@example.com" },
        { _id: "2", name: "Maria", email: "maria@example.com" },
      ];

      sinon.stub(User, "find").resolves(mockUsers);

      const req = {};
      const res = { send: sinon.stub() };

      await getAllUsers(req, res);

      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, mockUsers);

      User.find.restore();
    });

    it("should handle error when users not found", async () => {
      sinon.stub(User, "find").rejects(new Error("Database error"));

      const req = {};
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      await getAllUsers(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, {
        message: "Error al obtener los usuarios",
        error: sinon.match.instanceOf(Error),
      });

      User.find.restore();
    });
  });

  describe("getUserById", () => {
    it("should return a user by ID", async () => {
      const mockUser = { _id: "1", name: "Juan", email: "juan@example.com" };

      sinon.stub(User, "findById").resolves(mockUser);

      const req = { params: { id: "1" } };
      const res = { json: sinon.stub() };

      await getUserById(req, res);

      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, mockUser);

      User.findById.restore();
    });

    it("should return 404 if user not found", async () => {
      sinon.stub(User, "findById").resolves(null);

      const req = { params: { id: "1" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      await getUserById(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 404);
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, { message: "Usuario no encontrado" });

      User.findById.restore();
    });

    it("should handle error when getting user by ID", async () => {
      sinon.stub(User, "findById").rejects(new Error("Database error"));

      const req = { params: { id: "1" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      await getUserById(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, {
        message: "Error al obtener el usuario",
        error: sinon.match.instanceOf(Error),
      });

      User.findById.restore();
    });
  });

  describe("updateUser", () => {
    it("should update user details", async () => {
      const mockUpdatedUser = { n: 1, nModified: 1, ok: 1 };

      sinon.stub(User, "updateOne").resolves(mockUpdatedUser);

      const req = { body: { email: "juan@example.com", name: "Juan Updated" } };
      const res = { send: sinon.stub() };

      await updateUser(req, res);

      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, mockUpdatedUser);

      User.updateOne.restore();
    });

    it("should handle error during user update", async () => {
      sinon.stub(User, "updateOne").rejects(new Error("Database error"));

      const req = { body: { email: "juan@example.com", name: "Juan Updated" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await updateUser(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Error al actualizar el usuario.",
        error: sinon.match.instanceOf(Error),
      });

      User.updateOne.restore();
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      const mockDeleteResult = { deletedCount: 1 };

      sinon.stub(User, "deleteOne").resolves(mockDeleteResult);

      const req = { body: { email: "juan@example.com" } };
      const res = { send: sinon.stub() };

      await deleteUser(req, res);

      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        success: true,
        message: "Usuario eliminado",
        data: mockDeleteResult,
      });

      User.deleteOne.restore();
    });

    it("should handle error during user deletion", async () => {
      sinon.stub(User, "deleteOne").rejects(new Error("Database error"));

      const req = { body: { email: "juan@example.com" } };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      await deleteUser(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Error al eliminar el usuario.",
        error: sinon.match.instanceOf(Error),
      });

      User.deleteOne.restore();
    });
  });
});

describe("User Controller - resetPassword and changeState", () => {
  let transporter;

  beforeEach(() => {
    // Mock de transporter de nodemailer
    transporter = sinon.stub(nodemailer, "createTransport").returns({
      sendMail: sinon.stub().resolves(), // Simula que el envío de correo es exitoso
    });
  });

  afterEach(() => {
    sinon.restore(); // Restaurar todos los stubs después de cada prueba
  });

  describe("resetPassword", () => {
    it("should return 400 if token is invalid or expired", async () => {
      const req = {
        body: { token: "invalidToken", newPassword: "newPassword123" },
      };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(User, "findOne").resolves(null); // Simula que no se encuentra el usuario con ese token

      await resetPassword(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 400);
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, {
        message: "Token inválido o ha expirado.",
      });

      User.findOne.restore();
    });

    it("should reset password successfully if token is valid", async () => {
      const mockUser = {
        _id: "1",
        email: "juan@example.com",
        resetPasswordToken: "validToken",
        resetPasswordExpires: Date.now() + 3600000,
        save: sinon.stub().resolves(),
      };

      sinon.stub(User, "findOne").resolves(mockUser);

      const req = { body: { token: "validToken", newPassword: "newPassword" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() }; // Cambié send por json

      await resetPassword(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 200);
      sinon.assert.calledOnce(res.json); // Cambié send por json
      sinon.assert.calledWith(res.json, {
        message: "Tu contraseña ha sido restablecida exitosamente.",
      });

      User.findOne.restore();
    });

    it("should handle server errors", async () => {
      const req = {
        body: { token: "validToken", newPassword: "newPassword123" },
      };
      const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

      sinon.stub(User, "findOne").rejects(new Error("Database error"));

      await resetPassword(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.send);
      sinon.assert.calledWith(res.send, {
        message: "Error al restablecer la contraseña.",
        error: sinon.match.instanceOf(Error),
      });

      User.findOne.restore();
    });
  });

  describe("changeState", () => {
    it("should return 404 if user is not found", async () => {
      const req = { body: { email: "juan@example.com", state: "active" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(User, "findOne").resolves(null); // Simula que no se encuentra el usuario

      await changeState(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 404);
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, { message: "Usuario no encontrado" });

      User.findOne.restore();
    });

    it("should handle errors during state change", async () => {
      const req = { body: { email: "juan@example.com", state: "active" } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(User, "findOne").resolves({ email: "juan@example.com" });
      sinon.stub(User, "updateOne").rejects(new Error("Database error")); // Simula un error al actualizar el estado

      await changeState(req, res);

      sinon.assert.calledOnce(res.status);
      sinon.assert.calledWith(res.status, 500);
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWith(res.json, {
        message: "Error al cambiar el estado.",
        error: sinon.match.instanceOf(Error),
      });

      User.findOne.restore();
      User.updateOne.restore();
    });
  });
});
