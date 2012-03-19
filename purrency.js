"use strict";

var Requestah = require('requestah'),
    Requestah = new Requestah(),
    events = require('events'),
    parser = require('xml2json'),
    crypto = require('crypto');

module.exports = {

    settings: {
        url: "http://www.ecb.int/stats/eurofxref/eurofxref-daily.xml",
        default_currency: 'EUR',
        retries: 10,
        sleep: 3000,
    },

    events: new events.EventEmitter(),

    fetch: function () {

        var self = this,
            wrapper = function () {

                Requestah.get(self.settings.url, function (response) {

                    // Ooops. Service wasn't available. Fetch again.
                    if (response.statusCode !== 200) {

                        if (!wrapper.failedRequests) { wrapper.failedRequests = 0; }

                        wrapper.failedRequests += 1;

                        // Sleep for a bit and perform another request while we've got remaining retries
                        if (wrapper.failedRequests < self.settings.retries) {
                            setTimeout(wrapper, self.settings.sleep);
                        } else {
                            self.events.emit('error', 'TIMEOUT: Exited after ' +  wrapper.failedRequests + ' failed attempts to fetch');
                        }

                    } else {

                        var json = parser.toJson(response.body, {object: true}),
                            currencies = json['gesmes:Envelope'].Cube.Cube.Cube,
                            returnObject = {
                                timestamp: json['gesmes:Envelope'].Cube.Cube.time,
                                rates: {}
                            },
                            k;

                        for (k in currencies) {

                            if (currencies.hasOwnProperty(k)) {
                                returnObject.rates[currencies[k].currency] = Number(currencies[k].rate);
                            }
                        }

                        // Append our default currency along with a hash of the complete rate hashmap 
                        returnObject.rates[self.settings.default_currency] = 1;
                        returnObject.md5 = crypto.createHmac('md5', '').update(JSON.stringify(returnObject.rates)).digest('hex');

                        self.events.emit('fetch', returnObject);
                    }

                });

            };

        wrapper();
    }

};