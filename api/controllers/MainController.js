/**
 * MainController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const pkg = require('../../package.json');

module.exports = {
  main: (req, res) => {
    res.ok({
      connection: 'ok',
      version: pkg.version
    });
  }
};
