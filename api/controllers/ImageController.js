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
const axios = require('axios');

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
      const { patientId, practitionerId } = req.body;

      if (!patientId || !practitionerId) {
        return res.badRequest({
          success: false,
          err: {
            code: 'E_MISSING_PARAMETERS',
            message: '缺少 patientId 或 practitionerId 參數'
          }
        });
      }

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
      const fhirServerUrl = sails.config.custom.fhirServerUrl;
      const filenameFull = path.basename(file.fd);
      const imageUrl = `${apiBaseUrl}/images/${filenameFull}`;

      // 建立 FHIR DocumentReference
      const documentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        description: 'hah',
        docStatus: 'final',
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '72170-4',
              display: 'Attachment'
            }
          ]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        author: [
          {
            reference: `Practitioner/${practitionerId}`
          }
        ],
        content: [
          {
            attachment: {
              contentType: file.type,
              url: imageUrl,
              size: file.size,
              title: filenameFull,
              creation: new Date().toISOString()
            }
          }
        ]
      };

      let fhirResponse = {};
      try {
        const response = await axios.post(`${fhirServerUrl}/DocumentReference`, documentReference);
        if (response.status === 201) {
          fhirResponse = response.data;
        }
      } catch (fhirErr) {
        sails.log.error('FHIR server error:', fhirErr.response ? fhirErr.response.data : fhirErr.message);
        return res.serverError('Failed to create DocumentReference on FHIR server.');
      }

      // 回傳成功響應
      return res.ok({
        filename: filenameFull,
        size: file.size,
        path: `/images/${filenameFull}`,
        timestamp: Date.now(),
        url: imageUrl,
        delete: `${apiBaseUrl}/delete/${fhirResponse.id}`,
        fhir: fhirResponse
      });

    } catch (err) {
      sails.log.error('File upload error:', err);
      return res.serverError(err);
    }
  },

  /**
   * Delete specific image file and its DocumentReference
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const fhirServerUrl = sails.config.custom.fhirServerUrl;

      if (!id) {
        return res.badRequest({
          success: false,
          err: {
            code: 'E_INVALID_ID',
            message: '無效的 FHIR ID'
          }
        });
      }

      // 1. 從 FHIR Server 取得 DocumentReference 以獲取檔案名稱
      let docRef;
      try {
        const response = await axios.get(`${fhirServerUrl}/DocumentReference/${id}`);
        docRef = response.data;
      } catch (err) {
        sails.log.error('Failed to fetch DocumentReference:', err.response ? err.response.data : err.message);
        if (err.response && err.response.status === 404) {
          return res.status(404).json({ success: false, message: '找不到指定的 FHIR DocumentReference' });
        }
        return res.serverError('無法從 FHIR 伺服器取得 DocumentReference');
      }

      // 2. 向 FHIR Server 刪除 DocumentReference
      try {
        await axios.delete(`${fhirServerUrl}/DocumentReference/${id}`);
      } catch (err) {
        sails.log.error('Failed to delete DocumentReference:', err.response ? err.response.data : err.message);
        // 即使刪除失敗，我們還是繼續嘗試刪除本地檔案
      }

      // 3. 刪除本地圖片檔案
      try {
        const filenameFull = docRef.content[0].attachment.title;
        if (filenameFull) {
          const filePath = path.join(sails.config.appPath, 'assets/images', filenameFull);
          await unlinkAsync(filePath);
        }
      } catch (err) {
          sails.log.error('File deletion error:', err);
          // 如果檔案刪除失敗，可能需要手動介入，但主要資源已在 FHIR server 上刪除
          return res.serverError({ success: false, message: '檔案刪除失敗，但 FHIR 資源可能已被刪除' });
      }

      return res.ok({
        success: true,
        message: '檔案及對應的 FHIR DocumentReference 已成功刪除'
      });

    } catch (err) {
      sails.log.error('Delete operation failed:', err);
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
      const imageDirPath = path.join(sails.config.appPath, 'assets/images');
      const files = await promisify(fs.readdir)(imageDirPath);

      for (const file of files) {
        if (file !== '.gitkeep') {
          await unlinkAsync(path.join(imageDirPath, file));
        }
      }

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
