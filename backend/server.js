import { Sequelize, DataTypes, Op } from 'sequelize';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import * as jose from 'jose';
import OpenAI from 'openai';

dotenv.config();

const azureEndpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/?$/, '/');
const azureClient = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${azureEndpoint}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultQuery: { 'api-version': '2024-12-01-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
});

const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const useSsl = process.env.PGSSLMODE === 'require';

const app = express();
const PORT = process.env.PORT || 5001;

const ASGARDEO_ORG = process.env.ASGARDEO_ORG || 'fullstack39';
const JWKS_URI = `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`;
const USERINFO_URI = `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/userinfo`;

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    define: {
      schema: DB_SCHEMA,
    },
  }
);

// ── Models ────────────────────────────────────────────────────────────────────

const Rider = sequelize.define(
  'Rider',
  {
    riderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    cardExpiry: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: '01/00',
    },
    cardCvv: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: '000',
    },
    billingAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    billingCity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    billingState: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    billingZip: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'riders',
    underscored: true,
    timestamps: false,
  }
);

const Driver = sequelize.define(
  'Driver',
  {
    driverId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    carMake: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    carModel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    carColor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    licensePlate: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'drivers',
    underscored: true,
    timestamps: false,
  }
);

const Ride = sequelize.define(
  'Ride',
  {
    rideId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dropoffLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('requested', 'accepted', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'requested',
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
    },
    ratingGiven: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'rides',
    underscored: true,
    timestamps: false,
  }
);

Rider.hasMany(Ride, { foreignKey: 'riderId', as: 'rides' });
Ride.belongsTo(Rider, { foreignKey: 'riderId', as: 'rider' });

Driver.hasMany(Ride, { foreignKey: 'driverId', as: 'rides' });
Ride.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Auth middleware

async function authMiddleware(req, res, next) {
  const authHeader = (req.headers.authorization || '').trim();

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing auth',
      detail: 'Send Authorization: Bearer <access_token>',
    });
  }

  const token = authHeader.slice(7).trim();
  const looksLikeJwt = token && token.split('.').length === 3;

  if (!looksLikeJwt) {
    return res.status(401).json({
      error: 'Access token is not a JWT. In Asgardeo, set your app to use JWT access tokens (Protocol tab).',
    });
  }

  try {
    const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URI));
    const { payload } = await jose.jwtVerify(token, JWKS);
    req.userId = payload.sub;
    req.userEmail = payload.email || payload.username || null;

    if (!req.userEmail) {
      const uiRes = await fetch(USERINFO_URI, { headers: { Authorization: `Bearer ${token}` } });
      if (uiRes.ok) {
        const ui = await uiRes.json();
        req.userEmail = ui.email || ui.username || null;
      }
    }

    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message,
    });
  }
}

// ROUTES

app.get('/', (req, res) => {
  res.send('Crusin backend is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// RIDERS
app.use('/riders', authMiddleware);

app.get('/riders', async (req, res) => {
  try {
    const riders = await Rider.findAll({ order: [['riderId', 'ASC']] });
    res.json(riders);
  } catch (err) {
    console.error('Error fetching riders:', err);
    res.status(500).json({ error: 'Failed to fetch riders' });
  }
});

// Look up a rider by Asgardeo email — used on login to check if user already has an account
app.get('/riders/lookup', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required' });
  try {
    const rider = await Rider.findOne({ where: { email } });
    if (!rider) return res.status(404).json({ error: 'Rider not found' });
    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: 'Failed to lookup rider' });
  }
});

app.get('/riders/:id', async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });
    res.json(rider);
  } catch (err) {
    console.error('Error fetching rider:', err);
    res.status(500).json({ error: 'Failed to fetch rider' });
  }
});

