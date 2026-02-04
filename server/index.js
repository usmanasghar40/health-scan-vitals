import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const DEFAULT_USER_ID = "default_user";

const query = (text, params) => pool.query(text, params);

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role,
  phone: user.phone,
});

const mapProviderProfile = (profile) => ({
  id: profile.id,
  user_id: profile.user_id,
  specialty: profile.specialty,
  credentials: profile.credentials,
  npi: profile.npi,
  bio: profile.bio,
  years_experience: profile.years_experience,
  accepting_new_patients: profile.accepting_new_patients,
  languages: profile.languages || [],
  consultation_fee: profile.consultation_fee,
  rating: profile.rating,
  review_count: profile.review_count,
  profile_image: profile.profile_image,
});

const mapPatientProfile = (profile) => ({
  id: profile.id,
  user_id: profile.user_id,
  date_of_birth: profile.date_of_birth,
  gender: profile.gender,
  blood_type: profile.blood_type,
  allergies: profile.allergies || [],
  conditions: profile.conditions || [],
  medications: profile.medications || [],
  insurance_provider: profile.insurance_provider,
  insurance_id: profile.insurance_id,
});

const createNotification = async ({ userId, type, title, body, metadata }) => {
  await query(
    `insert into notifications (user_id, type, title, body, metadata)
     values ($1,$2,$3,$4,$5)`,
    [userId, type, title, body || null, metadata ? JSON.stringify(metadata) : {}]
  );
};

const getUserProfile = async (user) => {
  if (!user) return null;
  if (user.role === "provider") {
    const { rows } = await query(
      "select * from provider_profiles where user_id = $1",
      [user.id]
    );
    return rows[0] ? mapProviderProfile(rows[0]) : null;
  }

  if (user.role === "patient") {
    const { rows } = await query(
      "select * from patient_profiles where user_id = $1",
      [user.id]
    );
    return rows[0] ? mapPatientProfile(rows[0]) : null;
  }

  return null;
};

const jsonError = (res, message, status = 400) => {
  res.status(status).json({ success: false, error: message });
};

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = process.env.DAILY_API_BASE || "https://api.daily.co/v1";
const DAILY_ROOM_PREFIX = process.env.DAILY_ROOM_PREFIX || "telehealth";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;
const STRIPE_PLAN_LOOKUP_KEY = "pehd-pro-199-monthly";
let cachedStripePriceId = null;

