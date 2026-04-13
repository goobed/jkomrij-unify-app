const Rox = require('rox-node');

const PlaygroundFlags = {
  showExcitedGreeting: new Rox.Flag(false),
  showDebugPanel: new Rox.Flag(true),
  greetingColor: new Rox.RoxString('slate', ['emerald', 'amber', 'rose']),
  releaseMessage: new Rox.RoxString('Learning mode', [
    'Learning mode',
    'Trying a new experience',
    'Pilot enabled'
  ])
};

let initPromise;
let sdkState = {
  initialized: false,
  mode: 'local-defaults',
  error: null
};

async function initFlags() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    Rox.register('UnifyPlayground', PlaygroundFlags);

    Rox.setContext({
      appName: 'jkomrij-unify-app',
      runtime: 'node',
      repo: 'goobed/jkomrij-unify-app'
    });

    Rox.setCustomStringProperty('email', (context) => context?.email || 'anonymous@example.com');
    Rox.setCustomStringProperty('plan', (context) => context?.plan || 'free');
    Rox.setCustomStringProperty('region', (context) => context?.region || 'unknown');
    Rox.setCustomStringProperty('environment', process.env.APP_ENV || 'local');

    const sdkKey = process.env.CLOUDBEES_ROX_SERVER_KEY;

    if (!sdkKey) {
      sdkState = {
        initialized: true,
        mode: 'local-defaults',
        error: 'No CLOUDBEES_ROX_SERVER_KEY set. Using code defaults.'
      };
      return sdkState;
    }

    try {
      await Rox.setup(sdkKey);
      sdkState = {
        initialized: true,
        mode: 'cloudbees',
        error: null
      };
    } catch (error) {
      sdkState = {
        initialized: true,
        mode: 'local-defaults',
        error: `CloudBees SDK setup failed. Using code defaults. ${error.message}`
      };
    }

    return sdkState;
  })();

  return initPromise;
}

function evaluateFlags(context) {
  return {
    showExcitedGreeting: PlaygroundFlags.showExcitedGreeting.isEnabled(context),
    showDebugPanel: PlaygroundFlags.showDebugPanel.isEnabled(context),
    greetingColor: PlaygroundFlags.greetingColor.getValue(context),
    releaseMessage: PlaygroundFlags.releaseMessage.getValue(context)
  };
}

function getSdkState() {
  return { ...sdkState };
}

module.exports = {
  initFlags,
  evaluateFlags,
  getSdkState
};
