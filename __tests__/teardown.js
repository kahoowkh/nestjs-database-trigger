// eslint-disable-next-line @typescript-eslint/no-var-requires
const setup = require("./setup");
module.exports = async function () {
  if (process.env.CI) return;
  await Promise.all(setup.killers.map(async (kill) => await kill()));
};
