// eslint-disable-next-line @typescript-eslint/no-var-requires
const getDatabase = require("@databases/pg-test");

exports.killers = [];
module.exports = async () => {
  const { databaseURL, kill } = await getDatabase.default({
    image: "postgres:13",
  });
  process.env.DATABASE_URL = databaseURL;

  exports.killers.push(async () => {
    await kill();
  });
};

module.exports.killers = exports.killers;