app.post('/riders', async (req, res) => {
  const { firstName, lastName, email, phone, cardNumber, cardExpiry, cardCvv, billingAddress, billingCity, billingState, billingZip } = req.body;
  
  // Validate required fields
  const requiredFields = { firstName, lastName, email, phone, cardNumber, cardExpiry, cardCvv, billingAddress, billingCity, billingState, billingZip };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value || (typeof value === 'string' && !value.trim()))
    .map(([key]) => key);
  
  if (missingFields.length > 0) {
    console.warn('Missing or empty fields:', missingFields, 'Received:', requiredFields);
    return res.status(400).json({ error: 'All fields are required', missingFields });
  }
  try {
    const rider = await Rider.create({ firstName, lastName, email, phone, cardNumber, cardExpiry, cardCvv, billingAddress, billingCity, billingState, billingZip });
    res.status(201).json(rider);
  } catch (err) {
    console.error('Error creating rider:', err);
    res.status(500).json({ error: 'Failed to create rider' });
  }
});

app.put('/riders/:id', async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });
    if (rider.email !== req.userEmail) return res.status(403).json({ error: 'Forbidden: you can only update your own profile' });
    const { firstName, lastName, email, phone, cardNumber, cardExpiry, cardCvv, billingAddress, billingCity, billingState, billingZip } = req.body;
    rider.firstName = firstName ?? rider.firstName;
    rider.lastName = lastName ?? rider.lastName;
    rider.email = email ?? rider.email;
    rider.phone = phone ?? rider.phone;
    rider.cardNumber = cardNumber ?? rider.cardNumber;
    rider.cardExpiry = cardExpiry ?? rider.cardExpiry;
    rider.cardCvv = cardCvv ?? rider.cardCvv;
    rider.billingAddress = billingAddress ?? rider.billingAddress;
    rider.billingCity = billingCity ?? rider.billingCity;
    rider.billingState = billingState ?? rider.billingState;
    rider.billingZip = billingZip ?? rider.billingZip;
    await rider.save();
    res.json(rider);
  } catch (err) {
    console.error('Error updating rider:', err);
    res.status(500).json({ error: 'Failed to update rider' });
  }
});

app.delete('/riders/:id', async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });
    if (rider.email !== req.userEmail) return res.status(403).json({ error: 'Forbidden: you can only delete your own profile' });
    await rider.destroy();
    res.json({ message: 'Rider deleted successfully' });
  } catch (err) {
    console.error('Error deleting rider:', err);
    res.status(500).json({ error: 'Failed to delete rider' });
  }
});

// DRIVERS
app.use('/drivers', authMiddleware);

app.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.findAll({ order: [['driverId', 'ASC']] });
    res.json(drivers);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Look up a driver by Asgardeo email — used on login to check if user already has an account
app.get('/drivers/lookup', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required' });
  try {
    const driver = await Driver.findOne({ where: { email } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: 'Failed to lookup driver' });
  }
});

