// Edgegap lifecycle for one deployment = one match.
//
// On Edgegap (ARBITRIUM_REQUEST_ID is set) the server stops its own deployment when:
//   - nobody joined within FIRST_JOIN_TIMEOUT_S of boot,
//   - every player left and nobody came back within EMPTY_TIMEOUT_S,
//   - or the match ended (MATCH_ROUNDS rounds won, see BattleRoom).
// Self-stop calls DELETE $ARBITRIUM_DELETE_URL with $ARBITRIUM_DELETE_TOKEN; billing stops with it.
// Off Edgegap (local dev) none of this runs and the server behaves like upstream.

const env = process.env;

export const onEdgegap = !!env.ARBITRIUM_REQUEST_ID;

const FIRST_JOIN_TIMEOUT_S = num(env.FIRST_JOIN_TIMEOUT_S, 120);
const EMPTY_TIMEOUT_S = num(env.EMPTY_TIMEOUT_S, 30);

/** Rounds to play before the server ends the match. 0 = endless arena (default). */
export const MATCH_ROUNDS = num(env.MATCH_ROUNDS, 0);

let players = 0;
let joinedOnce = false;
let emptyTimer: NodeJS.Timeout | null = null;
let stopping = false;

export function startLifecycle() {
  if (!onEdgegap) return;
  log(
    `deployment ${env.ARBITRIUM_REQUEST_ID} ` +
      `(${env.ARBITRIUM_PUBLIC_IP ?? "?"}, ${env.ARBITRIUM_HOST_ID ?? "?"}) ` +
      `match=${env.MM_MATCH_ID ?? "direct"} tickets=${env.MM_TICKET_IDS ?? "[]"} rounds=${MATCH_ROUNDS || "endless"}`
  );
  emptyTimer = setTimeout(() => {
    if (!joinedOnce) selfStop(`nobody joined within ${FIRST_JOIN_TIMEOUT_S}s`);
  }, FIRST_JOIN_TIMEOUT_S * 1000);
}

export function playerJoined() {
  players++;
  joinedOnce = true;
  if (emptyTimer) clearTimeout(emptyTimer);
  emptyTimer = null;
}

export function playerLeft() {
  players = Math.max(0, players - 1);
  if (!onEdgegap || players > 0) return;
  if (emptyTimer) clearTimeout(emptyTimer);
  emptyTimer = setTimeout(() => {
    if (players === 0) selfStop(`empty for ${EMPTY_TIMEOUT_S}s`);
  }, EMPTY_TIMEOUT_S * 1000);
}

export async function selfStop(reason: string) {
  if (!onEdgegap || stopping) return;
  stopping = true;
  log(`self-stop: ${reason}`);
  const url = env.ARBITRIUM_DELETE_URL;
  const token = env.ARBITRIUM_DELETE_TOKEN;
  if (!url || !token) {
    log("ARBITRIUM_DELETE_URL/TOKEN missing, exiting instead");
    process.exit(0);
  }
  try {
    const res = await fetch(url, { method: "DELETE", headers: { authorization: token } });
    log(`self-stop request: HTTP ${res.status}`);
    if (!res.ok) process.exit(0); // with restart policy Never, exiting also ends the deployment
  } catch (err) {
    log(`self-stop request failed: ${err}`);
    process.exit(0);
  }
  // Edgegap now sends SIGTERM; Colyseus disconnects the rooms and exits.
}

function num(v: string | undefined, fallback: number) {
  const n = v === undefined || v === "" ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function log(msg: string) {
  console.log(`[edgegap] ${msg}`);
}
