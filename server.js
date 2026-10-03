require('dotenv').config();
const express = require('express'), http = require('http'), mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = express(), srv = http.createServer(app), io = new Server(srv);
const { MONGO_URI = 'mongodb://127.0.0.1:27017/bookmyshow', TMDB_KEY, PORT = 3000 } = process.env;
app.use(express.json());
app.use(express.static('public'));

const Show = mongoose.model('Show', new mongoose.Schema({
  movieId: Number, city: String, theatre: String, time: Date, price: Number, booked: [String]
}));
const Booking = mongoose.model('Booking', new mongoose.Schema({
  showId: mongoose.Schema.Types.ObjectId, name: String, seats: [String], total: Number,
  createdAt: { type: Date, default: Date.now }
}));

const CITIES = {
  Mumbai: ['PVR Juhu', 'INOX Nariman Point'], Delhi: ['PVR Select City', 'INOX Nehru Place'],
  Bengaluru: ['PVR Orion', 'INOX Garuda'], Mathura: ['PVR Mathura', 'Cinepolis Krishna']
};
const SAMPLE = [
  { id: 1, title: 'Sample Movie One', poster: '', rating: 8.1, overview: 'Add a TMDB_KEY in .env to load real, live movies.' },
  { id: 2, title: 'Sample Movie Two', poster: '', rating: 7.4, overview: 'Add a TMDB_KEY in .env to load real, live movies.' }
];

let cache = { t: 0, d: [] };
async function getMovies() {
  if (Date.now() - cache.t < 6e5 && cache.d.length) return cache.d;
  let d = SAMPLE;
  if (TMDB_KEY) {
    try {
      const r = await fetch(`https://api.themoviedb.org/3/movie/now_playing?region=IN&api_key=${TMDB_KEY}`);
      const j = await r.json();
      d = j.results.slice(0, 18).map(m => ({
        id: m.id, title: m.title, rating: m.vote_average, overview: m.overview,
        poster: m.poster_path ? 'https://image.tmdb.org/t/p/w342' + m.poster_path : ''
      }));
    } catch (e) { console.log('TMDB failed:', e.message); }
  }
  cache = { t: Date.now(), d };
  return d;
}

async function ensureShows(movieId, city) {
  let list = await Show.find({ movieId, city, time: { $gt: new Date() } }).sort('time');
  if (!list.length) {
    const docs = [], now = new Date();
    for (let d = 0; d < 2; d++) for (const theatre of CITIES[city])
      for (const [h, m] of [[10, 0], [14, 0], [18, 30], [22, 0]]) {
        const time = new Date(); time.setDate(time.getDate() + d); time.setHours(h, m, 0, 0);
        if (time > now) docs.push({ movieId, city, theatre, time, price: [150, 200, 250, 350][(h + d) % 4], booked: [] });
      }
    list = await Show.insertMany(docs);
  }
  return list;
}

app.get('/api/movies', async (_, res) => res.json(await getMovies()));
app.get('/api/movies/:id/shows', async (req, res) => {
  const city = CITIES[req.query.city] ? req.query.city : 'Mumbai';
  res.json(await ensureShows(+req.params.id, city));
});
app.get('/api/shows/:id', async (req, res) => {
  const s = await Show.findById(req.params.id);
  s ? res.json(s) : res.status(404).json({ error: 'Show not found' });
});

const holds = {}; // showId -> { seat: socketId }
app.post('/api/book', async (req, res) => {
  const { showId, name, seats, sid } = req.body;
  if (!name || !Array.isArray(seats) || !seats.length || seats.length > 6 || !seats.every(s => /^[A-H]([1-9]|10)$/.test(s)))
    return res.status(400).json({ error: 'Pick 1 to 6 valid seats and enter your name.' });
  const h = holds[showId] || {};
  if (seats.some(s => h[s] && h[s] !== sid)) return res.status(409).json({ error: 'Someone else is holding one of these seats.' });
  const show = await Show.findOneAndUpdate(
    { _id: showId, booked: { $nin: seats } }, { $addToSet: { booked: { $each: seats } } }, { new: true });
  if (!show) return res.status(409).json({ error: 'One of these seats was just booked. Pick others.' });
  const b = await Booking.create({ showId, name, seats, total: seats.length * show.price });
  seats.forEach(s => delete h[s]);
  io.to(showId).emit('booked', { showId, seats });
  io.to(showId).emit('holds', h);
  res.json(b);
});

function release(s) {
  const id = s.showId, h = holds[id];
  if (!h) return;
  for (const k in h) if (h[k] === s.id) delete h[k];
  io.to(id).emit('holds', h);
  s.leave(id); s.showId = null;
}
io.on('connection', s => {
  s.on('join', id => { release(s); s.join(id); s.showId = id; s.emit('holds', holds[id] || {}); });
  s.on('leave', () => release(s));
  s.on('hold', async ({ seat }) => {
    const id = s.showId;
    if (!id || !/^[A-H]([1-9]|10)$/.test(seat)) return;
    const h = (holds[id] ??= {});
    if (h[seat] === s.id) delete h[seat];
    else if (!h[seat] && Object.values(h).filter(v => v === s.id).length < 6) {
      const sh = await Show.findById(id).select('booked');
      if (!sh || sh.booked.includes(seat)) return;
      h[seat] = s.id;
    }
    io.to(id).emit('holds', h);
  });
  s.on('disconnect', () => release(s));
});

mongoose.connect(MONGO_URI)
  .then(() => srv.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`)))
  .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
