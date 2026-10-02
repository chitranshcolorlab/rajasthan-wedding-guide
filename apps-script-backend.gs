const SPREADSHEET_ID = '1Xx0OmAIpxA85Qc0BZW3oMk7pULuypZeXchqSEJuRsQY';
const SHEET_NAME = 'Vendor Registrations';
const PHOTO_FOLDER_NAME = 'Rajasthan Wedding Guide - Vendor Uploads';

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);
  return sheet;
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'list').toLowerCase();
    if (action !== 'list') return json_({ok:false,error:'Unsupported action'});

    const sheet = getSheet_();
    const values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return json_({ok:true,items:[]});

    const headers = values[0];
    const items = values.slice(1).filter(r => r[0]).map(r => rowObject_(headers,r));
    return json_({ok:true,items:items});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    console.log('RWG POST: ' + JSON.stringify({action:body.action,id:body.id,status:body.status}));

    if (body.action === 'submit') return submitVendor_(body);
    if (body.action === 'status') return updateStatus_(body);
    return json_({ok:false,error:'Unsupported action'});
  } catch (err) {
    console.error('RWG POST ERROR: ' + String(err));
    return json_({ok:false,error:String(err)});
  }
}

function submitVendor_(body) {
  const sheet = getSheet_();
  if (!body.businessName || !body.ownerName || !body.mobile || !body.whatsapp || !body.category || !body.city) {
    return json_({ok:false,error:'Required vendor information is missing.'});
  }

  const now = new Date();
  const id = 'RWG-' + Utilities.formatDate(now,'Asia/Kolkata','yyyyMMdd-HHmmss') + '-' + Math.floor(100 + Math.random()*900);
  const folder = getUploadFolder_();
  const logoUrl = saveFile_(folder,body.logo,id+'-logo');
  const photos = Array.isArray(body.photos) ? body.photos.slice(0,10) : [];
  const photoUrls = photos.map((photo,index)=>saveFile_(folder,photo,id+'-photo-'+(index+1))).filter(Boolean);

  const row = [
    id,body.businessName||'',body.ownerName||'',body.mobile||'',body.whatsapp||'',body.email||'',
    body.experience||'',body.category||'',body.city||'',body.address||'',body.serviceAreas||'',
    body.maps||'',body.about||'',body.services||'',body.startingPrice||'',body.languages||'',
    body.specialities||'',body.instagram||'',body.website||'',body.facebook||'',body.portfolio||'',
    logoUrl,photoUrls.join('\n'),Utilities.formatDate(now,'Asia/Kolkata','yyyy-MM-dd HH:mm:ss'),
    'Pending Approval',body.notes||''
  ];

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  return json_({ok:true,id:id,status:'Pending Approval'});
}

function updateStatus_(body) {
  const allowed = ['Approved','Rejected','Edit Required','Pending Approval'];
  if (!allowed.includes(body.status)) return json_({ok:false,error:'Invalid status'});
  if (!body.id) return json_({ok:false,error:'Submission ID is missing'});

  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();

  for (let i=1;i<data.length;i++) {
    if (String(data[i][0]).trim() === String(body.id).trim()) {
      sheet.getRange(i+1,25).setValue(body.status);
      sheet.getRange(i+1,26).setValue(body.note || '');
      SpreadsheetApp.flush();
      console.log('RWG STATUS UPDATED: ' + body.id + ' -> ' + body.status + ' row ' + (i+1));
      return json_({ok:true,id:body.id,status:body.status,row:i+1});
    }
  }

  console.error('RWG SUBMISSION NOT FOUND: ' + body.id);
  return json_({ok:false,error:'Submission not found',id:body.id});
}

function getUploadFolder_() {
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function saveFile_(folder,fileData,name) {
  if (!fileData || !fileData.data) return '';
  const mime = fileData.type || 'image/jpeg';
  const bytes = Utilities.base64Decode(fileData.data);
  const blob = Utilities.newBlob(bytes,mime,name + mimeExtension_(mime));
  return folder.createFile(blob).getUrl();
}

function mimeExtension_(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

function rowObject_(headers,row) {
  const obj = {};
  headers.forEach((header,index)=>obj[header]=row[index] || '');
  return obj;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
