const { createApp } = require('./app');
const { initFlags, getSdkState } = require('./flags');

async function start() {
  await initFlags();

  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  app.listen(port, () => {
    const sdkState = getSdkState();
    console.log(`jkomrij-unify-app listening on http://localhost:${port}`);
    console.log(`CloudBees mode: ${sdkState.mode}`);
    if (sdkState.error) {
      console.log(sdkState.error);
    }
  });
}

start().catch((error) => {
  console.error('Failed to start application.', error);
  process.exit(1);
});