app.get('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error('Error fetching driver:', err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

app.post('/drivers', async (req, res) => {
  const { firstName, lastName, email, carMake, carModel, carColor, licensePlate } = req.body;
  if (!firstName || !lastName || !email || !carMake || !carModel || !carColor || !licensePlate) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const driver = await Driver.create({ firstName, lastName, email, carMake, carModel, carColor, licensePlate });
    res.status(201).json(driver);
  } catch (err) {
    console.error('Error creating driver:', err);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

app.put('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.email !== req.userEmail) return res.status(403).json({ error: 'Forbidden: you can only update your own profile' });
    const { firstName, lastName, email, carMake, carModel, carColor, licensePlate, rating } = req.body;
    driver.firstName = firstName ?? driver.firstName;
    driver.lastName = lastName ?? driver.lastName;
    driver.email = email ?? driver.email;
    driver.carMake = carMake ?? driver.carMake;
    driver.carModel = carModel ?? driver.carModel;
    driver.carColor = carColor ?? driver.carColor;
    driver.licensePlate = licensePlate ?? driver.licensePlate;
    driver.rating = rating ?? driver.rating;
    await driver.save();
    res.json(driver);
  } catch (err) {
    console.error('Error updating driver:', err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

app.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.email !== req.userEmail) return res.status(403).json({ error: 'Forbidden: you can only delete your own profile' });
    await driver.destroy();
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// RIDES
app.use('/rides', authMiddleware);

app.get('/rides', async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const rides = await Ride.findAll({
      where,
      include: [
        { model: Rider, as: 'rider', attributes: ['riderId', 'firstName', 'lastName'] },
        { model: Driver, as: 'driver', attributes: ['driverId', 'firstName', 'lastName'] },
      ],
      order: [['rideId', 'ASC']],
    });
    res.json(rides);
  } catch (err) {
    console.error('Error fetching rides:', err);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

app.get('/rides/rider/:riderId', async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.riderId);
    if (!rider || rider.email !== req.userEmail) return res.status(403).json({ error: 'Forbidden: you can only view your own rides' });
    const rides = await Ride.findAll({
      where: { riderId: req.params.riderId },
      include: [
        { model: Rider, as: 'rider', attributes: ['riderId', 'firstName', 'lastName'] },
        { model: Driver, as: 'driver', attributes: ['driverId', 'firstName', 'lastName'] },
      ],
      order: [['rideId', 'ASC']],
    });
    res.json(rides);
  } catch (err) {
    console.error('Error fetching rides for rider:', err);
    res.status(500).json({ error: 'Failed to fetch rides for rider' });
  }
});

app.get('/rides/driver/:driverId', async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.driverId);
    if (!driver || driver.email !== req.userEmail) return res.status(403).json({ error: 'Forbidden: you can only view your own rides' });
    const rides = await Ride.findAll({
      where: { driverId: req.params.driverId, status: 'completed' },
      include: [
        { model: Rider, as: 'rider', attributes: ['riderId', 'firstName', 'lastName'] },
        { model: Driver, as: 'driver', attributes: ['driverId', 'firstName', 'lastName'] },
      ],
      order: [['rideId', 'ASC']],
    });
    res.json(rides);
  } catch (err) {
    console.error('Error fetching rides for driver:', err);
    res.status(500).json({ error: 'Failed to fetch rides for driver' });
  }
});

app.get('/rides/:id', async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id, {
      include: [
        { model: Rider, as: 'rider', attributes: ['riderId', 'firstName', 'lastName'] },
        { model: Driver, as: 'driver', attributes: ['driverId', 'firstName', 'lastName'] },
      ],
    });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('Error fetching ride:', err);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

