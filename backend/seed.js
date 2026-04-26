import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const useSsl = process.env.PGSSLMODE === 'require';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : undefined,
    define: { schema: DB_SCHEMA },
    logging: false,
  }
);

const Rider = sequelize.define('Rider', {
  riderId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  cardNumber: { type: DataTypes.STRING, allowNull: false },
  cardExpiry: { type: DataTypes.STRING, allowNull: false },
  cardCvv: { type: DataTypes.STRING, allowNull: false },
  billingAddress: { type: DataTypes.STRING, allowNull: false },
  billingCity: { type: DataTypes.STRING, allowNull: false },
  billingState: { type: DataTypes.STRING, allowNull: false },
  billingZip: { type: DataTypes.STRING, allowNull: false },
}, { schema: DB_SCHEMA, tableName: 'riders', underscored: true, timestamps: false });

const Driver = sequelize.define('Driver', {
  driverId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  carMake: { type: DataTypes.STRING, allowNull: false },
  carModel: { type: DataTypes.STRING, allowNull: false },
  carColor: { type: DataTypes.STRING, allowNull: false },
  licensePlate: { type: DataTypes.STRING, unique: true, allowNull: false },
  rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 5.0 },
}, { schema: DB_SCHEMA, tableName: 'drivers', underscored: true, timestamps: false });

const Ride = sequelize.define('Ride', {
  rideId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pickupLocation: { type: DataTypes.STRING, allowNull: false },
  dropoffLocation: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('requested', 'accepted', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'requested',
  },
  cost: { type: DataTypes.DECIMAL(10, 2) },
}, { schema: DB_SCHEMA, tableName: 'rides', underscored: true, timestamps: false });

Rider.hasMany(Ride, { foreignKey: 'riderId', as: 'rides' });
Ride.belongsTo(Rider, { foreignKey: 'riderId', as: 'rider' });
Driver.hasMany(Ride, { foreignKey: 'driverId', as: 'rides' });
Ride.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

