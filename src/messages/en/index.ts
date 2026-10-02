import admin from "./admin.json";
import app from "./app.json";
import assistant from "./assistant.json";
import orders from "./orders.json";

/** One catalog per language, composed from per-module files so each feature owns its strings. */
const messages = { ...app, orders, admin, assistant };
export default messages;
