const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); // cors allows u to make req from 1 domain/port to another

//convert body of post req into json for xprs api
app.use(bodyParser.json());

/************* Postgres Client Setup********/ 
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

//on first connect create a table to house submitted values
pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

/************  Redis Client Setup***********/
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

/************* Express route handlers********/ 

//root route handler
app.get('/', (req, res) => {
  res.send('Hi');
});

// proute handler for database access by xprss server
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

//route handler for redis access by xprss server
app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
}); //redis doesn't have promise support so call backs are used

//route handler for accepting values by xprss server
app.post('/values', async (req, res) => {
  const index = req.body.index;

  // capping index value at 40 to prevent infinite processing 
  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  //worker will come into hash of redis and replace nothing yet with actual calculated value
  redisClient.hset('values', index, 'Nothing yet!');

  //upon insert event trigger redis will send index to worker to calculate value
  redisPublisher.publish('insert', index);

  //add in the new index that was just submitted
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

//port listener
app.listen(5000, err => {
  console.log('Listening');
});
