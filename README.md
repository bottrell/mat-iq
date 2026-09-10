# mat-iq

A training app for people who lift to get better at jiu jitsu — not the other way around.

You tell mat-iq when you're on the mats, how many rounds you're rolling, and how hard.
It builds a weightlifting program *around* that schedule: never heavy the day before hard
rolling, volume that backs off when your mat week gets brutal, and grip work pulled when
you need your hands tomorrow. Then it tracks your progression session to session.

## Status

Early. The domain engine works and is tested; the app renders a generated week on the
iOS Simulator. There is no persistence, no onboarding, and no backend yet.

| Piece | State |
|---|---|
| Routine engine (`packages/engine`) | Working, 43 tests |
| Expo app (`app/`) | Renders a generated week from hard-coded inputs |
| Local persistence | Not started |
| Onboarding / schedule input | Not started |
| Set logging + rest timers | Not started |
| Azure API + auth | Not started |
| Terraform (`iac/`) | Dev remote-state backend only |

## How it works

The engine turns a mat schedule into a lifting program in four steps:

1. **Fatigue** — each session scores as `attendance cost + rounds × intensity`.
   Six hard rounds ≈ 10.5; six medium ≈ 6.4.
2. **Frequency** — weekly fatigue and experience level decide how many lifting days
   you can actually absorb. A heavy mat week gets two, not four.
3. **Placement** — which weekdays. The one inviolable rule: never lift the day before
   hard rolling. Doubling up on a mat day is fine and often preferred — hard days hard,
   easy days easy.
4. **Programming** — split, exercise selection, rep ranges, and starting loads derived
   from your onboarding baselines. Carries are programmed in yards, holds and intervals
   in seconds, everything else in reps.

Progression is **double progression**: work up within the rep range, and only when every
set hits the top does the weight go up. Two sets under the floor triggers a 10% deload.
This is deliberate — it degrades gracefully. A bad session after a hard open mat just
means you hold the load another week, instead of failing a percentage of a max you
tested when fresh.

## v1 scope

Decisions already made. These narrow the design space on purpose:

- **Platforms** — iOS and Android via Expo. No web.
- **Goals** — strength for grappling, and gas tank / conditioning. That's it.
- **Session input** — rounds plus light / medium / hard. No RPE scale.
- **Progression** — double progression. No 1RM testing, no percentage-based prescription.
- **Routine generation** — deterministic rules engine, no LLM. An LLM polish layer
  (naming, accessory variation, coaching notes) is deferred until the programming
  itself is proven.
- **Engine runs on-device** in TypeScript, so generating a routine works with no signal.
  The server is CRUD, sync, and auth only.
- **Offline** — logging sets and reading the current routine must work with no
  connection. Everything else may require one.
- **Units** — pounds by default, kilograms available.

## Architecture

```
app/                 Expo app (SDK 57, RN 0.86, React 19)
packages/engine/     Routine generation — pure TypeScript, no RN dependency
iac/                 Terraform, Azure
```

All server-hosted components run in **Azure**: Python Azure Functions over PostgreSQL
Flexible Server, with Microsoft Entra External ID for identity. Region `eastus2`.

The engine is a standalone package with no React Native imports, so it runs under plain
`node`, is unit-tested in isolation, and ships inside the app bundle.

## Getting started

Requires Node and, for iOS, Xcode with a simulator runtime.

```bash
npm install
npm test                      # 43 engine tests
node packages/engine/demo.ts  # print a generated week in the terminal
```

### Running the app

```bash
cd app && npx expo start
```

Then press `i`, or open it manually if that fails — see below.

> **Simulator gotcha.** `npx expo start --ios` often fails with `simctl openurl` timing
> out (`NSPOSIXErrorDomain code 60`) even when Expo Go is installed. Launch Expo Go
> first, then hand it the URL:
>
> ```bash
> xcrun simctl boot "iPhone 17 Pro"
> xcrun simctl launch booted host.exp.Exponent
> sleep 15
> xcrun simctl openurl booted "exp://127.0.0.1:8081"
> ```

## Roadmap

Roughly in dependency order:

1. **Local persistence** — `expo-sqlite` schema and a repository layer. Everything
   below is blocked on this.
2. **Onboarding and schedule input** — replace the hard-coded profile and mat week.
3. **Set logging and rest timers** — the in-gym experience. This is what finally puts
   `progression.ts` to work; today nothing calls it.
4. **Curated exercise library** — import an open dataset, prune it, add grappling-specific
   metadata. Replaces the 30-exercise starter set.
5. **Azure backend** — Python Functions, Postgres, Terraform, Entra External ID.
6. **Sync** — reconcile the local database with the server.
7. **LLM polish layer** — once the deterministic programming is proven.

## Open questions

- Should the engine ever schedule a lift on the same day as the week's biggest open mat?
  It currently will, on the hard-days-hard principle. Worth a practitioner's opinion.
- An Apple Developer account is needed before TestFlight or any physical-device build.
- The repo currently deploys into the `SSG-Prod` subscription, the only one available.
