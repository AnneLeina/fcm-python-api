/**
 * ============================================================
 * FILE: src/manage-topics.js
 * PURPOSE: Subscribe devices to a topic and broadcast to all
 * COMMAND: node src/manage-topics.js
 * ============================================================
 *
 * Topics = pub/sub for FCM.
 * Subscribe once → send one message → all subscribers receive it.
 * No need to maintain a token list.
 * Ideal for: news alerts, sports scores, promotional campaigns.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path  = require('path');

if (!admin.apps.length) {
  const serviceAccount = require(path.resolve(__dirname, '..', 'serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const DEVICE_TOKEN = process.env.FCM_TEST_TOKEN;
const TOPIC_NAME   = 'breaking-news'; // Choose any topic name (letters, digits, hyphens, underscores)

async function manageTopics() {
  if (!DEVICE_TOKEN) {
    console.error('❌  FCM_TEST_TOKEN not set in .env');
    process.exit(1);
  }

  // ── 1. Subscribe the device token to the topic ──────────────────────────
  console.log(\n📌  Subscribing device to topic: "${TOPIC_NAME}"...);
  const subResponse = await admin.messaging().subscribeToTopic([DEVICE_TOKEN], TOPIC_NAME);
  console.log(`    ✅ Subscribed: ${subResponse.successCount} | Errors: ${subResponse.failureCount}`);

  // ── 2. Send a notification to the topic ─────────────────────────────────
  // ONE API call → ALL subscribed devices receive the message
  console.log(\n📤  Broadcasting to topic "${TOPIC_NAME}"...);
  const messageId = await admin.messaging().send({
    notification: {
      title: '📰 Breaking News',
      body:  Topic broadcast sent to all "${TOPIC_NAME}" subscribers.,
    },
    data: {
      category: 'news',
      priority: 'urgent',
    },
    android: { priority: 'high' },

    topic: TOPIC_NAME,  // ← target the topic, not a specific token
  });
  console.log('    ✅ Message ID:', messageId);

  // ── 3. (Optional) Unsubscribe ────────────────────────────────────────────
  // Uncomment to remove the token from the topic:
  // const unsubResponse = await admin.messaging().unsubscribeFromTopic([DEVICE_TOKEN], TOPIC_NAME);
  // console.log(`    Unsubscribed: ${unsubResponse.successCount}`);

  console.log('\n💡  Tip: Always unsubscribeFromTopic() when a user logs out.\n');
}

manageTopics().catch(err => {
  console.error('❌  Topic error:', err.code, err.message);
});
