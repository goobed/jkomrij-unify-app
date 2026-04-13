# jkomrij-unify-app

A very small CloudBees Unify playground app.

This starter gives you two useful learning paths in one repository:

1. **GitHub App + GitHub Actions + CloudBees Unify**
   - Push to the repo and watch the workflow run.
   - Create a CloudBees Unify component that points at this repository.
   - See workflow runs appear in CloudBees Unify.

2. **Feature management**
   - Start the app locally.
   - Add your CloudBees server-side SDK key.
   - Change feature flags in CloudBees Unify and watch the page behavior change.

## What the app does

The app is intentionally simple.

- It serves a single page.
- It reads three request context values from the URL query string:
  - `email`
  - `plan`
  - `region`
- It evaluates four feature flags:
  - `showExcitedGreeting`
  - `showDebugPanel`
  - `greetingColor`
  - `releaseMessage`

Example URL:

```bash
http://localhost:3000/?email=jade@example.com&plan=pro&region=us
```

## Local setup

### 1) Add the files to your repo

Copy this starter into your `goobed/jkomrij-unify-app` repository.

### 2) Install dependencies

```bash
npm install
```

### 3) Create your environment file

```bash
cp .env.example .env
```

### 4) Add your CloudBees server-side SDK key

Edit `.env` and set:

```bash
CLOUDBEES_ROX_SERVER_KEY=your_server_side_sdk_key_here
```

If you leave the key empty, the app still runs using the default values defined in code.

### 5) Start the app

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000/?email=jade@example.com&plan=pro&region=us
```

## How to use this with CloudBees Unify

### GitHub Actions side

1. Make sure the **CloudBees GitHub App** is installed for this repository.
2. Confirm the CloudBees GitHub App installation includes the permissions CloudBees documents for GHA integration.
3. Push this code to `main`, or manually trigger the workflow with **workflow_dispatch**.
4. In CloudBees Unify, create a **component** using this connected repository.
5. After integration is complete, new GitHub Actions runs from this repo should appear in CloudBees Unify.

### Feature flag side

1. In CloudBees Unify, go to Feature Management and get the **Node.js server-side SDK key** for your environment.
2. Put that key in `.env` as `CLOUDBEES_ROX_SERVER_KEY`.
3. Run the app locally.
4. Once the app connects, the flags defined in `src/flags.js` are available in the UI.
5. The custom properties used here are:
   - `email`
   - `plan`
   - `region`
   - `environment`

Because the app passes request context into flag evaluation, you can test targeting rules by changing the URL query string.

## Good first experiments

### Toggle a boolean flag

Set `showExcitedGreeting` to `true` and refresh the page.

### Change a string flag

Change `greetingColor` from `slate` to `emerald`, `amber`, or `rose`.

### Try targeting

Create a rule so `releaseMessage = Pilot enabled` only when:

- `plan == pro`
- or `region == us`

Then compare these URLs:

```bash
http://localhost:3000/?email=a@example.com&plan=free&region=eu
http://localhost:3000/?email=b@example.com&plan=pro&region=us
```

## Project structure

```text
.
├── .github/workflows/unify-playground.yml
├── .env.example
├── __tests__/app.test.js
├── src/app.js
├── src/flags.js
├── src/server.js
├── views/index.ejs
├── jest.config.js
└── package.json
```

## Notes

- The GitHub Actions workflow intentionally keeps the job ID as `test` and does **not** add a `name:` field to the job itself.
- The app is designed to be useful even before you add a real SDK key.
- The `/api/status` endpoint is handy for checking exactly which context values and flag values are being used.
