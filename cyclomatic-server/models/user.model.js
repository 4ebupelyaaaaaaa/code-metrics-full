module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      login: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      defaultScope: { attributes: { exclude: ["password"] } },
      tableName: "Users",
      timestamps: true,
    }
  );

  const AnalysisHistory = sequelize.define(
    "AnalysisHistory",
    {
      analysis_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      analysis_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      project_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      report_pdf: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "analysis_histories",
      underscored: true,
      timestamps: false,
    }
  );

  User.hasMany(AnalysisHistory, { foreignKey: "user_id", as: "history" });
  AnalysisHistory.belongsTo(User, { foreignKey: "user_id", as: "user" });

  return { User, AnalysisHistory };
};
