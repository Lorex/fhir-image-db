const sails = require('sails');

// Before running any tests...
before(function(done) {
  // Increase the Mocha timeout so that Sails has enough time to lift, even if you have a bunch of assets.
  this.timeout(5000);

  sails.lift({
    // Your Sails app's configuration files will be loaded automatically,
    // but you can also specify any other special overrides here for testing purposes.

    // For example, we might want to skip the Grunt hook,
    // and disable all logs except errors and warnings:
    hooks: { grunt: false },
    log: { level: 'warn' },

    // Set test environment
    environment: 'test',

    // Disable CSRF for testing
    security: {
      csrf: false
    }

  }, function(err) {
    if (err) {
      return done(err);
    }
    
    // Here, after Sails has started up, we can run our tests.
    return done();
  });
});

// After all tests have finished...
after(function(done) {
  // Lower Sails and exit with the appropriate exit code.
  sails.lower(done);
});