import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import * as jose from 'jose';

dotenv.config();

const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const useSsl = process.env.PGSSLMODE === 'require';

const app = express();
const PORT = process.env.PORT || 5001;

const ASGARDEO_ORG = process.env.ASGARDEO_ORG || 'fullstack39';
const JWKS_URI = `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`;

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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: false,
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
    password: {
      type: DataTypes.STRING,
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

// ── Auth middleware ───────────────────────────────────────────────────────────

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
    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message,
    });
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('Crusin backend is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Riders
// app.use('/riders', authMiddleware);

app.get('/riders', async (req, res) => {
  try {
    const riders = await Rider.findAll({ order: [['riderId', 'ASC']] });
    res.json(riders);
  } catch (err) {
    console.error('Error fetching riders:', err);
    res.status(500).json({ error: 'Failed to fetch riders' });
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
  const { firstName, lastName, email, password, phone, cardNumber } = req.body;
  if (!firstName || !lastName || !email || !password || !phone || !cardNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const rider = await Rider.create({ firstName, lastName, email, password, phone, cardNumber });
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
    const { firstName, lastName, email, password, phone, cardNumber } = req.body;
    rider.firstName = firstName ?? rider.firstName;
    rider.lastName = lastName ?? rider.lastName;
    rider.email = email ?? rider.email;
    rider.password = password ?? rider.password;
    rider.phone = phone ?? rider.phone;
    rider.cardNumber = cardNumber ?? rider.cardNumber;
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
    await rider.destroy();
    res.json({ message: 'Rider deleted successfully' });
  } catch (err) {
    console.error('Error deleting rider:', err);
    res.status(500).json({ error: 'Failed to delete rider' });
  }
});

// Drivers
// app.use('/drivers', authMiddleware);

app.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.findAll({ order: [['driverId', 'ASC']] });
    res.json(drivers);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
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
  const { firstName, lastName, email, password, carMake, carModel, carColor, licensePlate, rating } = req.body;
  if (!firstName || !lastName || !email || !password || !carMake || !carModel || !carColor || !licensePlate) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const driver = await Driver.create({ firstName, lastName, email, password, carMake, carModel, carColor, licensePlate, rating });
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
    const { firstName, lastName, email, password, carMake, carModel, carColor, licensePlate, rating } = req.body;
    driver.firstName = firstName ?? driver.firstName;
    driver.lastName = lastName ?? driver.lastName;
    driver.email = email ?? driver.email;
    driver.password = password ?? driver.password;
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
    await driver.destroy();
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// Rides
// app.use('/rides', authMiddleware);

app.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.findAll({
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
  const { riderId, driverId, pickupLocation, dropoffLocation, status, cost } = req.body;
  if (!riderId || !pickupLocation || !dropoffLocation) {
    return res.status(400).json({ error: 'riderId, pickupLocation, and dropoffLocation are required' });
  }
  try {
    const ride = await Ride.create({ riderId, driverId, pickupLocation, dropoffLocation, status, cost });
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
    ride.riderId = riderId ?? ride.riderId;
    ride.driverId = driverId ?? ride.driverId;
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

app.delete('/rides/:id', async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    await ride.destroy();
    res.json({ message: 'Ride deleted successfully' });
  } catch (err) {
    console.error('Error deleting ride:', err);
    res.status(500).json({ error: 'Failed to delete ride' });
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
