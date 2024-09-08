const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ub2024_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Question Schema
const questionSchema = new mongoose.Schema({
  id: String,
  number: Number,
  kategoria: String,
  zestaw: String,
  rating: Number,
  answer: String,
});

const Question = mongoose.model('Question', questionSchema);

// API Endpoints
app.get('/questions', async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

app.post('/questions', async (req, res) => {
  const newQuestion = new Question(req.body);
  await newQuestion.save();
  res.status(201).json(newQuestion);
});

app.put('/questions/:id', async (req, res) => {
  const updatedQuestion = await Question.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(updatedQuestion);
});

app.delete('/questions/:id', async (req, res) => {
  await Question.findOneAndDelete({ id: req.params.id });
  res.status(204).send();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
