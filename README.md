# mat-iq

A training app for people who lift to get better at jiu jitsu — not the other way around.

You tell mat-iq when you're on the mats, how many rounds you're rolling, and how hard.
It builds a weightlifting program *around* that schedule: never heavy the day before hard
rolling, volume that backs off when your mat week gets brutal, and grip work pulled when
you need your hands tomorrow. Then it tracks your progression session to session.

## Status

The app is usable on a device: onboard once, keep your mat schedule, and log
both lifts and mat sessions against a program built around them. Nothing syncs
anywhere — it is all on-device — and there is no history or stats view yet.

| Piece | State |
|---|---|
| Routine engine (`packages/engine`) | Done — 58 tests |
| Local persistence (`expo-sqlite`) | Done — schema, migrations, repository, 27 tests |
| Onboarding and Settings | Done — questionnaire once, adjustments in Settings |
| Today screen | Done — the day's lift, mat session, or rest |
| Set logging and rest timer | Done — per-set entry, undo, wall-clock timer |
| Mat session logging | Done — rounds, intensity, gi / no-gi / open mat, notes |
| Progression applied on completion | Not started — `progression.ts` is tested but nothing calls it |
| Calendar history | Not started |
| Stats | Not started |
| Apple Health | Not started |
| Azure API and auth | Not started |
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
- **Session input** — rounds plus light / medium / hard. No RPE scale. Session
  *type* (gi / no-gi / open mat) is captured when logging what happened, but does
  not feed the fatigue model — see Planned vs logged.
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
npm test                      # 85 tests across both packages
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

## Product shape

The app is a daily companion, not a planner you visit occasionally.

**First launch** runs the questionnaire once. After that, every adjustment —
schedule, goals, working weights, units — lives in **Settings**. The
questionnaire never appears again.

**Every subsequent launch opens on Today**, which answers one question: what am
I doing today?

- **Lifting day** → "Today's lift" card with the session's programming. Tapping
  it starts the workout: log each set, rest timer between them, and progression
  applied when the session ends.
- **Mat day** → "Track session". Log what actually happened: intensity, rounds,
  drills or techniques worked, and whether it was gi, no-gi, or an open mat.
- **Rest day** → say so plainly, and show what's next.

**History** is a calendar of completed work — tap any day to see the lift or mat
session logged against it.

**Stats** summarize the training: workouts completed, rounds trained, sets and
total volume moved, and relative strength trend over time.

### Planned vs logged

These are deliberately separate models:

- A **planned** mat session is what the routine engine programs around. It stays
  minimal — day, rounds, intensity — because that is all the fatigue model needs.
- A **logged** mat session is what actually happened, and carries the richer
  detail (gi / no-gi / open mat, drills, notes).

Logging never silently rewrites the plan. It is a record, and later the input
that lets programming adapt to real load rather than intentions.

## Roadmap

Broken into the smallest shippable pieces, in dependency order. Each lands as
its own commit with tests where there is logic to test.

**Done**

1. ~~Local persistence — `expo-sqlite` schema and repository layer~~
2. ~~Onboarding and schedule input — replaced the hard-coded profile~~
3. ~~Engine selector for "what is today" — lift, mat, or rest~~
4. ~~Today screen as the app's home~~
5. ~~Schedule and profile editing moved into Settings; onboarding is first-launch only~~
6. ~~Schema for completed work — workout logs, logged sets, logged mat sessions~~
7. ~~Start-workout flow: per-exercise set entry~~
8. ~~Rest timer between sets~~
10. ~~Mat session logging: rounds, intensity, drills, gi / no-gi / open mat~~

**Next**

9. Apply `progression.ts` when a session completes — the first real use of it.
   Finishing a workout currently records it but does not advance your loads.

**Then: looking back**

11. Calendar history of completed work.
12. Day detail — what was logged on a given date.
13. Stats: workouts completed, rounds trained, sets, total volume.
14. Relative strength trend (load relative to bodyweight over time).

**Later, but high priority**

15. **Apple Health integration.** Treated as essential, not a nice-to-have. Completed
    lifts and mat sessions should write to HealthKit as workouts so they land in the
    rings and in whatever tracker the athlete already lives in. Mat sessions have no
    heart-rate data of their own, so energy burned is *estimated* from rounds,
    intensity, and bodyweight — a grappling round is closer to interval work than to
    steady cardio, and logging nothing at all understates the day badly. Lifts
    estimate from sets, load, and time under tension.

**Later**

16. Curated exercise library — import an open dataset, prune it, add grappling metadata.
17. Azure backend — Python Functions, Postgres, Terraform, Entra External ID.
18. Sync — reconcile the local database with the server.
19. LLM polish layer — once the deterministic programming is proven.

## Open questions

- Should the engine ever schedule a lift on the same day as the week's biggest open mat?
  It currently will, on the hard-days-hard principle. Worth a practitioner's opinion.
- An Apple Developer account is needed before TestFlight or any physical-device build.
- The repo currently deploys into the `SSG-Prod` subscription, the only one available.
