const Imap = require('imap');
const mailparser = require('mailparser');

class ImapReader {

  constructor(options) {
    this._imap = new Imap(options);
  }

  async get(sinceDate) {

    return new Promise((resolve, reject) => {

      let messages = [];
      let promises = [];

      let openInbox = (cb) => {
        this._imap.openBox('INBOX', true, cb);
      }
  
      this._imap.once('ready', () => {

        console.log('* IMAP connection successful')
  
        openInbox((err, box) => {
  
          if (err != null) {
            reject(err);
            return;
          }

          // filter
          let filter = [ 'ALL' ];
          if (sinceDate != null) {
            filter = [[ 'SINCE', sinceDate ]];
          }
          
          // search
          this._imap.search(filter, (err, results) => {
  
            if (err != null) {
              reject(err);
              return;
            }

            // check results
            console.log(`* Found ${results.length} messages to download`);
            if (results.length == 0) {
              resolve(messages);
              return;
            }
            
            var f = this._imap.fetch(results, { bodies: [ '' ] });

            f.on('message', (msg, seqno) => {
              
              console.log(`  - Downloading message #${seqno}`);
              
              // the message
              let buffer = '';
              let attributes = null;
              msg.on('body', function(stream, info) {
                var count = 0;
                stream.on('data', function(chunk) {
                  count += chunk.length;
                  buffer += chunk.toString('utf8');
                });
              });
              
              msg.once('attributes', (attrs) => {
                attributes = attrs;
              });
              
              msg.once('end', async () => {
                promises.push(new Promise(async (resolve, reject) => {

                  try {
                    let mail = await mailparser.simpleParser(buffer);
                    messages.push({
                      attrs: attributes,
                      mail: mail
                    });
                    resolve();
                  } catch (_) {
                    reject();
                  }
  
                }));
              });
  
            });
            
            f.once('error', (err) => {
              reject(err);
              //console.log('Fetch error: ' + err);
            });
            
            f.once('end', () => {
              //console.log('Done fetching all messages!');
              Promise.all(promises).then(() => {
                this._imap.end();
                resolve(messages);
              });
            });
  
          });
        
        });
  
      });
  
      this._imap.once('error', function(err) {
        resolve(err);
      });
  
      //this._imap.once('end', function() {
       // resolve(messages);
      //});

      this._imap.connect();
  
    });
  
  }

}

module.exports = ImapReader;
