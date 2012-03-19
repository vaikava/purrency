purrency
=======
We use `purrency` in [node.js](http://nodejs.org) as a quick and dirty solution to fetch exchange reference rates from the
official and sometimes shaky [ECB API](http://www.ecb.int/stats/exchange/eurofxref/html/index.en.html)

It is designed to go hand in hand with [money.js](http://josscrowcroft.github.com/money.js/) to allow simple conversions out of the box.

`purrency` leverages the [event](http://nodejs.org/docs/latest/api/events.html) class to allow adding your own
listeners for `fetch` & `error` events as illustrated in the example below.

`purrency`'s XML references are hardcoded in the script and far from good-looking, but it appears that
the module seems to do it's job pretty well, considering that the API more than sometimes is unreachable.
So if the code make your eyes bleed, rock on and make a pull request.


Example usage: 

	var purrency = require('./purrency');
	
	// Change default base currency from EUR (default) to USD
	purrency.settings.default_currency = 'USD';
	
	purrency.events.on('fetch', function(rates){
	    
	    // Convert exchange rates with money.js
	    // See http://josscrowcroft.github.com/money.js/ for docs
	    var fx = require('money');
	    fx.rates = rates.rates;
	    fx.base = purrency.settings.default_currency;
	    fx.settings = {from : purrency.settings.default_currency /*, to : "SEK"*/}; // Defaults
	    
	    console.log(fx(1000).to("SEK"));
	    
	    // Store a daily record of currencies in database:
	    var mongo = require('mongoskin'),
	        db = require('mongoskin').db('localhost');
	    
	    mongo.db.collection('currencies').findAndModify({timestamp: rates.timestamp}, [], rates, {upsert: true}, function(err, d) {
	        console.log("Stored currencies in database!");
	    });
	    
	});
	
	purrency.events.on('error', function(err){
	    console.log(err);
	    process.exit(1); 
	});
	
	// Fetch currencies
	purrency.fetch();
       
       
license
-------

See `LICENSE` file.

> Copyright (c) 2012 Joakim Brantingson