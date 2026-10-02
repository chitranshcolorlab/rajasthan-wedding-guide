const SPREADSHEET_ID = '1zDHxB0mFJ8mOWYHt2sorA_GrdtB402VW303vJuLI7zA';
const SHEET_NAME = 'Vendor Registrations';
const PHOTO_FOLDER_NAME = 'Rajasthan Wedding Guide - Vendor Uploads';

function doGet(e) {
  const action = (e.parameter.action || 'list').toLowerCase();
  if (action !== 'list') return json_({ok:false,error:'Unsupported action'});
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return json_({ok:true,items:[]});
  const headers = values[0];
  const items = values.slice(1).filter(r => r[0]).map(r => rowObject_(headers,r));
  return json_({ok:true,items:items});
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'submit') return submit_(body);
    if (body.action === 'status') return status_(body);
    return json_({ok:false,error:'Unsupported action'});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}

function submit_(body) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const id = 'RWG-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd-HHmmss') + '-' + Math.floor(100+Math.random()*900);
  const folder = getUploadFolder_();
  const logoUrl = saveFile_(folder, body.logo, id + '-logo');
  const photoUrls = (body.photos || []).slice(0,10).map((p,i)=>saveFile_(folder,p,id+'-photo-'+(i+1))).filter(Boolean);
  const row = [id,body.businessName||'',body.ownerName||'',body.mobile||'',body.whatsapp||'',body.email||'',body.experience||'',body.category||'',body.city||'',body.address||'',body.serviceAreas||'',body.maps||'',body.about||'',body.services||'',body.startingPrice||'',body.languages||'',body.specialities||'',body.instagram||'',body.website||'',body.facebook||'',body.portfolio||'',logoUrl,photoUrls.join('\n'),Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd HH:mm:ss'),'Pending Approval',body.notes||''];
  sheet.appendRow(row);
  return json_({ok:true,id:id,status:'Pending Approval'});
}

function status_(body) {
  const allowed = ['Approved','Rejected','Edit Required','Pending Approval'];
  if (!allowed.includes(body.status)) return json_({ok:false,error:'Invalid status'});
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i=1;i<data.length;i++) {
    if (String(data[i][0]) === String(body.id)) {
      sheet.getRange(i+1,25).setValue(body.status);
      sheet.getRange(i+1,26).setValue(body.note || '');
      return json_({ok:true,id:body.id,status:body.status});
    }
  }
  return json_({ok:false,error:'Submission not found'});
}

function getUploadFolder_() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function saveFile_(folder, f, name) {
  if (!f || !f.data) return '';
  const bytes = Utilities.base64Decode(f.data);
  const ext = mimeExt_(f.type || 'image/jpeg');
  const blob = Utilities.newBlob(bytes, f.type || 'image/jpeg', name + ext);
  const file = folder.createFile(blob);
  return file.getUrl();
}

function mimeExt_(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

function rowObject_(headers,row) {
  const o={}; headers.forEach((h,i)=>o[h]=row[i]||''); return o;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
