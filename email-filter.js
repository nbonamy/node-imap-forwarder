
var minimatch = require('minimatch');

class EmailFilter {

  constructor(options) {
    this._options = options;
  }

  to() {
    return this._makeArray(this._options.to);
  }

  match(message) {

    // check
    if (!this._options.to?.length) {
      return false;
    }
    
    // all
    if (this._options.all === true) {
      console.log(`  - Message "${message.subject}" included by all: sending to ${this.to()}`);
      return true;
    }
    
    // from
    if (this._options.from != null && message.from?.text?.length) {
      let messageFrom = message.from.text;
      messageFrom = messageFrom.match(/<([^>]*)>/)?.[1] || messageFrom;
      let filterFroms = this._makeArray(this._options.from);
      for (const filterFrom of filterFroms) {
        if (this._match(messageFrom, filterFrom)) {
          console.log(`  - Message "${message.subject}" from matches "${filterFrom}": sending to ${this.to()}`);
          return true;
        }
      }
    }

    // subject
    if (this._options.subject != null && message.subject?.length) {
      let messageSubject = message.subject;
      let filterSubjects = this._makeArray(this._options.subject);
      for (const filterSubject of filterSubjects) {
        if (messageSubject.includes(filterSubject)) {
          console.log(`  - Message "${message.subject}" subject contains "${filterSubject}": sending to ${this.to()}`);
          return true;
        }
      }
    }

    // too bad
    return false;
  }

  _match(str, glob) {
    return minimatch(str, glob, {
      nocase: true,
    });
  }

  _makeArray(obj) {
    return Array.isArray(obj) ? obj : [ obj ];
  }

}

module.exports = EmailFilter;
