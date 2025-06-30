const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
  }
);

const db = {
  Sequelize,
  sequelize,
};

const { User, AnalysisHistory } = require("./user.model")(sequelize, DataTypes);

db.User = User;
db.AnalysisHistory = AnalysisHistory;

module.exports = db;
