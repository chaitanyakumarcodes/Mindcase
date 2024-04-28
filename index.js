const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { default: transformers } = require('transformers');

const app = express();
const upload = multer();

app.post('/qa', upload.single('pdf'), async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const questions = req.body.questions.split('\n').map(q => q.trim()).filter(Boolean);

    const documentText = await extractTextFromPDF(pdfBuffer);
    const answers = await Promise.all(questions.map(q => answerQuestion(q, documentText)));

    res.json({ answers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function extractTextFromPDF(pdfBuffer) {
  const data = await pdf(pdfBuffer);
  return data.text;
}

async function answerQuestion(question, context) {
  const qaPipeline = transformers.pipeline("question-answering", { model: "distilbert-base-cased-distilled-squad" });
  const result = await qaPipeline({ question, context });
  return result.answer;
}

module.exports = app;
