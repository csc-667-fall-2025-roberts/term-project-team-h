import db from "./db/connection";

db.connect()
  .then(() => console.log("DB connected"))
  .catch((err) => console.error(err))
  .finally(() => process.exit());