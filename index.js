
const fs = require('fs');
const process = require('process');
const ImapReader = require('./imap-reader.js');
const EmailFilter = require('./email-filter.js');
const SmtpSender = require('./smtp-sender.js');

const dataFilename  = `./data.json`;
const configFilename  = `./config.json`;

// load options
let options = require(configFilename);
if (options?.imap == null || options?.smtp == null || options?.filters == null) {
  console.error('Invalid configuration file');
  process.exit(1);
}

// build the filters
let filters = [];
for (filter of options.filters) {
  filters.push(new EmailFilter(filter));
}

// smtp
let smtp = new SmtpSender(options.smtp);

// open last check file
let data = {
  lastCheckDate: null,
  lastMessageUid: 0,
};
try {
  const saved = fs.readFileSync(dataFilename);
  data = {...data, ...JSON.parse(saved)};
} catch (_) {
}

// now imap
let imap = new ImapReader(options.imap);
imap.get(data.lastCheckDate).then(async (messages) => {

  // save
  data.lastCheckDate = new Date();
  fs.writeFileSync(dataFilename, JSON.stringify(data)); 

  // log
  console.log(`* ${messages.length} messages received`);

  // filter messages out
  messages = messages.filter((message) => {
    return message.attrs.uid > data.lastMessageUid
  });

  // check
  if (!messages.length) {
    console.log('* No new messages found');
    process.exit(0);
  }

  // log
  console.log('* Filtering messages')
  
  // now check filters
  let promises = [];
  messages.forEach(async (message) => {

    // try to match it
    let matched = false;
    for (filter of filters) {
      if (filter.match(message.mail)) {
        promises.push(smtp.send(filter.to(), message.mail));
        matched = true;
      }
    }

    // log if not matched
    if (!matched) {
      //console.log(`  - No matches for message ${message.mail.subject}`);
    }

    // add as processed
		if (message.attrs.uid > data.lastMessageUid) {
			data.lastMessageUid = message.attrs.uid;
			fs.writeFileSync(dataFilename, JSON.stringify(data)); 
		}

  });

  // wait for all to finish
  if (promises.length) {
    await Promise.all(promises);
  }

  // done
  process.exit(0);

}).catch((err) => {
  console.log(err);
});
