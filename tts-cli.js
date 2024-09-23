#!/usr/bin/env node

const { Command } = require('commander');
const say = require('say');
const axios = require('axios');
const cheerio = require('cheerio');

const program = new Command();

// Queue to manage speech tasks
const speechQueue = [];
let isSpeaking = false;

// Helper function to handle text-to-speech with concurrency control
function enqueueSpeechTask(text, rate = 1.0) {
    speechQueue.push({ text, rate });
    if (!isSpeaking) {
        processQueue();
    }
}

// Function to process the speech queue
function processQueue() {
    if (speechQueue.length === 0) {
        isSpeaking = false;
        return;
    }

    isSpeaking = true;
    const { text, rate } = speechQueue.shift();

    console.log('Speaking the provided text...');
    say.speak(text, 'Microsoft Zira Desktop', rate, (err) => {
        if (err) {
            console.error('Error using text-to-speech:', err);
            isSpeaking = false;
            return;
        }
        console.log('Text has been spoken successfully.');
        processQueue(); // Move to the next task
    });
}

// Function to read and speak custom text
function readText(text, rate = 1.0) {
    if (isNaN(rate) || rate <= 0) {
        console.error('Invalid speaking rate. Rate must be a positive number.');
        return;
    }
    enqueueSpeechTask(text, rate);
}

async function readURL(url, rate = 1.0) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract all meaningful text (from <p>, <h1>, <h2>, etc.)
        const extractedText = $('p, h1, h2, h3').text().trim();

        // If there's no text, print an error
        if (!extractedText) {
            console.error('No readable content found on the webpage.');
            return;
        }

        console.log('Speaking the provided website...');
        enqueueSpeechTask(extractedText, rate);

    } catch (error) {
        console.error('Error fetching the webpage', error.message)
    }
}

program
    .name('tts')
    .version('1.0.0')
    .description('CLI tool for text-to-speech functionality')

program
    .command('say <text>')
    .description('Convert custom text to speech')
    .option('-r, --rate <number>', 'Set the speaking rate (default is 1.0)', '1.0')
    .action((text, options) => {
        const rate = parseFloat(options.rate);
        readText(text, rate);
    });

program
    .command('read <url>')
    .description('Convert webpage content to speech')
    .option('-r, --rate <number>', 'Set the speaking rate (default is 1.0)', '1.0')
    .action((url, options) => {
        const rate = parseFloat(options.rate);
        readURL(url, rate);
    });

program.parse(process.argv);