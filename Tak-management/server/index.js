const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; font-src 'self' data: blob: http://localhost:*; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:*;"
  );
  next();
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/taskcanvas";
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("taskcanvas");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1);
  }
}

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const db = await connectDB();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.collection('users').insertOne(user);
    
    // Generate JWT
    const token = jwt.sign(
      { id: result.insertedId.toString(), email }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user and token
    res.status(201).json({
      token,
      user: {
        _id: result.insertedId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await connectDB();
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id.toString(), email }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user and token
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/user', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Task Routes - Update to use authentication
app.get('/api/tasks/:userId', authenticateToken, async (req, res) => {
  try {
    // Verify the user is requesting their own tasks
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const db = await connectDB();
    const tasks = await db.collection('tasks').find({ userId: req.params.userId }).toArray();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { userId, title, description, labels, columnId } = req.body;
    
    // Verify the user is creating their own task
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const db = await connectDB();
    
    const task = {
      userId,
      title,
      description,
      labels,
      columnId,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.collection('tasks').insertOne(task);
    res.status(201).json({ ...task, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, labels, columnId } = req.body;
    const db = await connectDB();
    
    // Get the task to verify ownership
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify the user owns the task
    if (req.user.id !== task.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, description, labels, columnId } }
    );
    
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    
    // Get the task to verify ownership
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify the user owns the task
    if (req.user.id !== task.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const result = await db.collection('tasks').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/board/:userId', authenticateToken, async (req, res) => {
  try {
    // Verify the user is requesting their own board
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.userId) });
    
    if (!user || !user.board) {
      // Return default board structure if user doesn't have one yet
      return res.json({
        columns: [
          { id: 'column-1', title: 'To Do', taskIds: [] },
          { id: 'column-2', title: 'In Progress', taskIds: [] },
          { id: 'column-3', title: 'Done', taskIds: [] },
        ]
      });
    }
    
    res.json(user.board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/board/:userId', authenticateToken, async (req, res) => {
  try {
    const { board } = req.body;
    
    // Verify the user is updating their own board
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const db = await connectDB();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.userId) },
      { $set: { board } },
      { upsert: true }
    );
    
    res.json({ message: 'Board updated successfully' });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
