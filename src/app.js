require('dotenv').config();

const path = require('path');
const express = require('express');
const { initFlags, evaluateFlags, getSdkState } = require('./flags');

function normalize(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function buildContextFromQuery(query = {}) {
  return {
    email: normalize(query.email, 'anonymous@example.com'),
    plan: normalize(query.plan, 'free'),
    region: normalize(query.region, 'unknown')
  };
}

function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.get('/', async (req, res) => {
    await initFlags();

    const context = buildContextFromQuery(req.query);
    const flags = evaluateFlags(context);

    res.render('index', {
      context,
      flags,
      sdkState: getSdkState(),
      repoName: 'goobed/jkomrij-unify-app',
      commitSha: process.env.GITHUB_SHA || 'local-dev'
    });
  });

  app.get('/api/status', async (req, res) => {
    await initFlags();

    const context = buildContextFromQuery(req.query);

    res.json({
      ok: true,
      inputs: context,
      flags: evaluateFlags(context),
      sdk: getSdkState(),
      repo: 'goobed/jkomrij-unify-app',
      commit: process.env.GITHUB_SHA || 'local-dev'
    });
  });

  return app;
}

module.exports = {
  createApp,
  buildContextFromQuery
};
