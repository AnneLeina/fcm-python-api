/**
 * manage-topics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Cloud Messaging — Topic Management CLI
 *
 * Companion script to the FCM Python API (app.py).
 * Handles subscribing/unsubscribing device tokens to FCM topics and sending
 * topic-targeted notifications — operations not covered by the Flask endpoint.
 *
 * Usage:
 *   node manage-topics.js <command> [options]
 *
 * Commands:
 *   subscribe     Subscribe one or more tokens to a topic
 *   unsubscribe   Unsubscribe one or more tokens from a topic
 *   list          List tokens registered to a topic (placeholder — FCM has no list API)
 *   send-topic    Send a notification to all subscribers of a topic
 *
 * Examples:
 *   node manage-topics.js subscribe   --topic news   --tokens TOKEN_A TOKEN_B
 *   node manage-topics.js unsubscribe --topic news   --tokens TOKEN_A
 *   node manage-topics.js send-topic  --topic news   --title "Breaking" --body "Story here"
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const admin = require("firebase-admin");
const path  = require("path");
const fs    = require("fs");

// ─── Configuration ────────────────────────────────────────────────────────────

const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, "serviceAccountKey.json");

// ─── Firebase Initialisation ──────────────────────────────────────────────────

function initFirebase() {
  if (admin.apps.length > 0) return; // already initialised

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(
      `[ERROR] Service account key not found at: ${SERVICE_ACCOUNT_PATH}\n` +
      `        Download it from Firebase Console → Project Settings → Service Accounts\n` +
      `        or set the GOOGLE_APPLICATION_CREDENTIALS environment variable.`
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log(`[Firebase] Initialised project: ${serviceAccount.project_id}\n`);
}

// ─── Topic Operations ─────────────────────────────────────────────────────────

/**
 * Subscribe an array of device tokens to a topic.
 * FCM processes up to 1 000 tokens per call; this function batches automatically.
 *
 * @param {string[]} tokens  - FCM registration tokens
 * @param {string}   topic   - Topic name (no leading slash)
 * @returns {Promise<void>}
 */
async function subscribeTokens(tokens, topic) {
  validateTokens(tokens);
  validateTopic(topic);

  console.log(`[Subscribe] Topic: "${topic}" | Tokens: ${tokens.length}`);

  const batches = chunkArray(tokens, 1000);
  let totalSuccess = 0;
  let totalFail    = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} tokens)…`);

    try {
      const result = await admin.messaging().subscribeToTopic(batch, topic);
      totalSuccess += result.successCount;
      totalFail    += result.failureCount;

      if (result.errors.length > 0) {
        result.errors.forEach(({ index, error }) => {
          console.warn(`  [WARN] Token[${index}] — ${error.code}: ${error.message}`);
        });
      }
    } catch (err) {
      console.error(`  [ERROR] Batch ${i + 1} failed: ${err.message}`);
    }
  }

  console.log(`\n[Subscribe] Done — Success: ${totalSuccess} | Failed: ${totalFail}`);
}

/**
 * Unsubscribe an array of device tokens from a topic.
 *
 * @param {string[]} tokens  - FCM registration tokens
 * @param {string}   topic   - Topic name
 * @returns {Promise<void>}
 */
async function unsubscribeTokens(tokens, topic) {
  validateTokens(tokens);
  validateTopic(topic);

  console.log(`[Unsubscribe] Topic: "${topic}" | Tokens: ${tokens.length}`);

  const batches = chunkArray(tokens, 1000);
  let totalSuccess = 0;
  let totalFail    = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length} (${batch.length} tokens)…`);

    try {
      const result = await admin.messaging().unsubscribeFromTopic(batch, topic);
      totalSuccess += result.successCount;
      totalFail    += result.failureCount;

      if (result.errors.length > 0) {
        result.errors.forEach(({ index, error }) => {
          console.warn(`  [WARN] Token[${index}] — ${error.code}: ${error.message}`);
        });
      }
    } catch (err) {
      console.error(`  [ERROR] Batch ${i + 1} failed: ${err.message}`);
    }
  }

  console.log(`\n[Unsubscribe] Done — Success: ${totalSuccess} | Failed: ${totalFail}`);
}

/**
 * Send a notification to all devices subscribed to a topic.
 *
 * @param {string} topic   - Target topic name
 * @param {string} title   - Notification title
 * @param {string} body    - Notification body
 * @param {Object} [data]  - Optional key-value data payload
 * @returns {Promise<void>}
 */
