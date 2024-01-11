const secret = require('./secret.json');
const fetch = require('node-fetch');
const { exec } = require('child_process');

var arguments = process.argv;
let messagesLastCount = 0;
let messageLoopInterval;
let livechatid;

async function run(id) {
  try {
    var res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&key=${secret.apiKey}&id=${id}`
    );

    var data = await res.json();

    if (!data.error) {
      if (data.items.length !== 0) {
        livechatid = data.items[0].liveStreamingDetails.activeLiveChatId;
        console.info('Live Chat ID: ', livechatid);
        messageLoopInterval = setInterval(async () => {
          getChatMessages(livechatid)
              .then(() => {
                //console.info('ok');
              })
              .catch(error  => {
                console.error(error);
              });
        }, 2000);
      } else {
        error = 'LiveStream not found.';
        throw error;
      }
    } else {
      error = data.error.code + ': ' + data.error.errors[0].reason;
      throw error;
    }
  } catch {
    console.log('Oops! ' + error);
  }
}

async function getChatMessages(chatid) {
  try {
    var res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?part=id%2C%20snippet&key=${secret.apiKey}&liveChatId=${chatid}`
    );

    var data = await res.json();

    if (!data.error) {
      if (data.items.length !== 0) {
        if (data.items.length > messagesLastCount) {
          let lastMessages = '';
          for (var i = messagesLastCount; i < data.items.length; i++) {
            console.log(data.items[i].snippet.displayMessage);
            lastMessages += data.items[i].snippet.displayMessage + '. ';

          }
          exec(`say -v 'Yuri' '${lastMessages}'`, (err, stdout, stderr) => {
            messagesLastCount = data.items.length;
            console.info('Total messages: ', messagesLastCount);
            if (stdout) {
              console.info(stdout);
            }
            if (err) {
              console.error(`exec error: ${err}`);
              return;
            }
            console.log(`say command has been executed with message: ${lastMessages}`);
          });
          console.log(' -- ' + i + ' messages returned --')
        }
      }
    } else {
      error = data.error.code + ': ' + data.error.errors[0].reason;
      throw error;
    }
  } catch (error) {
    console.log('Oops! ' + error);
  }
}

if (secret.apiKey == 'YourAPIKey') {
  console.log('Seems you haven\'t supplied your API Key yet!');
  return;
}

switch (arguments[2]) {
  case '--id':
    run(arguments[3]);
    break;
  case '--messages':
    getChatMessages(arguments[3]);
    break;
  case '--help':
    console.log(`
Arguments:              Function:

--id [livestreamid]     Prints the LiveChatID for the given Live Stream.
                        The LiveStreamID is found in the URL of the LiveStream:
                        http://www.youtube.com/watch?v=[thisisthelivestreamid].

--messages [livechatid] Prints the chat messages for the given LiveChat.
        `);
    break;
  default:
    console.log(
      'No Valid Argument(s) Passed. Use --help to see valid arguments.'
    );
}
