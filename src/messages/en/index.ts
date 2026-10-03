import admin from "./admin.json";
import app from "./app.json";
import assistant from "./assistant.json";
import careers from "./careers.json";
import orders from "./orders.json";

/** One catalog per language, composed from per-module files so each feature owns its strings. */
const messages = { ...app, orders, admin, assistant, careers };
export default messages;
