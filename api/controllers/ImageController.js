/**
 * ImageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require("fs");
const crypto = require("crypto");
const rimraf = require("rimraf");

module.exports = {
	upload: async(req, res) => {
		const file = new Promise((resolve, reject) => {
			req.file('image').upload({
				dirname: require('path').resolve(sails.config.appPath, 'assets/images'),
				maxBytes: 100000000
			}, ((err, f) => {
				if (err) {
					res.json({
						success: false,
						err: err
					});
					return;
				}
				if (!f[0].type.includes('image')) {
					res.json({
						success: false,
						err: {
							code: "E_TYPE",
							message: "檔案格式錯誤"
						}
					});
					fs.unlinkSync(f[0].fd);
					return;
				}

				resolve(f[0]);
			}));
		});

		const baseUrl = sails.config.custom.baseUrl;
		const f = await file;
		const filenameFull = f.fd.split('/')[f.fd.split('/').length - 1];

		const fileName = filenameFull.split('.')[0];
		const fileExtName = filenameFull.split('.')[1];

		res.ok({
			filename: filenameFull,
			size: f.size,
			path: `/images/${filenameFull}`,
			timestamp: Date.now(),
			url: `${baseUrl}/images/${filenameFull}`,
			delete: `${baseUrl}/delete/${fileName}_${fileExtName}`

		});
	},
	delete: (req, res) => {
		rimraf.sync(sails.config.appPath + '/assets/images/' + req.params.pid.split('_')[0] + '.' + req.params.pid.split('_')[1]);
		res.ok();
	},

	purge: (req, res) => {
		rimraf.sync(sails.config.appPath + '/assets/images/*');
		res.ok();
	}
};
