const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true, useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Routes
app.use('/api/v1/auth',          require('./routes/auth'));
app.use('/api/v1/subjects',      require('./routes/subjects'));
app.use('/api/v1/tasks',         require('./routes/tasks'));
app.use('/api/v1/schedule',      require('./routes/schedule'));
app.use('/api/v1/notes',         require('./routes/notes'));
app.use('/api/v1/pomodoro',      require('./routes/pomodoro'));
app.use('/api/v1/gamification',  require('./routes/gamification')); // NEW

app.get('/', (req, res) => res.json({ message: 'Student Organiser API is running!' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));