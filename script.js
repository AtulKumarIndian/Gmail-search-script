const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']; // Gmail read and modify access

// Load client secrets from a local file.
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.error('Error loading client secret file:', err);
    authorize(JSON.parse(content), checkEmailsForRegret);
});

// Create an OAuth2 client with the given credentials, and then execute the callback function.
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if token already exists
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

// Get and store new token after prompting for user authorization
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

// Main function to search for emails with the word "regret"
function checkEmailsForRegret(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Search for emails with the word 'regret'
    gmail.users.messages.list(
        {
            userId: 'me',
            q: 'regret',
        },
        (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const messages = res.data.messages;

            if (!messages || messages.length === 0) {
                console.log('No emails found.');
                return;
            }

            console.log('Emails found:', messages.length);

            messages.forEach((message) => {
                gmail.users.messages.get(
                    {
                        userId: 'me',
                        id: message.id,
                    },
                    (err, res) => {
                        if (err) return console.log('Error getting message: ' + err);

                        console.log('Marking email:', res.data.snippet);
                        addLabelToMessage(auth, message.id);
                    }
                );
            });
        }
    );
}

// Function to add the 'Rejected List Companies' label to an email
function addLabelToMessage(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Create or get the label "Rejected List Companies"
    gmail.users.labels.list({ userId: 'me' }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        let labelId = null;

        // Check if the label already exists
        labels.forEach((label) => {
            if (label.name === 'Rejected List Companies') {
                labelId = label.id;
            }
        });

        // If the label doesn't exist, create it
        if (!labelId) {
            gmail.users.labels.create(
                {
                    userId: 'me',
                    requestBody: {
                        name: 'Rejected List Companies',
                        labelListVisibility: 'labelShow',
                        messageListVisibility: 'show',
                    },
                },
                (err, res) => {
                    if (err) return console.log('Error creating label:', err);
                    labelId = res.data.id;
                    modifyMessageLabel(auth, messageId, labelId);
                }
            );
        } else {
            modifyMessageLabel(auth, messageId, labelId);
        }
    });
}

// Function to apply the label to the message
function modifyMessageLabel(auth, messageId, labelId) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.messages.modify(
        {
            userId: 'me',
            id: messageId,
            requestBody: {
                addLabelIds: [labelId],
            },
        },
        (err) => {
            if (err) return console.log('Error modifying message:', err);
            console.log(`Label "Rejected List Companies" applied to message ${messageId}`);
        }
    );
}