async function sendToTopic(topic, title, body, data = {}) {
  validateTopic(topic);

  if (!title || !body) {
    console.error("[ERROR] Both --title and --body are required for send-topic.");
    process.exit(1);
  }

  console.log(`[Send] Topic: "${topic}" | Title: "${title}"`);

  const message = {
    notification: { title, body },
    topic,
    ...(Object.keys(data).length > 0 && { data }),
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[Send] Success — Message ID: ${response}`);
  } catch (err) {
    console.error(`[Send] Failed — ${err.code || err.message}`);
    if (err.errorInfo) {
      console.error(`       ${err.errorInfo.code}: ${err.errorInfo.message}`);
    }
    process.exit(1);
  }
}

/**
 * Placeholder for listing topic subscribers.
 * The FCM HTTP API does not expose a list-subscribers endpoint.
 * This function documents that limitation clearly.
 *
 * @param {string} topic - Topic name
 */
function listTopicInfo(topic) {
  validateTopic(topic);
  console.log(
    `[List] Topic: "${topic}"\n` +
    `\n` +
    `  Firebase Cloud Messaging does not provide a public API to enumerate\n` +
    `  the tokens subscribed to a topic. To track subscribers you must\n` +
    `  maintain your own token-to-topic mapping in a database (e.g. Firestore)\n` +
    `  and update it whenever subscribe/unsubscribe operations are performed.\n`
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function validateTokens(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.error("[ERROR] At least one --tokens value is required.");
    process.exit(1);
  }
}

function validateTopic(topic) {
  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    console.error("[ERROR] --topic is required and must be a non-empty string.");
    process.exit(1);
  }
  // FCM topic names: letters, numbers, hyphens, underscores, periods, tildes, %
  if (!/^[a-zA-Z0-9\-_.~%]+$/.test(topic)) {
    console.error(
      `[ERROR] Invalid topic name: "${topic}"\n` +
      `        Allowed characters: letters, numbers, - _ . ~ %`
    );
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
FCM Topic Manager — manage-topics.js
═══════════════════════════════════════════════════════════════

USAGE
  node manage-topics.js <command> [options]

COMMANDS
  subscribe     Subscribe device tokens to a topic
  unsubscribe   Unsubscribe device tokens from a topic
  list          Show topic subscriber information
  send-topic    Send a push notification to a topic

OPTIONS
  --topic   <name>          FCM topic name (required for all commands)
  --tokens  <t1> [t2 …]    Device registration tokens (subscribe / unsubscribe)
  --title   <text>          Notification title (send-topic)
  --body    <text>          Notification body  (send-topic)
  --data    <key=value …>   Optional data payload key-value pairs (send-topic)

EXAMPLES
  node manage-topics.js subscribe \\
    --topic breaking-news \\
    --tokens eFH3k... xPq9r...

  node manage-topics.js unsubscribe \\
    --topic breaking-news \\
    --tokens eFH3k...

  node manage-topics.js send-topic \\
    --topic breaking-news \\
    --title "New Article" \\
    --body  "Check out the latest story" \\
    --data  category=news priority=high

ENVIRONMENT
  GOOGLE_APPLICATION_CREDENTIALS   Path to serviceAccountKey.json
                                    (default: ./serviceAccountKey.json)
`);
}

// ─── CLI Argument Parser ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const args   = argv.slice(2); // strip "node" and script path
  const result = { command: null, topic: null, tokens: [], title: null, body: null, data: {} };

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return result;
  }

  result.command = args[0];

  let i = 1;
  while (i < args.length) {
    const flag = args[i];

    if (flag === "--topic" && args[i + 1]) {
      result.topic = args[++i];

    } else if (flag === "--tokens") {
      i++;
      while (i < args.length && !args[i].startsWith("--")) {
        result.tokens.push(args[i++]);
      }
      continue; // i already advanced

    } else if (flag === "--title" && args[i + 1]) {
      result.title = args[++i];

    } else if (flag === "--body" && args[i + 1]) {
      result.body = args[++i];

    } else if (flag === "--data") {
      i++;
      while (i < args.length && !args[i].startsWith("--")) {
        const [key, ...rest] = args[i].split("=");
        if (key && rest.length > 0) {
          result.data[key] = rest.join("=");
        }
        i++;
      }
      continue;
    }

    i++;
  }

  return result;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  const { command, topic, tokens, title, body, data } = parseArgs(process.argv);

  if (!command) {
    printHelp();
    process.exit(0);
  }

  initFirebase();

  switch (command) {
    case "subscribe":
      await subscribeTokens(tokens, topic);
      break;

    case "unsubscribe":
      await unsubscribeTokens(tokens, topic);
      break;

    case "list":
      listTopicInfo(topic);
      break;

    case "send-topic":
      await sendToTopic(topic, title, body, data);
      break;

    default:
      console.error(`[ERROR] Unknown command: "${command}"\n`);
      printHelp();
      process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`[FATAL] ${err.message}`);
  process.exit(1);
});