const dailyRequest = async (path, options = {}) => {
  if (!DAILY_API_KEY) {
    throw new Error("Daily API key is required.");
  }
  const response = await fetch(`${DAILY_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.info || payload?.error || "Daily API request failed";
    throw new Error(message);
  }
  return payload;
};

const getStripePriceId = async () => {
  if (!stripe) {
    throw new Error("Stripe secret key is required.");
  }
  if (cachedStripePriceId) return cachedStripePriceId;

  const existing = await stripe.prices.list({
    lookup_keys: [STRIPE_PLAN_LOOKUP_KEY],
    limit: 1,
    expand: ["data.product"],
  });
  if (existing.data[0]) {
    cachedStripePriceId = existing.data[0].id;
    return cachedStripePriceId;
  }

  const product = await stripe.products.create({
    name: "PEHD Professional",
    description: "Full access subscription with 7-day free trial.",
  });
  const price = await stripe.prices.create({
    unit_amount: 19900,
    currency: "usd",
    recurring: { interval: "month" },
    product: product.id,
    lookup_key: STRIPE_PLAN_LOOKUP_KEY,
  });
  cachedStripePriceId = price.id;
  return cachedStripePriceId;
};

const getOrCreateStripeCustomer = async ({ email, userId }) => {
  if (!stripe) {
    throw new Error("Stripe secret key is required.");
  }
  if (email && userId) {
    const existing = await stripe.customers.list({ email, limit: 10 });
    const matched = existing.data.find((cust) => cust.metadata?.userId === userId);
    if (matched) return matched.id;
  } else if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data[0]) return existing.data[0].id;
  }
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: userId ? { userId } : undefined,
  });
  return customer.id;
};

const syncStripeSubscription = async (userId) => {
  if (!stripe) return null;
  const { rows: userRows } = await query(
    "select id, email, role from users where id = $1",
    [userId]
  );
  const user = userRows[0];
  if (!user || user.role !== "provider") return null;

  const { rows } = await query(
    `select * from subscriptions
     where user_id = $1
     order by started_at desc
     limit 1`,
    [userId]
  );
  const subscription = rows[0] || null;
  const customerId = subscription?.stripe_customer_id || null;
  if (!customerId) return subscription;

  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const latest = stripeSubscriptions.data[0];
  if (!latest || !subscription?.stripe_subscription_id) return subscription;

  if (latest.status === "trialing" && !subscription?.stripe_subscription_id) {
    return subscription;
  }
  const status =
    latest.status === "active"
      ? "active"
      : latest.status === "trialing"
      ? subscription?.status === "active"
        ? "active"
        : "trialing"
      : latest.status === "canceled" || latest.status === "incomplete_expired"
      ? "expired"
      : subscription?.status || "trialing";
  const { rows: updated } = await query(
    `update subscriptions
     set status = $1,
         stripe_customer_id = $2,
         stripe_subscription_id = $3,
         started_at = coalesce(started_at, now())
     where user_id = $4
     returning *`,
    [status, customerId, latest.id, userId]
  );
  return updated[0] || subscription;
};

const buildRoomName = (appointmentId) =>
  `${DAILY_ROOM_PREFIX}-${String(appointmentId).replace(/[^a-zA-Z0-9-]/g, "")}`;

const getAppointmentById = async (appointmentId) => {
  const { rows } = await query("select * from appointments where id = $1", [
    appointmentId,
  ]);
  return rows[0] || null;
};

const getUserById = async (userId) => {
  const { rows } = await query("select * from users where id = $1", [userId]);
  return rows[0] || null;
};

const ensureProviderUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    return { error: "User not found." };
  }
  if (user.role !== "provider") {
    return { error: "Only providers can manage recordings." };
  }
  return { user };
};

const ensureAppointmentAccess = (appointment, userId) => {
  if (!appointment) return "Appointment not found.";
  if (!userId) return "User ID is required.";
  if (!appointment.is_telehealth) {
    return "This appointment is not marked for telehealth.";
  }
  const isParticipant =
    appointment.patient_id === userId || appointment.provider_id === userId;
  if (!isParticipant) {
    return "You do not have access to this appointment.";
  }
  return null;
};

const ensureDailyRoom = async (appointment) => {
  if (appointment.telehealth_room_name && appointment.telehealth_room_url) {
    return {
      roomName: appointment.telehealth_room_name,
      roomUrl: appointment.telehealth_room_url,
    };
  }

  const roomName = buildRoomName(appointment.id);
  let room;

  try {
    room = await dailyRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: "cloud",
          enable_knocking: false,
        },
      }),
    });
  } catch (error) {
    room = await dailyRequest(`/rooms/${roomName}`, { method: "GET" });
  }

  const roomUrl = room.url;
  await query(
    "update appointments set telehealth_room_name = $1, telehealth_room_url = $2 where id = $3",
    [roomName, roomUrl, appointment.id]
  );

  return { roomName, roomUrl };
};

const createMeetingToken = async ({ roomName, userName, expiresAt }) => {
  const payloadWithExp = {
    properties: {
      room_name: roomName,
      user_name: userName,
    },
    exp: expiresAt,
  };

  try {
    const tokenResponse = await dailyRequest("/meeting-tokens", {
      method: "POST",
      body: JSON.stringify(payloadWithExp),
    });
    return { token: tokenResponse.token, expiresAtApplied: expiresAt };
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    const shouldRetry =
      message.includes("unknown parameter") || message.includes("exp");
    if (!shouldRetry) {
      throw error;
    }
    const tokenResponse = await dailyRequest("/meeting-tokens", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
        },
      }),
    });
    return { token: tokenResponse.token, expiresAtApplied: null };
  }
};

const parseJsonFromModel = (content) => {
  if (!content) return null;
  const trimmed = String(content).trim();
  const withoutFence = trimmed
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(withoutFence);
  } catch (err) {
    return null;
  }
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/billing/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return jsonError(res, "Stripe secret key is required.");
  }
  const { userId, email } = req.body || {};
  try {
    if (!userId) {
      return jsonError(res, "userId is required.");
    }
    const { rows: userRows } = await query("select role from users where id = $1", [userId]);
    if (!userRows[0] || userRows[0].role !== "provider") {
      return jsonError(res, "Subscriptions are available for providers only.", 403);
    }
    const priceId = await getStripePriceId();
    const customerId = await getOrCreateStripeCustomer({ email, userId });
    const { rows } = await query(
      `select * from subscriptions
       where user_id = $1
       order by started_at desc
       limit 1`,
      [userId]
    );
    const subscription = rows[0] || null;
    const trialEndsAt = subscription?.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;
    const now = new Date();
    const shouldApplyTrial = trialEndsAt && trialEndsAt > now;
    const origin =
      req.headers.origin ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "http://localhost:8080");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "always",
      subscription_data: shouldApplyTrial
        ? { trial_end: Math.floor(trialEndsAt.getTime() / 1000) }
        : {},
      allow_promotion_codes: true,
      success_url: `${origin}/?tab=subscription&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?tab=subscription&checkout=cancel`,
    });
    await query(
      `update subscriptions
       set stripe_customer_id = $1
       where user_id = $2`,
      [customerId, userId]
    );
    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    jsonError(res, "Failed to create checkout session", 500);
  }
});

app.get("/api/billing/status", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return jsonError(res, "userId is required.");
  }
  try {
    const synced = await syncStripeSubscription(userId);
    const { rows } = await query(
      `select * from subscriptions
       where user_id = $1
       order by started_at desc
       limit 1`,
      [userId]
    );
    let subscription = rows[0] || synced || null;
    if (!subscription) {
      const { rows: userRows } = await query(
        "select role, created_at from users where id = $1",
        [userId]
      );
      const user = userRows[0];
      if (!user || user.role !== "provider") {
        return res.json({ access: false, subscription: null });
      }
      const createdAt = new Date(user.created_at);
      const trialEndsAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const status = trialEndsAt > new Date() ? "trialing" : "expired";
      const { rows: insertRows } = await query(
        `insert into subscriptions
         (user_id, plan_id, status, billing_cycle, trial_ends_at, started_at)
         values ($1,$2,$3,$4,$5,$6)
         returning *`,
        [userId, "pehd-pro-199", status, "monthly", trialEndsAt, createdAt]
      );
      subscription = insertRows[0];
    }
    const now = new Date();
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    let status = subscription.status;
    if (!subscription.stripe_subscription_id) {
      if (trialEndsAt && trialEndsAt > now) {
        status = "trialing";
      } else if (trialEndsAt && trialEndsAt <= now) {
        status = "expired";
      }
      if (status !== subscription.status) {
        const { rows: corrected } = await query(
          `update subscriptions
           set status = $1
           where id = $2
           returning *`,
          [status, subscription.id]
        );
        subscription = corrected[0] || subscription;
      }
    } else if (status !== "active" && trialEndsAt && trialEndsAt > now) {
      status = "trialing";
    }
    if (status === "trialing" && trialEndsAt && trialEndsAt <= now) {
      const { rows: updated } = await query(
        `update subscriptions
         set status = 'expired'
         where id = $1
         returning *`,
        [subscription.id]
      );
      status = updated[0]?.status || "expired";
      subscription.status = status;
    }
    const access =
      status === "active" ||
      (status === "trialing" && trialEndsAt && trialEndsAt > now);
    res.json({
      access,
      status,
      trialEndsAt: subscription.trial_ends_at,
      subscription,
    });
  } catch (error) {
    console.error("Billing status error:", error);
    jsonError(res, "Failed to load subscription status", 500);
  }
});

app.post("/api/billing/confirm-checkout", async (req, res) => {
  if (!stripe) {
    return jsonError(res, "Stripe secret key is required.");
  }
  const { sessionId, userId } = req.body || {};
  if (!sessionId || !userId) {
    return jsonError(res, "sessionId and userId are required.");
  }
  try {
    const { rows: userRows } = await query("select role from users where id = $1", [userId]);
    if (!userRows[0] || userRows[0].role !== "provider") {
      return jsonError(res, "Subscriptions are available for providers only.", 403);
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const stripeSubscriptionId = session.subscription;
    const stripeCustomerId = session.customer;
    if (!stripeSubscriptionId) {
      return jsonError(res, "Subscription not found in session.", 400);
    }
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const status = "active";
    const trialEndsAt = null;
    const { rows } = await query(
      `update subscriptions
       set status = $1,
           stripe_subscription_id = $2,
           stripe_customer_id = $3,
           trial_ends_at = $4,
           started_at = now()
       where user_id = $5
       returning *`,
      [status, stripeSubscriptionId, stripeCustomerId, trialEndsAt, userId]
    );
    res.json({ success: true, subscription: rows[0] });
  } catch (error) {
    console.error("Confirm checkout error:", error);
    jsonError(res, "Failed to confirm subscription", 500);
  }
});

app.post("/api/billing/record-checkout", async (req, res) => {
  if (!stripe) {
    return jsonError(res, "Stripe secret key is required.");
  }
  const { sessionId, userId, status } = req.body || {};
  if (!userId || !status) {
    return jsonError(res, "userId and status are required.");
  }
  try {
    let amount = null;
    let planId = "pehd-pro-199";
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      amount = session.amount_total ? session.amount_total / 100 : null;
    }
    await query(
      `insert into payment_history (user_id, plan_id, amount, status)
       values ($1,$2,$3,$4)`,
      [userId, planId, amount, status]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Record checkout error:", error);
    jsonError(res, "Failed to record checkout", 500);
  }
});

// Telehealth (Daily)
app.post("/api/telehealth/room", async (req, res) => {
  const { appointmentId, userId } = req.body || {};
  if (!appointmentId || !userId) {
    return jsonError(res, "appointmentId and userId are required.");
  }

  try {
    const appointment = await getAppointmentById(appointmentId);
    const accessError = ensureAppointmentAccess(appointment, userId);
    if (accessError) {
      return jsonError(res, accessError, 403);
    }

    const room = await ensureDailyRoom(appointment);
    res.json({ success: true, ...room });
  } catch (error) {
    console.error("Telehealth room error:", error);
    jsonError(res, error.message || "Failed to create telehealth room", 500);
  }
});

app.post("/api/telehealth/token", async (req, res) => {
  const { appointmentId, userId } = req.body || {};
  if (!appointmentId || !userId) {
    return jsonError(res, "appointmentId and userId are required.");
  }

  try {
    const appointment = await getAppointmentById(appointmentId);
    const accessError = ensureAppointmentAccess(appointment, userId);
    if (accessError) {
      return jsonError(res, accessError, 403);
    }

    const user = await getUserById(userId);
    if (!user) {
      return jsonError(res, "User not found.", 404);
    }

    const { roomName, roomUrl } = await ensureDailyRoom(appointment);
    const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 10;
    const tokenResult = await createMeetingToken({
      roomName,
      userName: userName || user.email || "Participant",
      expiresAt,
    });

    res.json({
      success: true,
      roomName,
      roomUrl,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAtApplied,
    });
  } catch (error) {
    console.error("Telehealth token error:", error);
    jsonError(res, error.message || "Failed to create telehealth token", 500);
  }
});

app.post("/api/telehealth/instant", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    return jsonError(res, "userId is required.");
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return jsonError(res, "User not found.", 404);
    }
    if (user.role !== "provider") {
      return jsonError(res, "Only providers can start instant meetings.", 403);
    }

    const roomName = buildRoomName(uuidv4());
    const room = await dailyRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: "cloud",
          enable_knocking: false,
        },
      }),
    });

    const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 10;
    const tokenResult = await createMeetingToken({
      roomName,
      userName: userName || user.email || "Provider",
      expiresAt,
    });

    res.json({
      success: true,
      roomName,
      roomUrl: room.url,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAtApplied,
    });
  } catch (error) {
    console.error("Telehealth instant error:", error);
    jsonError(res, error.message || "Failed to create instant meeting", 500);
  }
});

app.post("/api/telehealth/validate", async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return jsonError(res, "token is required.");
  }

  try {
    const payload = await dailyRequest(`/meeting-tokens/${token}`, {
      method: "GET",
    });
    res.json({ success: true, payload });
  } catch (error) {
    console.error("Telehealth token validation error:", error);
    jsonError(res, error.message || "Token validation failed", 400);
  }
});

app.post("/api/telehealth/recording/start", async (req, res) => {
  const { roomName, userId } = req.body || {};
  if (!roomName || !userId) {
    return jsonError(res, "roomName and userId are required.");
  }
  try {
    const { error } = await ensureProviderUser(userId);
    if (error) {
      return jsonError(res, error, 403);
    }
    const payload = await dailyRequest(`/rooms/${roomName}/recordings/start`, {
      method: "POST",
      body: JSON.stringify({
        type: "cloud",
      }),
    });
    const recordingId = payload?.id || payload?.recordingId || payload?.data?.id || null;
    const status = payload?.status || payload?.data?.status || null;
    const downloadUrl =
      payload?.download_url || payload?.downloadUrl || payload?.data?.download_url || null;
    const { rows } = await query(
      `insert into telehealth_recordings
        (provider_id, room_name, recording_id, status, download_url)
       values ($1,$2,$3,$4,$5)
       returning *`,
      [userId, roomName, recordingId, status, downloadUrl]
    );
    res.json({
      success: true,
      recordingId,
      status,
      downloadUrl,
      recording: rows[0],
    });
  } catch (error) {
    console.error("Telehealth recording start error:", error);
    jsonError(res, error.message || "Failed to start recording", 500);
  }
});

app.post("/api/telehealth/recording/stop", async (req, res) => {
  const { recordingId, userId, roomName: bodyRoomName } = req.body || {};
  if (!recordingId || !userId) {
    return jsonError(res, "recordingId and userId are required.");
  }
  try {
    const { error } = await ensureProviderUser(userId);
    if (error) {
      return jsonError(res, error, 403);
    }
    let roomName = bodyRoomName;
    if (!roomName) {
      const { rows: roomRows } = await query(
        "select room_name from telehealth_recordings where recording_id = $1 limit 1",
        [recordingId]
      );
      roomName = roomRows[0]?.room_name;
    }
    if (!roomName) {
      return jsonError(res, "Recording room not found.", 404);
    }
    let status = null;
    let downloadUrl = null;
    try {
      const payload = await dailyRequest(`/rooms/${roomName}/recordings/stop`, {
        method: "POST",
      });
      status = payload?.status || payload?.data?.status || null;
      downloadUrl =
        payload?.download_url || payload?.downloadUrl || payload?.data?.download_url || null;
    } catch (stopErr) {
      const message = String(stopErr?.message || "").toLowerCase();
      if (!message.includes("does not have an active recording")) {
        throw stopErr;
      }
      status = "stopped";
    }

    if (!downloadUrl) {
      try {
        const details = await dailyRequest(`/recordings/${recordingId}`, { method: "GET" });
        downloadUrl =
          details?.download_url || details?.downloadUrl || details?.data?.download_url || null;
        status = status || details?.status || details?.data?.status || null;
      } catch (err) {
        // ignore if Daily hasn't finished processing
      }
    }
    const { rows } = await query(
      `update telehealth_recordings
       set status = coalesce($1, status),
           download_url = coalesce($2, download_url),
           ended_at = now()
       where recording_id = $3
       returning *`,
      [status, downloadUrl, recordingId]
    );
    res.json({ success: true, status, downloadUrl, recording: rows[0] });
  } catch (error) {
    console.error("Telehealth recording stop error:", error);
    jsonError(res, error.message || "Failed to stop recording", 500);
  }
});

app.post("/api/telehealth/recordings/list", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    return jsonError(res, "userId is required.");
  }
  try {
    const { error } = await ensureProviderUser(userId);
    if (error) {
      return jsonError(res, error, 403);
    }
    const { rows } = await query(
      `select * from telehealth_recordings
       where provider_id = $1
       order by created_at desc
       limit 50`,
      [userId]
    );
    const updated = [];
    const roomNames = Array.from(
      new Set(rows.map((rec) => rec.room_name).filter(Boolean))
    );
    const roomRecordings = new Map();

    for (const roomName of roomNames) {
      try {
        const payload = await dailyRequest(
          `/recordings?room_name=${encodeURIComponent(roomName)}&limit=10`,
          { method: "GET" }
        );
        const data = payload?.data || payload?.recordings || [];
        roomRecordings.set(roomName, data);
      } catch (err) {
        // ignore if Daily hasn't finished processing
      }
    }

    for (const rec of rows) {
      let downloadUrl = rec.download_url;
      let status = rec.status;
      let recordingId = rec.recording_id;

      if (!downloadUrl) {
        const list = roomRecordings.get(rec.room_name) || [];
        const matched =
          (recordingId && list.find((item) => item.id === recordingId)) || list[0];
        if (matched) {
          recordingId = recordingId || matched.id;
          status = matched.status || status;
          downloadUrl =
            matched.download_url ||
            matched.share_url ||
            matched.url ||
            matched.recording_url ||
            downloadUrl;
        }
      }

      if (!downloadUrl && recordingId) {
        try {
          const linkPayload = await dailyRequest(
            `/recordings/${recordingId}/access-link`,
            { method: "GET" }
          );
          downloadUrl =
            linkPayload?.download_link ||
            linkPayload?.downloadUrl ||
            linkPayload?.download_url ||
            downloadUrl;
        } catch (err) {
          // ignore if not ready or unavailable
        }
      }

      if (
        recordingId !== rec.recording_id ||
        status !== rec.status ||
        downloadUrl !== rec.download_url
      ) {
        const { rows: updatedRows } = await query(
          `update telehealth_recordings
           set recording_id = coalesce($1, recording_id),
               status = coalesce($2, status),
               download_url = coalesce($3, download_url)
           where id = $4
           returning *`,
          [recordingId, status, downloadUrl, rec.id]
        );
        updated.push(updatedRows[0] || rec);
        continue;
      }
      updated.push(rec);
    }
    res.json({ success: true, recordings: updated });
  } catch (error) {
    console.error("Telehealth recordings list error:", error);
    jsonError(res, error.message || "Failed to load recordings", 500);
  }
});

// Health data endpoints
app.get("/api/vitals", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const limit = Number(req.query.limit || 30);
  const { rows } = await query(
    "select * from vital_measurements where user_id = $1 order by measurement_date desc limit $2",
    [userId, limit]
  );
  res.json(rows);
});

app.post("/api/vitals", async (req, res) => {
  const measurement = req.body;
  const userId = measurement.user_id || DEFAULT_USER_ID;
  const { rows } = await query(
    `insert into vital_measurements
      (user_id, measurement_date, heart_rate, systolic_bp, diastolic_bp, o2_saturation, blood_glucose, body_temperature, respiratory_rate, notes)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning *`,
    [
      userId,
      measurement.measurement_date,
      measurement.heart_rate,
      measurement.systolic_bp,
      measurement.diastolic_bp,
      measurement.o2_saturation,
      measurement.blood_glucose,
      measurement.body_temperature,
      measurement.respiratory_rate,
      measurement.notes || null,
    ]
  );
  res.json(rows[0]);
});

app.post("/api/clinical-assessments", async (req, res) => {
  const { patientId, providerId, rosAnswers, assessment, vitals } = req.body || {};
  if (!patientId || !providerId) {
    return jsonError(res, "patientId and providerId are required.");
  }

  const { rows } = await query(
    `insert into clinical_assessments
      (patient_id, provider_id, ros_answers, assessment, vitals)
      values ($1, $2, $3, $4, $5)
      returning *`,
    [
      patientId,
      providerId,
      rosAnswers ? JSON.stringify(rosAnswers) : null,
      assessment ? JSON.stringify(assessment) : null,
      vitals ? JSON.stringify(vitals) : null,
    ]
  );

  res.json(rows[0]);
});

app.get("/api/clinical-assessments", async (req, res) => {
  const { providerId, patientId } = req.query;
  if (!providerId && !patientId) {
    return jsonError(res, "providerId or patientId is required.");
  }

  if (providerId) {
    const { rows } = await query(
      `select ca.*,
              pu.first_name as patient_first_name,
              pu.last_name as patient_last_name
         from clinical_assessments ca
         left join users pu on ca.patient_id = pu.id
        where ca.provider_id = $1
        order by ca.created_at desc`,
      [providerId]
    );
    return res.json(rows);
  }

  const { rows } = await query(
    `select ca.*,
            pr.first_name as provider_first_name,
            pr.last_name as provider_last_name
       from clinical_assessments ca
       left join users pr on ca.provider_id = pr.id
      where ca.patient_id = $1
      order by ca.created_at desc`,
    [patientId]
  );
  return res.json(rows);
});

app.get("/api/patient-ros", async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) {
    return jsonError(res, "patientId is required.");
  }

  const { rows } = await query(
    "select * from patient_ros where patient_id = $1",
    [patientId]
  );
  res.json(rows[0] || null);
});

app.post("/api/patient-ros", async (req, res) => {
  const { patientId, rosAnswers } = req.body || {};
  if (!patientId) {
    return jsonError(res, "patientId is required.");
  }

  const { rows } = await query(
    `insert into patient_ros (patient_id, ros_answers, updated_at)
     values ($1, $2, now())
     on conflict (patient_id)
     do update set ros_answers = excluded.ros_answers, updated_at = now()
     returning *`,
    [patientId, rosAnswers ? JSON.stringify(rosAnswers) : null]
  );

  res.json(rows[0]);
});

app.post("/api/treatment-plans", async (req, res) => {
  const { clinicalAssessmentId, patientId, providerId, plan } = req.body || {};
  if (!patientId || !providerId || !plan) {
    return jsonError(res, "patientId, providerId, and plan are required.");
  }

  const { rows } = await query(
    `insert into treatment_plans
      (clinical_assessment_id, patient_id, provider_id, plan, status)
      values ($1,$2,$3,$4,'finalized')
      returning *`,
    [clinicalAssessmentId || null, patientId, providerId, JSON.stringify(plan)]
  );

  if (clinicalAssessmentId) {
    await query(
      "update clinical_assessments set status = 'plan_ready' where id = $1",
      [clinicalAssessmentId]
    );
  }

  await createNotification({
    userId: patientId,
    type: "treatment_plan",
    title: "Treatment plan available",
    body: "Your provider finalized a comprehensive treatment plan. Review it in Clinical Tools.",
    metadata: { treatmentPlanId: rows[0]?.id },
  });

  res.json(rows[0]);
});

app.get("/api/treatment-plans", async (req, res) => {
  const { patientId, providerId } = req.query;
  if (!patientId && !providerId) {
    return jsonError(res, "patientId or providerId is required.");
  }

  if (patientId) {
    const { rows } = await query(
      `select tp.*,
              pr.first_name as provider_first_name,
              pr.last_name as provider_last_name
         from treatment_plans tp
         left join users pr on tp.provider_id = pr.id
        where tp.patient_id = $1
        order by tp.created_at desc`,
      [patientId]
    );
    return res.json(rows);
  }

  const { rows } = await query(
    `select tp.*,
            pu.first_name as patient_first_name,
            pu.last_name as patient_last_name
       from treatment_plans tp
       left join users pu on tp.patient_id = pu.id
      where tp.provider_id = $1
      order by tp.created_at desc`,
    [providerId]
  );
  return res.json(rows);
});

app.patch("/api/treatment-plans/:id/acknowledge", async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    "update treatment_plans set status = 'patient_acknowledged', acknowledged_at = now() where id = $1 returning *",
    [id]
  );
  res.json(rows[0]);
});

app.get("/api/vitals/range", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const { rows } = await query(
    `select * from vital_measurements
     where user_id = $1 and measurement_date >= $2 and measurement_date <= $3
     order by measurement_date asc`,
    [userId, startDate, endDate]
  );
  res.json(rows);
});

app.get("/api/labs", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const testName = req.query.testName;
  const limit = Number(req.query.limit || 50);
  if (testName) {
    const { rows } = await query(
      `select * from lab_results where user_id = $1 and test_name = $2
       order by test_date desc limit $3`,
      [userId, testName, limit]
    );
    res.json(rows);
    return;
  }
  const { rows } = await query(
    `select * from lab_results where user_id = $1
     order by test_date desc limit $2`,
    [userId, limit]
  );
  res.json(rows);
});

app.get("/api/labs/test-names", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const { rows } = await query(
    "select distinct test_name from lab_results where user_id = $1",
    [userId]
  );
  res.json(rows.map((row) => row.test_name));
});

app.get("/api/labs/range", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const testName = req.query.testName;
  if (testName) {
    const { rows } = await query(
      `select * from lab_results
       where user_id = $1 and test_name = $2 and test_date >= $3 and test_date <= $4
       order by test_date asc`,
      [userId, testName, startDate, endDate]
    );
    res.json(rows);
    return;
  }
  const { rows } = await query(
    `select * from lab_results
     where user_id = $1 and test_date >= $2 and test_date <= $3
     order by test_date asc`,
    [userId, startDate, endDate]
  );
  res.json(rows);
});

app.post("/api/labs", async (req, res) => {
  const result = req.body;
  const userId = result.user_id || DEFAULT_USER_ID;
  const { rows } = await query(
    `insert into lab_results
      (user_id, test_date, test_name, test_value, unit, category, status, normal_range)
      values ($1,$2,$3,$4,$5,$6,$7,$8)
      returning *`,
    [
      userId,
      result.test_date,
      result.test_name,
      result.test_value,
      result.unit,
      result.category,
      result.status,
      result.normal_range,
    ]
  );
  res.json(rows[0]);
});

app.post("/api/labs/bulk", async (req, res) => {
  const results = Array.isArray(req.body) ? req.body : [];
  if (!results.length) {
    res.json([]);
    return;
  }
  const values = [];
  const params = [];
  results.forEach((r, index) => {
    const base = index * 8;
    params.push(
      r.user_id || DEFAULT_USER_ID,
      r.test_date,
      r.test_name,
      r.test_value,
      r.unit,
      r.category,
      r.status,
      r.normal_range
    );
    values.push(
      `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`
    );
  });
  const { rows } = await query(
    `insert into lab_results
      (user_id, test_date, test_name, test_value, unit, category, status, normal_range)
      values ${values.join(",")}
      returning *`,
    params
  );
  res.json(rows);
});

app.delete("/api/labs/:id", async (req, res) => {
  await query("delete from lab_results where id = $1", [req.params.id]);
  res.json({ success: true });
});

// AI scribe endpoints
app.get("/api/scribe", async (req, res) => {
  const appointmentId = req.query.appointmentId;
  const { rows } = await query(
    `select * from scribe_notes
     where appointment_id = $1
     order by created_at desc
     limit 1`,
    [appointmentId]
  );
  res.json(rows[0] || null);
});

app.post("/api/scribe/transcribe", async (req, res) => {
  const { audioBase64, mimeType, appointmentId } = req.body || {};
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!audioBase64) {
    jsonError(res, "Audio payload is required");
    return;
  }
  if (!openAiKey) {
    jsonError(res, "OpenAI API key is required for transcription");
    return;
  }
  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const safeMimeRaw = typeof mimeType === "string" && mimeType ? mimeType : "audio/webm";
    const safeMime = safeMimeRaw.split(";")[0] || "audio/webm";
    const extension = safeMime.split("/")[1] || "webm";
    const form = new FormData();
    const blob = new Blob([buffer], { type: safeMime });
    form.append("file", blob, `scribe-${appointmentId || "session"}.${extension}`);
    form.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
      body: form,
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("Transcription error:", payload);
      jsonError(res, payload?.error?.message || "Transcription failed", 500);
      return;
    }
    res.json({ success: true, transcript: payload.text || "" });
  } catch (error) {
    console.error("Transcription error:", error);
    jsonError(res, "Failed to transcribe audio", 500);
  }
});

app.post("/api/scribe/summarize", async (req, res) => {
  const { transcript, appointmentId, patientId, providerId } = req.body || {};
  const openAiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!transcript) {
    jsonError(res, "Transcript is required");
    return;
  }
  if (!appointmentId) {
    jsonError(res, "appointmentId is required");
    return;
  }
  if (!openAiKey) {
    jsonError(res, "OpenAI API key is required for summarization");
    return;
  }

  try {
    const prompt = {
      role: "system",
      content:
        "You are a medical scribe. Summarize the transcript into a structured JSON with keys: " +
        "summary (string), subjective (string), objective (string), assessment (string), plan (string), " +
        "actionItems (string[]), icdSuggestions (array of {code, description}), " +
        "cptSuggestions (array of {code, description}). Respond with JSON only.",
    };
    const userMessage = {
      role: "user",
      content: transcript,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: openAiModel,
        temperature: 0.2,
        messages: [prompt, userMessage],
        response_format: { type: "json_object" },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("Scribe summarization error:", payload);
      jsonError(res, payload?.error?.message || "Summarization failed", 500);
      return;
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      jsonError(res, "No summary returned from model", 500);
      return;
    }

    const parsed = JSON.parse(content);
    const actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : [];
    const icdSuggestions = Array.isArray(parsed.icdSuggestions) ? parsed.icdSuggestions : [];
    const cptSuggestions = Array.isArray(parsed.cptSuggestions) ? parsed.cptSuggestions : [];
    const noteText =
      `Summary: ${parsed.summary || ""}\n\n` +
      `Subjective:\n${parsed.subjective || ""}\n\n` +
      `Objective:\n${parsed.objective || ""}\n\n` +
      `Assessment:\n${parsed.assessment || ""}\n\n` +
      `Plan:\n${parsed.plan || ""}\n\n` +
      `Action Items:\n${actionItems.length ? actionItems.map((item) => `- ${item}`).join("\n") : "None"}`;

    const existing = appointmentId
      ? await query(
          `select id from scribe_notes where appointment_id = $1 order by created_at desc limit 1`,
          [appointmentId]
        )
      : { rows: [] };
    let scribe;
    if (existing.rows[0]) {
      const { rows } = await query(
        `update scribe_notes
         set transcript = $1,
             draft_note = $2,
             icd_codes = $3,
             cpt_codes = $4,
             status = 'draft',
             updated_at = now()
         where id = $5
         returning *`,
        [
          transcript,
          noteText,
          JSON.stringify(icdSuggestions),
          JSON.stringify(cptSuggestions),
          existing.rows[0].id,
        ]
      );
      scribe = rows[0];
    } else {
      const { rows } = await query(
        `insert into scribe_notes
         (appointment_id, patient_id, provider_id, transcript, draft_note, icd_codes, cpt_codes, status)
         values ($1,$2,$3,$4,$5,$6,$7,'draft')
         returning *`,
        [
          appointmentId || null,
          patientId || null,
          providerId || null,
          transcript,
          noteText,
          JSON.stringify(icdSuggestions),
          JSON.stringify(cptSuggestions),
        ]
      );
      scribe = rows[0];
    }

    res.json({
      success: true,
      draftNote: noteText,
      icdSuggestions,
      cptSuggestions,
      scribe,
    });
  } catch (error) {
    console.error("Scribe summarization error:", error);
    jsonError(res, "Failed to summarize transcript", 500);
  }
});

app.get("/api/scribe/patient", async (req, res) => {
  const patientId = req.query.patientId;
  if (!patientId) {
    jsonError(res, "patientId is required");
    return;
  }
  const { rows } = await query(
    `select s.id, s.appointment_id, s.final_note, s.icd_codes, s.cpt_codes, s.finalized_at,
            a.scheduled_date, a.scheduled_time,
            u.first_name as provider_first_name, u.last_name as provider_last_name
     from scribe_notes s
     left join appointments a on a.id = s.appointment_id
     left join users u on u.id = s.provider_id
     where s.patient_id = $1 and s.status = 'final'
     order by s.finalized_at desc`,
    [patientId]
  );
  res.json(rows);
});

app.patch("/api/scribe/:id", async (req, res) => {
  const { draftNote, finalNote, status, finalizedBy } = req.body || {};
  const { rows } = await query(
    `update scribe_notes
     set draft_note = coalesce($1, draft_note),
         final_note = coalesce($2, final_note),
         status = coalesce($3, status),
         finalized_at = case when $3 = 'final' then now() else finalized_at end,
         finalized_by = case when $3 = 'final' then $4 else finalized_by end,
         updated_at = now()
     where id = $5
     returning *`,
    [draftNote ?? null, finalNote ?? null, status ?? null, finalizedBy || null, req.params.id]
  );
  res.json({ success: true, scribe: rows[0] });
});

app.get("/api/scans", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const scanType = req.query.scanType;
  const limit = Number(req.query.limit || 20);
  if (scanType) {
    const { rows } = await query(
      `select * from scan_results where user_id = $1 and scan_type = $2
       order by scan_date desc limit $3`,
      [userId, scanType, limit]
    );
    res.json(rows);
    return;
  }
  const { rows } = await query(
    `select * from scan_results where user_id = $1
     order by scan_date desc limit $2`,
    [userId, limit]
  );
  res.json(rows);
});

app.post("/api/scans", async (req, res) => {
  const result = req.body;
  const userId = result.user_id || DEFAULT_USER_ID;
  const { rows } = await query(
    `insert into scan_results
      (user_id, scan_date, scan_type, area, plaque_detected, plaque_level, arterial_health, blood_flow, notes)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      returning *`,
    [
      userId,
      result.scan_date,
      result.scan_type,
      result.area,
      result.plaque_detected,
      result.plaque_level,
      result.arterial_health,
      result.blood_flow,
      result.notes || null,
    ]
  );
  res.json(rows[0]);
});

// Notifications
app.get("/api/notifications", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    jsonError(res, "userId is required");
    return;
  }
  const { rows } = await query(
    `select * from notifications
     where user_id = $1
     order by created_at desc
     limit 50`,
    [userId]
  );
  res.json(rows);
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  await query(
    "update notifications set is_read = true where id = $1",
    [id]
  );
  res.json({ success: true });
});

app.patch("/api/notifications/read-all", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    jsonError(res, "userId is required");
    return;
  }
  await query(
    "update notifications set is_read = true where user_id = $1",
    [userId]
  );
  res.json({ success: true });
});

app.get("/api/goals", async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const status = req.query.status;
  if (status) {
    const { rows } = await query(
      `select * from health_goals where user_id = $1 and status = $2
       order by created_at desc`,
      [userId, status]
    );
    res.json(rows);
    return;
  }
  const { rows } = await query(
    `select * from health_goals where user_id = $1 order by created_at desc`,
    [userId]
  );
  res.json(rows);
});

app.post("/api/goals", async (req, res) => {
  const goal = req.body;
  const userId = goal.user_id || DEFAULT_USER_ID;
  const { rows } = await query(
    `insert into health_goals
      (user_id, goal_type, target_metric, target_value, current_value, unit, start_date, target_date, status, notes)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning *`,
    [
      userId,
      goal.goal_type,
      goal.target_metric,
      goal.target_value,
      goal.current_value,
      goal.unit,
      goal.start_date,
      goal.target_date,
      goal.status,
      goal.notes || null,
    ]
  );
  res.json(rows[0]);
});

app.patch("/api/goals/:id", async (req, res) => {
  const updates = req.body || {};
  const { rows } = await query(
    `update health_goals
     set goal_type = coalesce($1, goal_type),
         target_metric = coalesce($2, target_metric),
         target_value = coalesce($3, target_value),
         current_value = coalesce($4, current_value),
         unit = coalesce($5, unit),
         start_date = coalesce($6, start_date),
         target_date = coalesce($7, target_date),
         status = coalesce($8, status),
         notes = coalesce($9, notes),
         updated_at = now()
     where id = $10
     returning *`,
    [
      updates.goal_type ?? null,
      updates.target_metric ?? null,
      updates.target_value ?? null,
      updates.current_value ?? null,
      updates.unit ?? null,
      updates.start_date ?? null,
      updates.target_date ?? null,
      updates.status ?? null,
      updates.notes ?? null,
      req.params.id,
    ]
  );
  res.json(rows[0]);
});

app.delete("/api/goals/:id", async (req, res) => {
  await query("delete from health_goals where id = $1", [req.params.id]);
  res.json({ success: true });
});

// Function-compatible endpoints
app.post("/api/functions/:name", async (req, res) => {
  const name = req.params.name;
  const body = req.body || {};

  try {
    if (name === "user-management") {
      const action = body.action;
      const data = body.data || {};

      if (action === "login") {
        const { rows } = await query(
          "select * from users where email = $1",
          [data.email]
        );
        const user = rows[0];
        if (!user) {
          res.json({ success: false, error: "User not found" });
          return;
        }
        const isBcryptHash = user.password_hash?.startsWith("$2");
        const match = isBcryptHash
          ? await bcrypt.compare(data.password, user.password_hash)
          : user.password_hash === data.password;
        if (!match) {
          res.json({ success: false, error: "Invalid credentials" });
          return;
        }
        const profile = await getUserProfile(user);
        res.json({ success: true, user: mapUser(user), profile });
        return;
      }

      if (action === "register") {
        const passwordHash = await bcrypt.hash(data.password, 10);
        const { rows: userRows } = await query(
          `insert into users (email, password_hash, first_name, last_name, role, phone)
           values ($1,$2,$3,$4,$5,$6)
           returning *`,
          [
            data.email,
            passwordHash,
            data.firstName,
            data.lastName,
            data.role,
            data.phone || null,
          ]
        );
        const user = userRows[0];

        let profile = null;
        if (data.role === "provider") {
          const { rows: profileRows } = await query(
            `insert into provider_profiles
             (user_id, specialty, accepting_new_patients, languages, rating, review_count)
             values ($1,$2,$3,$4,$5,$6)
             returning *`,
            [
              user.id,
              data.specialty || "General Practice",
              true,
              [],
              4.8,
              12,
            ]
          );
          profile = mapProviderProfile(profileRows[0]);
          const schedules = Array.isArray(data.schedules) ? data.schedules : [];
          if (schedules.length > 0) {
            const values = [];
            const params = [];
            schedules.forEach((schedule, index) => {
              const base = index * 5;
              params.push(
                user.id,
                schedule.dayOfWeek,
                schedule.startTime,
                schedule.endTime,
                schedule.slotDuration || 30
              );
              values.push(
                `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`
              );
            });
            await query(
              `insert into provider_schedules
               (provider_id, day_of_week, start_time, end_time, slot_duration)
               values ${values.join(",")}`,
              params
            );
          }
          await query(
            `insert into subscriptions
             (user_id, plan_id, status, billing_cycle, trial_ends_at)
             values ($1,$2,$3,$4, now() + interval '7 days')`,
            [user.id, "pehd-pro-199", "trialing", "monthly"]
          );
        } else if (data.role === "patient") {
          const { rows: profileRows } = await query(
            `insert into patient_profiles (user_id, allergies, conditions, medications)
             values ($1,$2,$3,$4)
             returning *`,
            [user.id, [], [], []]
          );
          profile = mapPatientProfile(profileRows[0]);
        }

        res.json({ success: true, user: mapUser(user), profile });
        return;
      }

      if (action === "getProviders") {
        const filters = data || {};
        const params = [];
        const conditions = ["u.role = 'provider'"];
        if (filters.specialty) {
          params.push(filters.specialty);
          conditions.push(`p.specialty = $${params.length}`);
        }
        if (filters.acceptingNew) {
          params.push(true);
          conditions.push(`p.accepting_new_patients = $${params.length}`);
        }
        const { rows } = await query(
          `select p.*, u.id as user_id, u.email, u.first_name, u.last_name, u.phone,
            exists (
              select 1 from provider_schedules s
              where s.provider_id = u.id and s.is_active = true
            ) as has_schedule
           from provider_profiles p
           join users u on u.id = p.user_id
           where ${conditions.join(" and ")}`,
          params
        );
        const providers = rows.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          specialty: row.specialty,
          credentials: row.credentials,
          npi: row.npi,
          bio: row.bio,
          years_experience: row.years_experience,
          accepting_new_patients: row.accepting_new_patients,
          languages: row.languages || [],
          consultation_fee: row.consultation_fee,
          rating: row.rating,
          review_count: row.review_count,
          profile_image: row.profile_image,
          has_schedule: row.has_schedule,
          user: {
            id: row.user_id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone,
          },
        }));
        res.json({ success: true, providers });
        return;
      }

      if (action === "getProviderSchedule") {
        const { rows } = await query(
          "select * from provider_schedules where provider_id = $1 order by day_of_week asc",
          [data.providerId]
        );
        res.json({ success: true, schedules: rows });
        return;
      }

      if (action === "updateProviderSchedule") {
        await query("delete from provider_schedules where provider_id = $1", [
          data.providerId,
        ]);
        const schedules = Array.isArray(data.schedules) ? data.schedules : [];
        if (schedules.length > 0) {
          const values = [];
          const params = [];
          schedules.forEach((schedule, index) => {
            const base = index * 5;
            params.push(
              data.providerId,
              schedule.day_of_week ?? schedule.dayOfWeek,
              schedule.start_time ?? schedule.startTime,
              schedule.end_time ?? schedule.endTime,
              schedule.slot_duration ?? schedule.slotDuration ?? 30
            );
            values.push(
              `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`
            );
          });
          await query(
            `insert into provider_schedules
             (provider_id, day_of_week, start_time, end_time, slot_duration)
             values ${values.join(",")}`,
            params
          );
        }
        res.json({ success: true });
        return;
      }

      if (action === "getProviderPatients") {
        const { rows } = await query(
          `select distinct u.id, u.email, u.first_name, u.last_name, u.phone,
           p.date_of_birth, p.gender, p.blood_type, p.allergies, p.conditions
           from appointments a
           join users u on u.id = a.patient_id
           left join patient_profiles p on p.user_id = u.id
           where a.provider_id = $1`,
          [data.providerId]
        );
        const patients = rows.map((row) => ({
          id: row.id,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          profile: row.date_of_birth
            ? {
                date_of_birth: row.date_of_birth,
                gender: row.gender,
                blood_type: row.blood_type,
                allergies: row.allergies || [],
                conditions: row.conditions || [],
              }
            : null,
        }));
        res.json({ success: true, patients });
        return;
      }

      if (action === "getPatientMedications") {
        const { rows } = await query(
          `select * from medications
           where patient_id = $1 and provider_id = $2
           order by created_at desc`,
          [data.patientId, data.providerId]
        );
        res.json({ success: true, medications: rows });
        return;
      }

      if (action === "getPatientMedicationsAll") {
        const { rows } = await query(
          `select m.*,
           u.first_name as provider_first_name,
           u.last_name as provider_last_name,
           p.specialty as provider_specialty
           from medications m
           left join users u on u.id = m.provider_id
           left join provider_profiles p on p.user_id = m.provider_id
           where m.patient_id = $1
           order by m.created_at desc`,
          [data.patientId]
        );
        res.json({ success: true, medications: rows });
        return;
      }

      if (action === "addMedication") {
        const { rows } = await query(
          `insert into medications
           (patient_id, provider_id, medication_name, dosage, frequency, start_date, end_date, instructions, is_active)
           values ($1,$2,$3,$4,$5,$6,$7,$8,true)
           returning *`,
          [
            data.patientId,
            data.providerId,
            data.medicationName,
            data.dosage,
            data.frequency,
            data.startDate,
            data.endDate,
            data.instructions,
          ]
        );
        res.json({ success: true, medication: rows[0] });
        return;
      }

      if (action === "updateMedication") {
        const updates = data.updates || {};
        const { rows } = await query(
          `update medications
           set medication_name = coalesce($1, medication_name),
               dosage = coalesce($2, dosage),
               frequency = coalesce($3, frequency),
               start_date = coalesce($4, start_date),
               end_date = coalesce($5, end_date),
               instructions = coalesce($6, instructions),
               is_active = coalesce($7, is_active)
           where id = $8
           returning *`,
          [
            updates.medication_name ?? null,
            updates.dosage ?? null,
            updates.frequency ?? null,
            updates.start_date ?? null,
            updates.end_date ?? null,
            updates.instructions ?? null,
            updates.is_active ?? null,
            data.medicationId,
          ]
        );
        res.json({ success: true, medication: rows[0] });
        return;
      }

      if (action === "deleteMedication") {
        await query("delete from medications where id = $1", [
          data.medicationId,
        ]);
        res.json({ success: true });
        return;
      }

      jsonError(res, "Unknown action for user-management");
      return;
    }

    if (name === "appointment-management") {
      const action = body.action;
      const data = body.data || {};

      if (action === "getBookedSlots") {
        const { rows } = await query(
          `select scheduled_time from appointments
           where provider_id = $1 and scheduled_date = $2 and status != 'cancelled'`,
          [data.providerId, data.date]
        );
        res.json({
          success: true,
          bookedSlots: rows.map((row) => row.scheduled_time.slice(0, 5)),
        });
        return;
      }

      if (action === "bookAppointment") {
        const { rows } = await query(
          `insert into appointments
           (patient_id, provider_id, scheduled_date, scheduled_time, duration, appointment_type, status, reason, notes, is_telehealth)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           returning *`,
          [
            data.patientId,
            data.providerId,
            data.date,
            data.time,
            data.duration || 30,
            data.appointmentType || "Consultation",
            "scheduled",
            data.reason || null,
            data.notes || null,
            data.isTelehealth || false,
          ]
        );
        const appointment = rows[0];
        await createNotification({
          userId: data.providerId,
          type: "appointment",
          title: "New appointment booked",
          body: `A patient booked ${appointment.scheduled_date} at ${appointment.scheduled_time.slice(0, 5)}.`,
          metadata: {
            appointmentId: appointment.id,
            patientId: data.patientId,
            scheduledDate: appointment.scheduled_date,
            scheduledTime: appointment.scheduled_time.slice(0, 5),
            isTelehealth: appointment.is_telehealth,
          },
        });
        res.json({ success: true, appointment: rows[0] });
        return;
      }

      if (action === "getAppointments") {
        const params = [];
        const conditions = [];
        params.push(data.userId);
        if (data.role === "provider") {
          conditions.push(`a.provider_id = $${params.length}`);
        } else {
          conditions.push(`a.patient_id = $${params.length}`);
        }
        if (data.status) {
          params.push(data.status);
          conditions.push(`a.status = $${params.length}`);
        }
        if (data.startDate) {
          params.push(data.startDate);
          conditions.push(`a.scheduled_date >= $${params.length}`);
        }
        if (data.endDate) {
          params.push(data.endDate);
          conditions.push(`a.scheduled_date <= $${params.length}`);
        }
        const { rows } = await query(
          `select a.*,
           p.id as patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email, p.phone as patient_phone,
           pr.id as provider_id, pr.first_name as provider_first_name, pr.last_name as provider_last_name, pr.email as provider_email, pr.phone as provider_phone
           from appointments a
           left join users p on p.id = a.patient_id
           left join users pr on pr.id = a.provider_id
           where ${conditions.join(" and ")}
           order by a.scheduled_date desc, a.scheduled_time desc`,
          params
        );
        const appointments = rows.map((row) => ({
          id: row.id,
          patient_id: row.patient_id,
          provider_id: row.provider_id,
          scheduled_date: row.scheduled_date,
          scheduled_time: row.scheduled_time.slice(0, 5),
          duration: row.duration,
          appointment_type: row.appointment_type,
          status: row.status,
          reason: row.reason,
          notes: row.notes,
          is_telehealth: row.is_telehealth,
          patient: row.patient_id
            ? {
                id: row.patient_id,
                first_name: row.patient_first_name,
                last_name: row.patient_last_name,
                email: row.patient_email,
                phone: row.patient_phone,
              }
            : null,
          provider: row.provider_id
            ? {
                id: row.provider_id,
                first_name: row.provider_first_name,
                last_name: row.provider_last_name,
                email: row.provider_email,
                phone: row.provider_phone,
              }
            : null,
        }));
        res.json({ success: true, appointments });
        return;
      }

      if (action === "cancelAppointment") {
        await query("update appointments set status = 'cancelled' where id = $1", [
          data.appointmentId,
        ]);
        res.json({ success: true });
        return;
      }

      if (action === "updateAppointment") {
        const updates = data.updates || {};
        await query(
          `update appointments
           set status = coalesce($1, status),
               notes = coalesce($2, notes),
               reason = coalesce($3, reason),
               scheduled_date = coalesce($4, scheduled_date),
               scheduled_time = coalesce($5, scheduled_time),
               duration = coalesce($6, duration),
               appointment_type = coalesce($7, appointment_type),
               is_telehealth = coalesce($8, is_telehealth)
           where id = $9`,
          [
            updates.status ?? null,
            updates.notes ?? null,
            updates.reason ?? null,
            updates.scheduledDate ?? null,
            updates.scheduledTime ?? null,
            updates.duration ?? null,
            updates.appointmentType ?? null,
            updates.isTelehealth ?? null,
            data.appointmentId,
          ]
        );
        res.json({ success: true });
        return;
      }

      jsonError(res, "Unknown action for appointment-management");
      return;
    }

    if (name === "messaging") {
      const action = body.action;
      const data = body.data || {};

      if (action === "getConversations") {
        const { rows: messageRows } = await query(
          `select * from messages
           where sender_id = $1 or receiver_id = $1
           order by created_at desc`,
          [data.userId]
        );
        const partnerIds = new Set(
          messageRows.map((m) =>
            m.sender_id === data.userId ? m.receiver_id : m.sender_id
          )
        );
        const ids = Array.from(partnerIds);
        const { rows: partnerRows } = ids.length
          ? await query(
              `select u.*, p.specialty
               from users u
               left join provider_profiles p on p.user_id = u.id
               where u.id = any($1)`,
              [ids]
            )
          : { rows: [] };
        const partnerMap = new Map(
          partnerRows.map((row) => [
            row.id,
            {
              id: row.id,
              email: row.email,
              first_name: row.first_name,
              last_name: row.last_name,
              role: row.role,
              specialty: row.specialty || undefined,
            },
          ])
        );

        const conversations = [];
        const unreadMap = new Map();
        messageRows.forEach((message) => {
          if (message.receiver_id === data.userId && !message.is_read) {
            const partnerId = message.sender_id;
            unreadMap.set(partnerId, (unreadMap.get(partnerId) || 0) + 1);
          }
        });

        const seen = new Set();
        messageRows.forEach((message) => {
          const partnerId =
            message.sender_id === data.userId
              ? message.receiver_id
              : message.sender_id;
          if (seen.has(partnerId)) return;
          seen.add(partnerId);
          conversations.push({
            partnerId,
            partner: partnerMap.get(partnerId),
            lastMessage: message,
            unreadCount: unreadMap.get(partnerId) || 0,
          });
        });

        res.json({ success: true, conversations });
        return;
      }

      if (action === "getConversation") {
        const { rows } = await query(
          `select * from messages
           where (sender_id = $1 and receiver_id = $2)
              or (sender_id = $2 and receiver_id = $1)
           order by created_at asc`,
          [data.userId1, data.userId2]
        );
        res.json({ success: true, messages: rows });
        return;
      }

      if (action === "markMessagesRead") {
        await query(
          `update messages set is_read = true
           where receiver_id = $1 and sender_id = $2`,
          [data.userId, data.senderId]
        );
        res.json({ success: true });
        return;
      }

      if (action === "sendMessage") {
        const { rows } = await query(
          `insert into messages (sender_id, receiver_id, content, is_read)
           values ($1,$2,$3,false)
           returning *`,
          [data.senderId, data.receiverId, data.content]
        );
        await createNotification({
          userId: data.receiverId,
          type: "message",
          title: "New message",
          body: data.content?.slice(0, 160) || "You have a new message.",
          metadata: {
            messageId: rows[0].id,
            senderId: data.senderId,
          },
        });
        res.json({ success: true, message: rows[0] });
        return;
      }

      if (action === "getAllProviders") {
        const { rows } = await query(
          `select u.id, u.email, u.first_name, u.last_name, u.role, p.specialty
           from users u
           left join provider_profiles p on p.user_id = u.id
           where u.role = 'provider'
           order by u.last_name asc`
        );
        res.json({ success: true, providers: rows });
        return;
      }

      jsonError(res, "Unknown action for messaging");
      return;
    }

    if (name === "health-chatbot") {
      const message = body.message || "";
      const response = `Local assistant response: ${message.slice(0, 200)}. For a real assistant, connect to your preferred model locally.`;
      res.json({ response });
      return;
    }

    if (name === "ai-medical-scribe") {
      const action = body.action;
      if (action === "extract_physical_exam") {
        res.json({
          success: true,
          result: {
            generalAppearance: "Well-appearing, in no acute distress.",
            findings: {
              cardiovascular: {
                finding: "Regular rate and rhythm, no murmurs",
                status: "normal",
                notes: "",
              },
              respiratory: {
                finding: "Clear to auscultation bilaterally",
                status: "normal",
                notes: "",
              },
              abdomen: {
                finding: "Soft, non-tender, non-distended",
                status: "normal",
                notes: "",
              },
            },
          },
        });
        return;
      }

      res.json({
        success: true,
        result: {
          subjective: {
            chiefComplaint: "Fatigue and intermittent headaches",
            historyOfPresentIllness:
              "Patient reports 2 weeks of fatigue with occasional morning headaches.",
            reviewOfSystems: {
              constitutional: ["fatigue"],
              cardiovascular: [],
              respiratory: [],
              gastrointestinal: [],
              neurological: ["headache"],
            },
            pastMedicalHistory: ["Hypertension"],
            medications: ["Lisinopril 10mg daily"],
            allergies: ["NKDA"],
            socialHistory: "Non-smoker, occasional alcohol.",
            familyHistory: "Father with coronary artery disease.",
          },
          objective: {
            vitals: {
              heartRate: "72",
              bloodPressure: "118/76",
              temperature: "98.4 F",
              respiratoryRate: "16",
              o2Saturation: "98%",
            },
            generalAppearance: "Alert, well-appearing",
            physicalExam: {
              cardiovascular: { finding: "RRR, no murmurs", status: "normal" },
              respiratory: { finding: "Clear to auscultation", status: "normal" },
            },
          },
          assessment: {
            diagnoses: [
              {
                condition: "Tension headache",
                icdCode: "G44.209",
                status: "likely",
                rationale: "Intermittent headaches without red flags",
              },
            ],
            clinicalImpression: "Symptoms most consistent with tension headaches.",
          },
          plan: {
            diagnosticTests: ["CBC", "TSH"],
            medications: [
              { name: "Ibuprofen", dosage: "400mg", instructions: "PRN headache" },
            ],
            procedures: [],
            referrals: [],
            patientEducation: ["Hydration", "Sleep hygiene"],
            followUp: "Follow up in 2 weeks or sooner if worsening.",
          },
        },
      });
      return;
    }

    if (name === "clinical-diagnosis") {
      const action = body.action;
      if (action === "generate_diagnosis") {
        const rosAnswers = Array.isArray(body.rosAnswers) ? body.rosAnswers : [];
        const vitals = body.vitals || {};
        const openAiKey = process.env.OPENAI_API_KEY;
        const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

        if (openAiKey) {
          try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiKey}`,
              },
              body: JSON.stringify({
                model: openAiModel,
                temperature: 0.4,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a clinical decision support assistant. Return ONLY JSON with keys: " +
                      "aiSummary (string), differentialDiagnoses (array), recommendedLabs (array). " +
                      "Each differentialDiagnoses item must include: condition, icdCode, probability (high|moderate|low), " +
                      "supportingSymptoms (array), rulingOutFactors (array), recommendedTests (array), urgency (routine|urgent|emergent). " +
                      "Each recommendedLabs item must include: testName, testCode, reason, priority (routine|urgent|stat), " +
                      "relatedDiagnoses (array), fastingRequired (boolean).",
                  },
                  {
                    role: "user",
                    content: JSON.stringify({ rosAnswers, vitals }),
                  },
                ],
              }),
            });

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            const parsed = parseJsonFromModel(content);

            if (parsed && typeof parsed === "object") {
              const diagnoses = Array.isArray(parsed.differentialDiagnoses)
                ? parsed.differentialDiagnoses
                : [];
              const labs = Array.isArray(parsed.recommendedLabs)
                ? parsed.recommendedLabs
                : [];

              res.json({
                differentialDiagnoses: diagnoses.map((dx) => ({
                  id: uuidv4(),
                  condition: String(dx.condition || "Unspecified condition"),
                  icdCode: String(dx.icdCode || "R69"),
                  probability: dx.probability === "high" || dx.probability === "low" ? dx.probability : "moderate",
                  supportingSymptoms: Array.isArray(dx.supportingSymptoms) ? dx.supportingSymptoms : [],
                  rulingOutFactors: Array.isArray(dx.rulingOutFactors) ? dx.rulingOutFactors : [],
                  recommendedTests: Array.isArray(dx.recommendedTests) ? dx.recommendedTests : [],
                  urgency: dx.urgency === "urgent" || dx.urgency === "emergent" ? dx.urgency : "routine",
                })),
                recommendedLabs: labs.map((lab) => ({
                  id: uuidv4(),
                  testName: String(lab.testName || lab.test || "General Lab Panel"),
                  testCode: String(lab.testCode || lab.cptCode || ""),
                  reason: String(lab.reason || "Clinical assessment"),
                  priority: lab.priority === "urgent" || lab.priority === "stat" ? lab.priority : "routine",
                  relatedDiagnoses: Array.isArray(lab.relatedDiagnoses) ? lab.relatedDiagnoses : [],
                  fastingRequired: Boolean(lab.fastingRequired),
                })),
                aiSummary: String(parsed.aiSummary || "AI-generated assessment completed."),
              });
              return;
            }
          } catch (err) {
            console.error("OpenAI clinical diagnosis error:", err);
          }
        }

        res.json({
          differentialDiagnoses: [
            {
              id: uuidv4(),
              condition: "Iron deficiency",
              icdCode: "D50.9",
              probability: "moderate",
              supportingSymptoms: ["fatigue", "low energy"],
              rulingOutFactors: ["no bleeding reported"],
              recommendedTests: ["CBC", "Ferritin"],
              urgency: "routine",
            },
          ],
          recommendedLabs: [
            {
              id: uuidv4(),
              testName: "Complete Blood Count (CBC)",
              testCode: "85025",
              reason: "Check anemia and overall blood counts",
              priority: "routine",
              relatedDiagnoses: ["Iron deficiency"],
              fastingRequired: false,
            },
          ],
          aiSummary:
            "Local assessment generated. Review history and confirm with labs.",
        });
        return;
      }

      if (action === "generate_treatment") {
        const diagnoses = Array.isArray(body.diagnoses) ? body.diagnoses : [];
        const physicalExam = Array.isArray(body.physicalExam) ? body.physicalExam : [];
        const patientData = body.patientData || {};
        const openAiKey = process.env.OPENAI_API_KEY;
        const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

        if (openAiKey) {
          try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiKey}`,
              },
              body: JSON.stringify({
                model: openAiModel,
                temperature: 0.4,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a clinical treatment planning assistant. Return ONLY JSON with keys: " +
                      "medications (array), lifestyleRecommendations (array), orthomolecularRecommendations (array), followUpInstructions (string). " +
                      "Medication fields: name, dosage, frequency, duration, route (oral|topical|injection|inhalation|other), instructions, warnings (array), interactions (array). " +
                      "Lifestyle fields: category (diet|exercise|sleep|stress|habits|other), recommendation, priority (high|medium|low), details, resources (array). " +
                      "Orthomolecular fields: supplement, dosage, frequency, reason, contraindications (array), interactions (array), evidenceLevel (strong|moderate|emerging).",
                  },
                  {
                    role: "user",
                    content: JSON.stringify({ diagnoses, physicalExam, patientData }),
                  },
                ],
              }),
            });

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            const parsed = parseJsonFromModel(content);

            if (parsed && typeof parsed === "object") {
              const medications = Array.isArray(parsed.medications) ? parsed.medications : [];
              const lifestyle = Array.isArray(parsed.lifestyleRecommendations) ? parsed.lifestyleRecommendations : [];
              const ortho = Array.isArray(parsed.orthomolecularRecommendations) ? parsed.orthomolecularRecommendations : [];

              res.json({
                medications: medications.map((med) => ({
                  id: uuidv4(),
                  name: String(med.name || "Medication"),
                  dosage: String(med.dosage || "TBD"),
                  frequency: String(med.frequency || "TBD"),
                  duration: String(med.duration || "TBD"),
                  route: ["oral", "topical", "injection", "inhalation", "other"].includes(med.route)
                    ? med.route
                    : "oral",
                  instructions: String(med.instructions || ""),
                  warnings: Array.isArray(med.warnings) ? med.warnings : [],
                  interactions: Array.isArray(med.interactions) ? med.interactions : [],
                })),
                lifestyleRecommendations: lifestyle.map((rec) => ({
                  id: uuidv4(),
                  category: ["diet", "exercise", "sleep", "stress", "habits", "other"].includes(rec.category)
                    ? rec.category
                    : "other",
                  recommendation: String(rec.recommendation || "Lifestyle recommendation"),
                  priority: ["high", "medium", "low"].includes(rec.priority) ? rec.priority : "medium",
                  details: String(rec.details || ""),
                  resources: Array.isArray(rec.resources) ? rec.resources : [],
                })),
                orthomolecularRecommendations: ortho.map((item) => ({
                  id: uuidv4(),
                  supplement: String(item.supplement || "Supplement"),
                  dosage: String(item.dosage || "TBD"),
                  frequency: String(item.frequency || "TBD"),
                  reason: String(item.reason || ""),
                  contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
                  interactions: Array.isArray(item.interactions) ? item.interactions : [],
                  evidenceLevel: ["strong", "moderate", "emerging"].includes(item.evidenceLevel)
                    ? item.evidenceLevel
                    : "moderate",
                })),
                followUpInstructions: String(parsed.followUpInstructions || "Follow up in 2-4 weeks."),
              });
              return;
            }
          } catch (err) {
            console.error("OpenAI treatment plan error:", err);
          }
        }

        res.json({
          medications: [
            {
              id: uuidv4(),
              name: "Vitamin D3",
              dosage: "2000 IU",
              frequency: "Daily",
              duration: "8 weeks",
              route: "oral",
              instructions: "Take with food",
              warnings: [],
              interactions: [],
            },
          ],
          lifestyleRecommendations: [
            {
              id: uuidv4(),
              category: "sleep",
              recommendation: "Aim for 7-9 hours of sleep nightly",
              priority: "medium",
              details: "Maintain a consistent bedtime and reduce screen time before sleep.",
              resources: [],
            },
          ],
          orthomolecularRecommendations: [
            {
              id: uuidv4(),
              supplement: "Magnesium glycinate",
              dosage: "200-400mg",
              frequency: "Nightly",
              reason: "Support relaxation and sleep",
              contraindications: [],
              interactions: [],
              evidenceLevel: "moderate",
            },
          ],
          followUpInstructions: "Follow up in 4 weeks to reassess symptoms.",
        });
        return;
      }

      jsonError(res, "Unknown action for clinical-diagnosis");
      return;
    }

    if (name === "lab-interpreter") {
      const action = body.action;
      if (action === "connect_lab_portal") {
        res.json({
          success: false,
          error: "Lab portal integration is not configured. Please upload a PDF report."
        });
        return;
      }

      if (action === "parse_lab_text") {
        const text = String(body.labText || "").trim();
        const openAiKey = process.env.OPENAI_API_KEY;
        const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

        if (!text) {
          res.json({ success: false, error: "No text extracted from PDF." });
          return;
        }

        if (!openAiKey) {
          res.json({
            success: false,
            error: "OpenAI API key is required to parse lab reports.",
          });
          return;
        }

        try {
          const prompt = {
            role: "system",
            content:
              "You are a medical lab parser. Extract lab results from the provided text and return JSON " +
              "with keys: labFacility (string), orderingProvider (string), collectionDate (ISO string or empty), " +
              "results (array of objects: name, value (number), unit, status (normal|low|high|critical), " +
              "normalRange, category). Return only JSON.",
          };

          const userMessage = {
            role: "user",
            content: text,
          };

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: openAiModel,
              temperature: 0,
              messages: [prompt, userMessage],
              response_format: { type: "json_object" },
            }),
          });

          const payload = await response.json();
          const content = payload?.choices?.[0]?.message?.content;
          if (!content) {
            res.json({ success: false, error: "Unable to parse lab report text." });
            return;
          }
          const parsed = JSON.parse(content);
          if (!parsed?.results || parsed.results.length === 0) {
            res.json({ success: false, error: "No lab results could be parsed from this PDF." });
            return;
          }
          res.json({ success: true, parsed });
        } catch (error) {
          console.error("OpenAI parse error:", error);
          res.json({ success: false, error: "Failed to parse lab report text." });
        }
        return;
      }

      if (action === "interpret_results") {
        const results = Array.isArray(body.labResults) ? body.labResults : [];
        const openAiKey = process.env.OPENAI_API_KEY;
        const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

        if (openAiKey) {
          try {
            const prompt = {
              role: "system",
              content:
                "You are a clinical lab assistant. Analyze lab results and return a JSON object with fields: " +
                "overallSummary (string), urgencyLevel (routine|monitor|critical), warningFlags (string[]), " +
                "interpretations (array of objects: testName, interpretation, clinicalSignificance, recommendations (string[]), " +
                "followUpRequired (boolean), followUpTimeframe (string)), " +
                "generalRecommendations (string[]). Do not include any extra keys or markdown."
            };

            const userMessage = {
              role: "user",
              content: JSON.stringify({
                source: body.source || "uploaded",
                labResults: results
              })
            };

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiKey}`,
              },
              body: JSON.stringify({
                model: openAiModel,
                temperature: 0.2,
                messages: [prompt, userMessage],
                response_format: { type: "json_object" }
              })
            });

            const payload = await response.json();
            const content = payload?.choices?.[0]?.message?.content;
            if (content) {
              const interpretation = JSON.parse(content);
              res.json({ success: true, interpretation });
              return;
            }
          } catch (error) {
            console.error("OpenAI interpretation error:", error);
          }
        }

        const parseRange = (range) => {
          if (!range || typeof range !== "string") return {};
          const cleaned = range.replace(/[^0-9.<>=-]/g, "").trim();
          if (!cleaned) return {};
          const between = cleaned.match(/^(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/);
          if (between) {
            return { low: Number(between[1]), high: Number(between[3]) };
          }
          const upper = cleaned.match(/^(<=|<)(\d+(\.\d+)?)/);
          if (upper) {
            return { high: Number(upper[2]) };
          }
          const lower = cleaned.match(/^(>=|>)(\d+(\.\d+)?)/);
          if (lower) {
            return { low: Number(lower[2]) };
          }
          return {};
        };

        const abnormal = results.filter((r) => r.status && r.status !== "normal");
        const critical = results.filter((r) => r.status === "critical");

        const urgencyLevel =
          critical.length > 0 ? "critical" : abnormal.length > 0 ? "monitor" : "routine";

        const overallSummary =
          results.length === 0
            ? "No lab results were available to analyze."
            : abnormal.length === 0
              ? `All ${results.length} result(s) fall within the expected reference range.`
              : `${abnormal.length} of ${results.length} result(s) are outside the reference range.`;

        const warningFlags = critical.map((r) => {
          const unit = r.unit ? ` ${r.unit}` : "";
          return `${r.name} is critical at ${r.value}${unit}.`;
        });

        const interpretations = results.map((r) => {
          const statusLabel = (r.status || "unknown").toUpperCase();
          const rangeText = r.normalRange ? `Reference: ${r.normalRange}.` : "";
          const unitText = r.unit ? ` ${r.unit}` : "";
          const range = parseRange(r.normalRange);
          let deviationText = "";

          if (typeof r.value === "number") {
            if (r.status === "high" && typeof range.high === "number") {
              const diff = r.value - range.high;
              const pct = (diff / range.high) * 100;
              deviationText = `Above upper limit by ${diff.toFixed(2)}${unitText} (${pct.toFixed(1)}%).`;
            } else if (r.status === "low" && typeof range.low === "number") {
              const diff = range.low - r.value;
              const pct = (diff / range.low) * 100;
              deviationText = `Below lower limit by ${diff.toFixed(2)}${unitText} (${pct.toFixed(1)}%).`;
            }
          }

          const interpretation =
            r.status === "normal"
              ? `${r.name} is within the expected range at ${r.value}${unitText}.`
              : `${r.name} is ${statusLabel} at ${r.value}${unitText}. ${rangeText} ${deviationText}`.trim();

          const clinicalSignificance =
            r.status === "critical"
              ? "Markedly outside the reference range and needs prompt review."
              : r.status === "high" || r.status === "low"
                ? "Outside the reference range and may warrant follow-up."
                : "Within reference range.";

          const recommendations =
            r.status === "normal"
              ? [`No action suggested for ${r.name} based on this result.`]
              : [
                  `Review possible causes for ${r.name} being ${statusLabel}.`,
                  `Consider a follow-up test for ${r.name} if clinically indicated.`,
                ];

          return {
            testName: r.name,
            interpretation,
            clinicalSignificance,
            recommendations,
            followUpRequired: r.status !== "normal",
            followUpTimeframe: r.status === "critical" ? "ASAP" : "2-4 weeks",
          };
        });

        const generalRecommendations =
          abnormal.length === 0
            ? ["No abnormal results detected in this report."]
            : [
                `Follow up on: ${abnormal.map((r) => r.name).join(", ")}.`,
              ];

        res.json({
          success: true,
          interpretation: {
            urgencyLevel,
            overallSummary,
            warningFlags,
            interpretations,
            generalRecommendations,
          },
        });
        return;
      }

      jsonError(res, "Unknown action for lab-interpreter");
      return;
    }

    if (name === "analyze-heart-scan") {
      const heartRate = body.heartRate || 0;
      const analysis = `Local analysis: heart rate ${heartRate} BPM. Maintain hydration and follow up if symptoms persist.`;
      res.json({ success: true, analysis, derivedMetrics: body.derivedMetrics });
      return;
    }

    if (name === "subscription-handler") {
      const action = body.action;
      const userId = body.userId;

      if (action === "get_subscription") {
        const { rows } = await query(
          `select * from subscriptions where user_id = $1 order by started_at desc limit 1`,
          [userId]
        );
        res.json({ subscription: rows[0] || null });
        return;
      }

      if (action === "get_payment_history") {
        const { rows } = await query(
          `select * from payment_history where user_id = $1 order by created_at desc`,
          [userId]
        );
        res.json({ payments: rows });
        return;
      }

      if (action === "subscribe") {
        const { rows } = await query(
          `insert into subscriptions (user_id, plan_id, status, billing_cycle)
           values ($1,$2,'active',$3)
           returning *`,
          [userId, body.planId, body.billingCycle]
        );
        await query(
          `insert into payment_history (user_id, plan_id, amount, status)
           values ($1,$2,$3,'paid')`,
          [userId, body.planId, 99]
        );
        res.json({ subscription: rows[0], message: "Subscription activated." });
        return;
      }

      if (action === "cancel_subscription") {
        await query(
          `update subscriptions set status = 'cancelled', canceled_at = now()
           where user_id = $1 and status = 'active'`,
          [userId]
        );
        res.json({ message: "Subscription cancelled." });
        return;
      }

      jsonError(res, "Unknown action for subscription-handler");
      return;
    }

    jsonError(res, `Unknown function: ${name}`);
  } catch (error) {
    console.error("API error:", error);
    jsonError(res, error.message || "Server error", 500);
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Local API running on http://localhost:${port}`);
});
