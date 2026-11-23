/**
 * Google Apps Script Web App for OmniDownloader
 * ---------------------------------------------
 * Deploy as Web App:
 *  - Execute as: Me
 *  - Who has access: Anyone
 *
 * Capabilities:
 *  1. action: "upload" (default) -> Uploads video file directly to Drive folder
 *  2. action: "get_links" -> Reads links.json from the Drive folder for the runner
 *  3. action: "save_history" -> Saves processed_history.json
 *  4. action: "list_files" -> Lists existing files in the folder
 */

function doGet(e) {
  return handleRequest(e ? e.parameter : {});
}

function doPost(e) {
  var data = {};
  try {
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    data = e ? (e.parameter || {}) : {};
  }
  return handleRequest(data);
}

function handleRequest(data) {
  try {
    var action = (data.action || 'upload').toLowerCase();
    var folderId = extractFolderId(data.folderUrl || data.folderId);
    var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();

    // 1. Fetch JSON file of links from Drive folder
    if (action === 'get_links' || action === 'read_links') {
      var targetFilename = data.filename || 'links.json';
      var files = folder.getFilesByName(targetFilename);
      var targetFile = null;

      if (files.hasNext()) {
        targetFile = files.next();
      } else {
        // Fallback: look for any .json file not named history/processed
        var allFiles = folder.getFiles();
        while (allFiles.hasNext()) {
          var f = allFiles.next();
          var name = f.getName().toLowerCase();
          if (name.endsWith('.json') && !name.includes('history') && !name.includes('processed')) {
            targetFile = f;
            break;
          }
        }
      }

      if (!targetFile) {
        return jsonResponse({
          status: 'error',
          code: 'FILE_NOT_FOUND',
          message: 'No "' + targetFilename + '" file found in this Google Drive folder.'
        });
      }

      var contentText = targetFile.getBlob().getDataAsString();
      var parsedLinks = [];
      try {
        parsedLinks = JSON.parse(contentText);
      } catch (pe) {
        parsedLinks = contentText.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
      }

      var existing = [];
      var it = folder.getFiles();
      while (it.hasNext()) {
        existing.push(it.next().getName());
      }

      return jsonResponse({
        status: 'success',
        filename: targetFile.getName(),
        fileId: targetFile.getId(),
        links: parsedLinks,
        existingFiles: existing
      });
    }

    // 2. Save or update processed history
    if (action === 'save_history' || action === 'update_processed') {
      var histName = data.filename || 'processed_history.json';
      var histJson = JSON.stringify(data.history || [], null, 2);
      var existingHist = folder.getFilesByName(histName);
      var histFile;
      if (existingHist.hasNext()) {
        histFile = existingHist.next();
        histFile.setContent(histJson);
      } else {
        histFile = folder.createFile(histName, histJson, 'application/json');
      }
      return jsonResponse({
        status: 'success',
        message: 'History updated',
        fileId: histFile.getId()
      });
    }

    // 3. List existing files in folder
    if (action === 'list_files') {
      var list = [];
      var itFiles = folder.getFiles();
      while (itFiles.hasNext()) {
        var cur = itFiles.next();
        list.push({ id: cur.getId(), name: cur.getName(), size: cur.getSize() });
      }
      return jsonResponse({ status: 'success', files: list });
    }

    // 4. Default: Upload Video to Folder
    var filename = data.filename || ('video_' + Date.now() + '.mp4');
    var createdFile;

    if (data.fileBase64) {
      var bytes = Utilities.base64Decode(data.fileBase64);
      var blob = Utilities.newBlob(bytes, data.mimeType || 'video/mp4', filename);
      createdFile = folder.createFile(blob);
    } else if (data.videoUrl) {
      var response = UrlFetchApp.fetch(data.videoUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        muteHttpExceptions: true
      });
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        var blob2 = response.getBlob().setName(filename);
        createdFile = folder.createFile(blob2);
      } else {
        throw new Error('Could not fetch video stream (HTTP ' + response.getResponseCode() + ')');
      }
    } else {
      throw new Error('No video URL or data provided');
    }

    return jsonResponse({
      status: 'success',
      message: 'Uploaded to Google Drive successfully!',
      fileId: createdFile.getId(),
      fileName: createdFile.getName(),
      fileUrl: createdFile.getUrl(),
      folderUrl: folder.getUrl()
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function extractFolderId(urlOrId) {
  if (!urlOrId) return null;
  var str = urlOrId.trim();
  var match = str.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  var matchId = str.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) return str;
  return null;
}
