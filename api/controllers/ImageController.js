/**
 * ImageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { rimraf } = require('rimraf');

// 將 fs.unlink 轉換為 Promise 版本
const unlinkAsync = promisify(fs.unlink);

module.exports = {

  /**
   * Upload image file
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async upload(req, res) {
    try {
      // 使用 Promise 包裝 Sails 的檔案上傳功能
      const uploadedFiles = await new Promise((resolve, reject) => {
        req.file('image').upload({
          dirname: path.resolve(sails.config.appPath, 'assets/images'),
          maxBytes: 100000000 // 100MB
        }, (err, files) => {
          if (err) {
            return reject(err);
          }
          resolve(files);
        });
      });

      // 檢查是否有檔案被上傳
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.badRequest({
          success: false,
          err: {
            code: 'E_NO_FILE',
            message: '沒有上傳檔案'
          }
        });
      }

      const file = uploadedFiles[0];

      // 驗證檔案類型
      if (!file.type.includes('image')) {
        // 使用異步方式刪除無效檔案
        try {
          await unlinkAsync(file.fd);
        } catch (unlinkErr) {
          sails.log.warn('Failed to delete invalid file:', unlinkErr);
        }

        return res.badRequest({
          success: false,
          err: {
            code: 'E_TYPE',
            message: '檔案格式錯誤'
          }
        });
      }

      // 取得檔案資訊
      const apiBaseUrl = sails.config.custom.apiBaseUrl;
      const filenameFull = path.basename(file.fd);
      const { name: fileName, ext: fileExt } = path.parse(filenameFull);
      const fileExtName = fileExt.slice(1); // 移除點號

      // 回傳成功響應
      return res.ok({
        filename: filenameFull,
        size: file.size,
        path: `/images/${filenameFull}`,
        timestamp: Date.now(),
        url: `${apiBaseUrl}/images/${filenameFull}`,
        delete: `${apiBaseUrl}/delete/${fileName}_${fileExtName}`
      });

    } catch (err) {
      sails.log.error('File upload error:', err);
      return res.serverError(err);
    }
  },

  /**
   * Delete specific image file
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async delete(req, res) {
    try {
      const { pid } = req.params;
      const [fileName, fileExt] = pid.split('_');

      if (!fileName || !fileExt) {
        return res.badRequest({
          success: false,
          err: {
            code: 'E_INVALID_PID',
            message: '無效的檔案識別碼'
          }
        });
      }

      const filePath = path.join(sails.config.appPath, 'assets/images', `${fileName}.${fileExt}`);
      await rimraf(filePath);

      return res.ok({
        success: true,
        message: '檔案已成功刪除'
      });
    } catch (err) {
      sails.log.error('File deletion error:', err);
      return res.serverError(err);
    }
  },

  /**
   * Delete all image files
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async purge(req, res) {
    try {
      const imagesPath = path.join(sails.config.appPath, 'assets/images/*');
      await rimraf(imagesPath);

      return res.ok({
        success: true,
        message: '所有檔案已成功刪除'
      });
    } catch (err) {
      sails.log.error('Files purge error:', err);
      return res.serverError(err);
    }
  }

};
