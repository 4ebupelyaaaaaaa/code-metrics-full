// routes/history.routes.js
const express = require("express");
const { User, AnalysisHistory } = require("../models");

const router = express.Router();

// GET  /users/:userId/history
router.get("/:userId", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const history = await AnalysisHistory.findAll({
      where: { user_id: userId },
      order: [["analysis_date", "DESC"]],
      include: [{ model: User, as: "user", attributes: ["id", "login"] }],
    });

    res.json(history);
  } catch (err) {
    next(err);
  }
});

// POST /users/:userId/history
// Body JSON:
// {
//   "project_name": "...",
//   "analysis_date": "2025-05-21T11:00:00.000Z",
//   "report_pdf": "https://example.com/report.pdf"
// }
router.post("/:userId", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const { project_name, analysis_date, report_pdf } = req.body;

    if (!project_name || !analysis_date || !report_pdf) {
      return res.status(400).json({
        error: "project_name, analysis_date и report_pdf обязательны",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const newRecord = await AnalysisHistory.create({
      user_id: userId,
      project_name,
      analysis_date: new Date(analysis_date),
      report_pdf,
    });

    res.status(201).json(newRecord);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
