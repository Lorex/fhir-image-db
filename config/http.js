/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'imagesStatic',
      'router',
      'www',
      'favicon',
    ],

    /***************************************************************************
    *                                                                          *
    * Static file middleware for /images/* routes                              *
    *                                                                          *
    ***************************************************************************/
    imagesStatic: (req, res, next) => {
      const express = require('express');
      const path = require('path');

      // Only handle requests that start with /images/
      if (req.url.startsWith('/images/')) {
        const assetsPath = path.join(__dirname, '..', 'assets', 'images');
        const staticMiddleware = express.static(assetsPath, {
          setHeaders: (res) => {
            // Set cache headers for images
            res.setHeader('Cache-Control', 'public, max-age=86400');
          }
        });

        // Remove /images prefix from the URL for the static middleware
        const originalUrl = req.url;
        req.url = req.url.replace('/images', '');

        return staticMiddleware(req, res, (err) => {
          // Restore original URL
          req.url = originalUrl;
          if (err) {
            return next(err);
          }
          return next();
        });
      }
      return next();
    },


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    bodyParser: (() => {
      const skipper = require('skipper');
      const middlewareFn = skipper({ strict: true });
      return middlewareFn;
    })(),

  },

};
