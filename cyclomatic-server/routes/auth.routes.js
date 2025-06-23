const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;


const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES = "1h";

// Регистрация
router.post("/register", async (req, res) => {
  try {
    const { login, password } = req.body;

    // проверка занятости login
    if (await User.findOne({ where: { login } })) {
      return res.status(409).json({ error: "Login уже занят" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ login, password: hash });

    const token = jwt.sign({ id: user.id, login: user.login }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES,
    });

    const { password: _, ...userData } = user.toJSON();
    res.status(201).json({ user: userData, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Вход
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.scope(null).findOne({ where: { login } });
    if (!user) {
      return res.status(401).json({ error: "Неверный login или пароль" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Неверный login или пароль" });
    }

    const token = jwt.sign({ id: user.id, login: user.login }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES,
    });

    const { password: _, ...userData } = user.toJSON();
    res.json({ user: userData, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware проверки токена
function authCheck(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Токен не передан" });
  }
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Неверный или просроченный токен" });
  }
}

module.exports = { router, authCheck };