async function seed() {
  await sequelize.authenticate();
  console.log('Connected to database.');

  // Clear existing data (rides first due to foreign keys)
  await Ride.destroy({ where: {} });
  await Rider.destroy({ where: {} });
  await Driver.destroy({ where: {} });
  console.log('Cleared existing data.');

  // Riders
  const riders = await Rider.bulkCreate([
    { firstName: 'Alice',   lastName: 'Johnson',  email: 'alice@example.com',   password: 'hashed_pw_1', phone: '512-555-0101', cardNumber: '4111111111111111', cardExpiry: '09/27', cardCvv: '123', billingAddress: '2108 Speedway',        billingCity: 'Austin', billingState: 'TX', billingZip: '78712' },
    { firstName: 'Bob',     lastName: 'Martinez', email: 'bob@example.com',     password: 'hashed_pw_2', phone: '512-555-0102', cardNumber: '4111111111112222', cardExpiry: '03/26', cardCvv: '456', billingAddress: '1801 Lavaca St',       billingCity: 'Austin', billingState: 'TX', billingZip: '78701' },
    { firstName: 'Carol',   lastName: 'Smith',    email: 'carol@example.com',   password: 'hashed_pw_3', phone: '512-555-0103', cardNumber: '4111111111113333', cardExpiry: '11/28', cardCvv: '789', billingAddress: '500 W 2nd St',         billingCity: 'Austin', billingState: 'TX', billingZip: '78701' },
    { firstName: 'David',   lastName: 'Lee',      email: 'david@example.com',   password: 'hashed_pw_4', phone: '512-555-0104', cardNumber: '4111111111114444', cardExpiry: '06/26', cardCvv: '321', billingAddress: '3001 S Lamar Blvd',    billingCity: 'Austin', billingState: 'TX', billingZip: '78704' },
    { firstName: 'Emma',    lastName: 'Wilson',   email: 'emma@example.com',    password: 'hashed_pw_5', phone: '512-555-0105', cardNumber: '4111111111115555', cardExpiry: '01/29', cardCvv: '654', billingAddress: '11501 Domain Dr',      billingCity: 'Austin', billingState: 'TX', billingZip: '78758' },
  ], { returning: true });
  console.log(`Inserted ${riders.length} riders.`);

  // Drivers
  const drivers = await Driver.bulkCreate([
    { firstName: 'James',   lastName: 'Brown',    email: 'james@example.com',   password: 'hashed_pw_6', carMake: 'Toyota',  carModel: 'Camry',   carColor: 'Silver',  licensePlate: 'TX-AAA-001', rating: 4.9 },
    { firstName: 'Linda',   lastName: 'Garcia',   email: 'linda@example.com',   password: 'hashed_pw_7', carMake: 'Honda',   carModel: 'Accord',  carColor: 'Black',   licensePlate: 'TX-BBB-002', rating: 4.7 },
    { firstName: 'Michael', lastName: 'Davis',    email: 'michael@example.com', password: 'hashed_pw_8', carMake: 'Ford',    carModel: 'Fusion',  carColor: 'White',   licensePlate: 'TX-CCC-003', rating: 4.5 },
    { firstName: 'Sarah',   lastName: 'Taylor',   email: 'sarah@example.com',   password: 'hashed_pw_9', carMake: 'Chevy',   carModel: 'Malibu',  carColor: 'Blue',    licensePlate: 'TX-DDD-004', rating: 4.8 },
    { firstName: 'Kevin',   lastName: 'Anderson', email: 'kevin@example.com',   password: 'hashed_pw_0', carMake: 'Nissan',  carModel: 'Altima',  carColor: 'Red',     licensePlate: 'TX-EEE-005', rating: 4.6 },
  ], { returning: true });
  console.log(`Inserted ${drivers.length} drivers.`);

  // Rides
  const rides = await Ride.bulkCreate([
    { riderId: riders[0].riderId, driverId: drivers[0].driverId, pickupLocation: '1 University Station, Austin, TX',   dropoffLocation: '6th Street, Austin, TX',          status: 'completed',   cost: 12.50 },
    { riderId: riders[1].riderId, driverId: drivers[1].driverId, pickupLocation: 'Austin-Bergstrom Airport, Austin, TX', dropoffLocation: 'Downtown Austin, TX',            status: 'completed',   cost: 28.75 },
    { riderId: riders[2].riderId, driverId: drivers[2].driverId, pickupLocation: 'South Congress Ave, Austin, TX',     dropoffLocation: 'The Domain, Austin, TX',          status: 'in_progress', cost: 18.00 },
    { riderId: riders[3].riderId, driverId: drivers[3].driverId, pickupLocation: 'Rainey Street, Austin, TX',          dropoffLocation: 'Mueller District, Austin, TX',    status: 'accepted',    cost: 9.25  },
    { riderId: riders[4].riderId, driverId: drivers[4].driverId, pickupLocation: 'UT Campus, Austin, TX',              dropoffLocation: 'Barton Springs, Austin, TX',      status: 'requested',   cost: null  },
    { riderId: riders[0].riderId, driverId: drivers[2].driverId, pickupLocation: 'Austin Convention Center, TX',       dropoffLocation: 'Austin-Bergstrom Airport, TX',    status: 'completed',   cost: 22.00 },
    { riderId: riders[1].riderId, driverId: null,                pickupLocation: 'Whole Foods Market, Austin, TX',     dropoffLocation: 'Zilker Park, Austin, TX',         status: 'requested',   cost: null  },
    { riderId: riders[2].riderId, driverId: drivers[0].driverId, pickupLocation: 'East 6th Street, Austin, TX',        dropoffLocation: 'North Loop, Austin, TX',          status: 'cancelled',   cost: null  },
  ]);
  console.log(`Inserted ${rides.length} rides.`);

  console.log('Seed complete!');
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