app.post('/rides', async (req, res) => {
  const { riderId, driverId, pickupLocation, dropoffLocation, status } = req.body;

  const pickup  = typeof pickupLocation  === 'string' ? pickupLocation.trim()  : '';
  const dropoff = typeof dropoffLocation === 'string' ? dropoffLocation.trim() : '';

  if (!riderId)  return res.status(400).json({ error: 'riderId is required' });
  if (!pickup)   return res.status(400).json({ error: 'pickupLocation cannot be blank' });
  if (!dropoff)  return res.status(400).json({ error: 'dropoffLocation cannot be blank' });

  // Calculate real driving cost via Nominatim geocoding + OSRM routing
  let cost = null;
  try {
    const [fromCoords, toCoords] = await Promise.all([
      geocodeAddress(pickup),
      geocodeAddress(dropoff),
    ]);
    const meters = await getDrivingMeters(fromCoords, toCoords);
    const miles = meters / 1609.34;
    cost = (2.50 + 1.75 * miles).toFixed(2);
  } catch (geoErr) {
    console.warn('Cost calculation skipped:', geoErr.message);
  }

  try {
    const ride = await Ride.create({ riderId, driverId, pickupLocation: pickup, dropoffLocation: dropoff, status, cost });
    res.status(201).json(ride);
  } catch (err) {
    console.error('Error creating ride:', err);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

app.put('/rides/:id', async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const { riderId, driverId, pickupLocation, dropoffLocation, status, cost } = req.body;

    // Driver assignment is only allowed through PUT /rides/:id/accept
    if (driverId !== undefined && driverId !== ride.driverId) {
      return res.status(403).json({ error: 'Driver assignment cannot be changed here. Use PUT /rides/:id/accept.' });
    }

    ride.riderId = riderId ?? ride.riderId;
    ride.pickupLocation = pickupLocation ?? ride.pickupLocation;
    ride.dropoffLocation = dropoffLocation ?? ride.dropoffLocation;
    ride.status = status ?? ride.status;
    ride.cost = cost ?? ride.cost;
    await ride.save();
    res.json(ride);
  } catch (err) {
    console.error('Error updating ride:', err);
    res.status(500).json({ error: 'Failed to update ride' });
  }
});

app.put('/rides/:id/accept', async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'requested') return res.status(409).json({ error: 'Ride is no longer available' });
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: 'driverId is required' });
    ride.driverId = driverId;
    ride.status = 'accepted';
    await ride.save();
    res.json(ride);
  } catch (err) {
    console.error('Error accepting ride:', err);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

app.put('/rides/:id/status', async (req, res) => {
  const ALLOWED = ['in_progress', 'completed'];
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const { status } = req.body;
    if (!status || !ALLOWED.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED.join(', ')}` });
    }
    // A driver may only have one ride in_progress at a time
    if (status === 'in_progress' && ride.driverId) {
      const active = await Ride.findOne({
        where: { driverId: ride.driverId, status: 'in_progress' },
      });
      if (active) {
        return res.status(409).json({ error: 'You already have a ride in progress. Complete it before starting another.' });
      }
    }
    ride.status = status;
    await ride.save();
    res.json(ride);
  } catch (err) {
    console.error('Error updating ride status:', err);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
});

app.put('/rides/:id/rate', async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'completed') return res.status(400).json({ error: 'Can only rate completed rides' });
    if (ride.ratingGiven) return res.status(409).json({ error: 'This ride has already been rated' });

    ride.ratingGiven = rating;
    await ride.save();

    if (ride.driverId) {
      const ratedRides = await Ride.findAll({
        where: { driverId: ride.driverId, ratingGiven: { [Op.ne]: null } },
      });
      const avg = ratedRides.reduce((sum, r) => sum + r.ratingGiven, 0) / ratedRides.length;
      await Driver.update({ rating: avg.toFixed(2) }, { where: { driverId: ride.driverId } });
    }

    res.json(ride);
  } catch (err) {
    console.error('Error rating ride:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// app.delete('/rides/:id', async (req, res) => {
//   try {
//     const ride = await Ride.findByPk(req.params.id);
//     if (!ride) return res.status(404).json({ error: 'Ride not found' });
//     await ride.destroy();
//     res.json({ message: 'Ride deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting ride:', err);
//     res.status(500).json({ error: 'Failed to delete ride' });
//   }
// });

// ── Geocoding + routing helpers ───────────────────────────────────────────────

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Crusin-RideShare/1.0' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not geocode: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function getDrivingMeters(from, to) {
  const url = `http://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error('OSRM could not find a route');
  return data.routes[0].distance;
}

// ── AI Recommendations ────────────────────────────────────────────────────────

app.post('/recommendations', authMiddleware, async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ error: 'rideId is required' });

  try {
    const ride = await Ride.findByPk(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const destination = ride.dropoffLocation;

    const completion = await azureClient.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        {
          role: 'system',
          content: 'You are a local recommendations assistant for a rideshare app. Always respond with valid JSON only — no markdown, no extra text. Only suggest real, well-known establishments that actually exist near the given location.',
        },
        {
          role: 'user',
          content: `A user is being dropped off at "${destination}" (picked up from "${ride.pickupLocation}"). Suggest 3 real, well-known nearby spots they might enjoy — consider the neighborhood, time of day, and what is actually close to that specific address or landmark. Return a JSON array of exactly 3 objects, each with: "name" (string), "category" (string), "description" (one sentence, max 20 words).`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    let raw = completion.choices[0].message.content?.trim() || '[]';
    // Strip markdown code fences if the model wraps the response
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const suggestions = JSON.parse(raw);
    res.json({ destination, suggestions });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate recommendations' });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await Rider.sync({ alter: true });
    await Driver.sync({ alter: true });
    await Ride.sync({ alter: true });
    console.log(`Models synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Crusin backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

startServer();
