#!/usr/bin/env node

const { Command } = require('commander');
const say = require('say');
const axios = require('axios');
const cheerio = require('cheerio');

const program = new Command();

function readText(text) {
    console.log('Speaking the provided text...');
    say.speak(text, 'Alex', 1.0, (err) => {
        if (err) {
            console.error('Error using text-to-speech:', err);
            return;
        }
        console.log('Text has been spoken successfully.');
    });
}

async function readURL(url, rate) {
    try {
        const response = await axios({GET, url});
        const $ = cheerio.load(response.data);

        // Extract all meaningful text (from <p>, <h1>, <h2>, etc.)
        const extractedText = $('p, h1, h2, h3').text().trim();

        // If there's no text, print an error
        if (!extractedText) {
            console.error('No readable content found on the webpage.');
            return;
        }

        console.log('Speaking the provided website...');
        say.speak(extractedText, 'Alex', float(rate), (err) => {
            if (err) {
                console.error('Error using text-to-speech:', err);
                return;
            }
            console.log('Text has been spoken successfully.');
        });

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
    .action((text)=>{
        readText(text);
    })

program
    .command('read <url>')
    .description('Convert webpage content to speech')
    .option('-r, --rate <number>', 'Set the speaking rate (default is 1.0)', '1.0')
    .action((url, options)=> {
        readURL(url, options.rate);
    })

program.parse(process.argv);