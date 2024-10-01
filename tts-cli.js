#!/usr/bin/env node

const { Command } = require('commander');
const say = require('say');
const axios = require('axios');
const cheerio = require('cheerio');

const program = new Command();

// Queue to manage speech tasks
const speechQueue = [];
let isSpeaking = false;
let isPaused = false;

// Helper function to handle text-to-speech with concurrency control
function enqueueSpeechTask(text, rate = 1.0) {
    speechQueue.push({ text, rate });
    if (!isSpeaking) {
        processQueue();
    }
}

// Function to process the speech queue
function processQueue() {
    if (speechQueue.length === 0|| isPaused) {
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

// Pause the speech queue
function pauseQueue() {
    if (isSpeaking) {
        isPaused = true;
        console.log('Speech queue has been paused.');
    } else {
        console.log('No ongoing speech task to pause.');
    }
}

// Resume the speech queue
function resumeQueue() {
    if (isPaused) {
        isPaused = false;
        console.log('Speech queue has been resumed.');
        processQueue(); // Resume processing
    } else {
        console.log('Queue is not paused.');
    }
}

// Cancel all tasks in the speech queue
function cancelQueue() {
    say.stop();  // Stop any currently playing speech
    speechQueue.length = 0;  // Clear the queue
    isSpeaking = false;
    isPaused = false;
    console.log('Speech queue has been cancelled.');
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
    .version('1.1.0')
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

// Control Commands

program
    .command('pause')
    .description('Pause the current speech task')
    .action(() => {
        pauseQueue();
    });

program
    .command('resume')
    .description('Resume the paused speech queue')
    .action(() => {
        resumeQueue();
    });

program
    .command('cancel')
    .description('Cancel all ongoing and pending speech tasks')
    .action(() => {
        cancelQueue();
    });

program.parse(process.argv);