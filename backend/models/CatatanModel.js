import { Sequelize } from "sequelize";

import db from "../config/database.js";

const {DataTypes} = Sequelize;
const Catatan = db.define(
    "catatan",
    {
        catatan_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true, 
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        judul: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isi_catatan: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    },
    {
        freezeTableName: true
    }
);

export default Catatan;

(async() =>{
    await db.sync();
})();