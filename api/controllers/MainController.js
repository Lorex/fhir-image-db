/**
 * MainController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	main: (req, res) => {
		res.ok({
			connection: "ok",
			version: sails.config.custom.version
		});
	}
};
