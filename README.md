# node-imap-forwarder

Script to forward email from an IMAP account through SMTP based on filters:
- from: looks for text in message header from field
- subject: looks for text in message header subject field

## Installation

```npm install```

## Configuration

Create a `config.json` file like:

```
{
  "imap": {
    // imap configuration block as seen on
    // https://github.com/mscdex/node-imap#examples
  },
  "smtp": {
    // smtp configuration block as seen on
    // https://github.com/nodemailer/nodemailer
  },
  "filters": [
    {
      "to": "email address to forward mail to",
      "from": [ "filter1 as glob", ... ],
    },
      "to": "email address to forward mail to",
      "subject: "text to search",
    }
  ]
}
```
