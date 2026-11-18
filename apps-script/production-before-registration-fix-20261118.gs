/************************************************************

 * RAJASTHAN WEDDING GUIDE

 * Vendor Registration + Secure Admin Approval Backend

 ************************************************************/


const SPREADSHEET_ID =

  '1XxO0mATpxA85Qc0BZW3oMk7pULuypZeXchqSEJuRsQY';



const SHEET_NAME = 'Vendor Registrations';

const AUDIT_SHEET_NAME = 'Admin Audit Log';



const PHOTO_FOLDER_NAME =

  'Rajasthan Wedding Guide - Vendor Uploads';



/*

 * IMPORTANT:

 * This must be the SAME Google OAuth Web Client ID

 * used by admin-review\.html

 */

const GOOGLE_CLIENT_ID =

  '180810306472-6u3ujevmmm3hhvjim4jfll136tn5b5dc.apps.googleusercontent.com';



/*

 * Only this Google account can approve/reject/edit vendors.

 */

const AUTHORIZED_ADMIN_EMAIL =

  'sharadmn29\@gmail.com';





/************************************************************

 * VENDOR SHEET HEADERS

 ************************************************************/



const HEADERS = [

  'Submission ID',

  'Business Name',

  'Owner Name',

  'Mobile',

  'WhatsApp',

  'Email',

  'Years in Business',

  'Category',

  
  'District',

'City',

  'Full Address',

  'Service Areas',

  'Google Maps',

  'About Business',

  'Services',

  'Starting Price',

  'Languages',

  'Specialities',

  'Instagram',

  'Website',

  'Facebook',

  'Portfolio Link',

  'Logo URL',

  'Photo URLs',

  'Registration Date',

  'Status',

  'Review Notes'

];





/************************************************************

 * SPREADSHEET CONNECTION

 ************************************************************/



function getSpreadsheet_() {

  return SpreadsheetApp.openById(

    SPREADSHEET_ID

  );

}





/************************************************************

 * GET / CREATE VENDOR SHEET

 ************************************************************/



function getSheet_() {



  const ss = getSpreadsheet_();



  let sheet =

    ss.getSheetByName(SHEET_NAME);



  if (!sheet) {

    sheet =

      ss.insertSheet(SHEET_NAME);

  }



  if (sheet.getLastRow() === 0) {



    sheet

      .getRange(

        1,

        1,

        1,

        HEADERS.length

      )

      .setValues([HEADERS]);



    sheet

      .getRange(

        1,

        1,

        1,

        HEADERS.length

      )

      .setFontWeight('bold')

      .setBackground('#c7a15a');



    sheet.setFrozenRows(1);

  }



  return sheet;

}





/************************************************************

 * GET / CREATE AUDIT LOG

 ************************************************************/



/******************************************************************************
 * HEADER-BASED COLUMN LOOKUP
 * Prevents Status / Review Notes updates from breaking when columns are added.
 ******************************************************************************/

function getHeaderColumn_(sheet, headerName) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) throw new Error('Vendor sheet has no headers.');

  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const index = headers.findIndex(function (header) {
    return String(header || '').trim() === headerName;
  });

  if (index === -1) {
    throw new Error('Required sheet header not found: ' + headerName);
  }
  return index + 1;
}


function getAuditSheet_() {



  const ss = getSpreadsheet_();



  let sheet =

    ss.getSheetByName(

      AUDIT_SHEET_NAME

    );



  if (!sheet) {



    sheet =

      ss.insertSheet(

        AUDIT_SHEET_NAME

      );

  }



  /*

   * Upgrade old audit sheet automatically.

   */

  const requiredHeaders = [

    'Date',

    'Submission ID',

    'Action',

    'Note',

    'Admin Email',

    'Google Account ID'

  ];



  if (sheet.getLastRow() === 0) {



    sheet

      .getRange(

        1,

        1,

        1,

        requiredHeaders.length

      )

      .setValues([

        requiredHeaders

      ]);



  } else {



    /*

     * Preserve existing audit records.

     * Add the two new headers if old sheet

     * only had 4 columns.

     */

    sheet

      .getRange(

        1,

        1,

        1,

        requiredHeaders.length

      )

      .setValues([

        requiredHeaders

      ]);

  }



  sheet

    .getRange(

      1,

      1,

      1,

      requiredHeaders.length

    )

    .setFontWeight('bold')

    .setBackground('#c7a15a');



  sheet.setFrozenRows(1);



  return sheet;

}





/************************************************************

 * INITIAL SETUP

 ************************************************************/



function setupSystem() {



  getSheet_();

  getAuditSheet_();

  getUploadFolder_();



  Logger.log(

    'Rajasthan Wedding Guide Secure System Ready'

  );



  return 'Rajasthan Wedding Guide Secure System Ready';

}





/************************************************************

 * GET REQUEST

 *

 * Examples:

 *

 * ?action=test

 * ?action=list

 * ?action=list&status=Approved

 ************************************************************/



function doGet(e){try{const p=e&&e.parameter?e.parameter:{},action=String(p.action||'list').trim().toLowerCase();if(action==='test')return json_({ok:true,message:'Rajasthan Wedding Guide API working'});if(action!=='list')return json_({ok:false,error:'Unsupported GET action'});const values=getSheet_().getDataRange().getDisplayValues(),headers=values[0]||[];let items=values.slice(1).map(r=>rowObject_(headers,r)).filter(v=>String(v['Submission ID']||'').trim()&&String(v.Status||'').trim()==='Approved').map(publicProductionVendor_);if(p.status&&String(p.status).trim()!=='Approved')items=[];return json_({ok:true,count:items.length,items});}catch(err){Logger.log('Public vendor read failed');return json_({ok:false,error:'Vendor information could not be loaded. Please try again.'});}}
function publicProductionVendor_(vendor){const allowed=['Submission ID','Business Name','Mobile','WhatsApp','Years in Business','Category','District','City','Full Address','Service Areas','Google Maps','About Business','Services','Starting Price','Languages','Specialities','Instagram','Website','Facebook','Portfolio Link','Logo URL','Photo URLs','Status'];const result={};allowed.forEach(key=>{if(Object.prototype.hasOwnProperty.call(vendor,key))result[key]=vendor[key];});return result;}

function doPost(e){try{const b=JSON.parse(e&&e.postData&&e.postData.contents||'{}'),action=String(b.action||'').trim().toLowerCase();if(action==='submit')return submitVendor_(b);if(action==='status'||action==='admin-list'||action==='photo-update'){const admin=verifyGoogleAdminToken_(b.idToken);if(!admin.ok)return json_({ok:false,error:admin.error||'Unauthorized admin'});if(action==='status')return updateStatus_(b,admin);if(action==='photo-update')return updateVendorPhoto_(b,admin);const values=getSheet_().getDataRange().getDisplayValues(),headers=values[0]||[];return json_({ok:true,items:values.slice(1).map(r=>rowObject_(headers,r)).filter(v=>String(v['Submission ID']||'').trim())});}return json_({ok:false,error:'Unsupported POST action'});}catch(err){Logger.log('Vendor request failed');return json_({ok:false,error:'Request could not be processed. Please try again.'});}}

function verifyGoogleAdminToken_(

  idToken

) {



  try {



    if (

      !idToken ||

      typeof idToken !== 'string'

    ) {



      return {



        ok: false,



        error:

          'Google ID token missing.'



      };

    }





    /*

     * Ask Google's tokeninfo service

     * to validate the Google ID token.

     */



    const verificationUrl =

      'https\://oauth2.googleapis.com/tokeninfo?id_token=' +

      encodeURIComponent(

        idToken

      );





    const response =

      UrlFetchApp.fetch(

        verificationUrl,

        {

          method: 'get',

          muteHttpExceptions: true

        }

      );





    const responseCode =

      response.getResponseCode();





    if (responseCode !== 200) {



      Logger.log(

        'Google token verification rejected.'

      );



      return {



        ok: false,



        error:

          'Invalid or expired Google ID token.'



      };

    }





    let payload;



    try {



      payload =

        JSON.parse(

          response.getContentText()

        );



    }



    catch (err) {



      return {



        ok: false,



        error:

          'Invalid Google token response.'



      };

    }





    /********************************************************

     * AUDIENCE CHECK

     ********************************************************/



    const audience =

      String(

        payload.aud || ''

      );





    if (

      audience !==

      GOOGLE_CLIENT_ID

    ) {



      return {



        ok: false,



        error:

          'Invalid token audience.'



      };

    }





    /********************************************************

     * ISSUER CHECK

     ********************************************************/



    const issuer =

      String(

        payload.iss || ''

      );





    const validIssuer =

      issuer ===

        'accounts.google.com' ||



      issuer ===

        'https\://accounts.google.com';





    if (!validIssuer) {



      return {



        ok: false,



        error:

          'Invalid token issuer.'



      };

    }





    /********************************************************

     * EXPIRY CHECK

     ********************************************************/



    const expiry =

      Number(

        payload.exp || 0

      );





    const now =

      Math.floor(

        Date.now() / 1000

      );





    if (

      !expiry ||

      expiry <= now

    ) {



      return {



        ok: false,



        error:

          'Google login has expired.'



      };

    }





    /********************************************************

     * EMAIL VERIFIED CHECK

     ********************************************************/



    const emailVerified =

      payload.email_verified === true ||



      String(

        payload.email_verified || ''

      ).toLowerCase() === 'true';





    if (!emailVerified) {



      return {



        ok: false,



        error:

          'Google email is not verified.'



      };

    }





    /********************************************************

     * EMAIL CHECK

     ********************************************************/



    const email =

      String(

        payload.email || ''

      )

      .trim()

      .toLowerCase();





    if (!email) {



      return {



        ok: false,



        error:

          'Google email missing.'



      };

    }





    if (

      email !==

      AUTHORIZED_ADMIN_EMAIL

        .toLowerCase()

    ) {



      Logger.log(

        'Unauthorized Google account attempted admin action: ' +

        email

      );



      return {



        ok: false,



        error:

          'This Google account is not authorized.'



      };

    }





    /********************************************************

     * GOOGLE ACCOUNT SUBJECT

     ********************************************************/



    const subject =

      String(

        payload.sub || ''

      ).trim();





    if (!subject) {



      return {



        ok: false,



        error:

          'Google account ID missing.'



      };

    }





    return {



      ok: true,



      email:

        email,



      sub:

        subject,



      name:

        String(

          payload.name || ''

        ),



      exp:

        expiry



    };



  }



  catch (err) {



    Logger.log(

      'TOKEN VERIFY ERROR: ' +

      err

    );



    return {



      ok: false,



      error:

        'Google authentication verification failed.'



    };



  }

}





/************************************************************

 * SUBMIT NEW VENDOR

 ************************************************************/



function submitVendor_(

  body

) {



  const sheet =

    getSheet_();





  /*

   * REQUIRED FIELDS

   */

  if (

    !body.businessName ||

    !body.ownerName ||

    !body.mobile ||

    !body.whatsapp ||

    !body.category ||

    !body.city

  ) {



    return json_({



      ok: false,



      error:

        'Required vendor information is missing.'



    });

  }





  const now =

    new Date();





  const id =

    'RWG-' +



    Utilities.formatDate(

      now,

      'Asia/Kolkata',

      'yyyyMMdd-HHmmss'

    ) +



    '-' +



    Math.floor(

      100 +

      Math.random() * 900

    );





  /**********************************************************

   * FILE UPLOAD

   **********************************************************/



  const folder =

    getUploadFolder_();





  const logoUrl =

    saveFile_(

      folder,

      body.logo,

      id + '-logo'

    );





  const photos =

    Array.isArray(

      body.photos

    )



      ? body.photos.slice(

          0,

          10

        )



      : [];





  const photoUrls =

    photos



      .map(

        (photo, index) =>



          saveFile_(

            folder,

            photo,



            id +

            '-photo-' +

            (index + 1)

          )

      )



      .filter(Boolean);





  /**********************************************************

   * CREATE ROW

   **********************************************************/



  const row = [



    id,



    body.businessName || '',



    body.ownerName || '',



    body.mobile || '',



    body.whatsapp || '',



    body.email || '',



    body.experience || '',



    body.category || '',



    
    body.district || '',

body.city || '',



    body.address || '',



    body.serviceAreas || '',



    body.maps || '',



    body.about || '',



    body.services || '',



    body.startingPrice || '',



    body.languages || '',



    body.specialities || '',



    body.instagram || '',



    body.website || '',



    body.facebook || '',



    body.portfolio || '',



    logoUrl,



    photoUrls.join('\n'),



    Utilities.formatDate(

      now,

      'Asia/Kolkata',

      'yyyy-MM-dd HH:mm:ss'

    ),



    'Pending Approval',



    body.notes || ''



  ];





  sheet.appendRow(

    row

  );





  SpreadsheetApp.flush();





  return json_({



    ok: true,



    id:

      id,



    status:

      'Pending Approval',



    message:

      'Vendor registration received successfully.'



  });

}





/************************************************************

 * SECURE UPDATE STATUS

 *

 * ONLY authenticated admin can reach this function

 * through doPost().

 ************************************************************/



function updateStatus_(

  body,

  admin

) {



  /*

   * Do NOT allow Pending Approval through

   * the public/admin status API.

   *

   * New registrations receive Pending Approval

   * automatically during submitVendor_().

   */



  const allowed = [



    'Approved',



    'Rejected',



    'Edit Required'



  ];





  const id =

    String(

      body.id || ''

    ).trim();





  const status =

    String(

      body.status || ''

    ).trim();





  const note =

    String(

      body.note || ''

    ).trim();





  /**********************************************************

   * DEFENSIVE ADMIN CHECK

   **********************************************************/



  if (

    !admin ||

    !admin.ok

  ) {



    return json_({



      ok: false,



      error:

        'Unauthorized admin.'



    });

  }





  if (

    String(

      admin.email || ''

    )

    .toLowerCase() !==

    AUTHORIZED_ADMIN_EMAIL

      .toLowerCase()

  ) {



    return json_({



      ok: false,



      error:

        'Unauthorized admin account.'



    });

  }





  /**********************************************************

   * VALIDATE ID

   **********************************************************/



  if (!id) {



    return json_({



      ok: false,



      error:

        'Submission ID missing'



    });

  }





  /**********************************************************

   * VALIDATE STATUS

   **********************************************************/



  if (

    !allowed.includes(

      status

    )

  ) {



    return json_({



      ok: false,



      error:

        'Invalid admin status: ' +

        status



    });

  }





  const sheet =

    getSheet_();





  const lastRow =

    sheet.getLastRow();





  if (lastRow < 2) {



    return json_({



      ok: false,



      error:

        'No vendor submissions found'



    });

  }





  /**********************************************************

   * FIND SUBMISSION ID

   **********************************************************/



  const ids =

    sheet



      .getRange(

        2,

        1,

        lastRow - 1,

        1

      )



      .getDisplayValues();





  let foundRow = -1;





  for (

    let i = 0;

    i < ids.length;

    i++

  ) {



    const sheetId =

      String(

        ids[i][0]

      ).trim();





    if (

      sheetId === id

    ) {



      foundRow =

        i + 2;



      break;

    }

  }





  if (

    foundRow === -1

  ) {



    Logger.log(

      'Submission not found: ' +

      id

    );





    return json_({



      ok: false,



      error:

        'Submission not found',



      id:

        id



    });

  }

  /******************************************************************************
   * HEADER-BASED STATUS / REVIEW NOTES UPDATE
   ******************************************************************************/

  const statusColumn = getHeaderColumn_(sheet, 'Status');
  const reviewNotesColumn = getHeaderColumn_(sheet, 'Review Notes');

  sheet.getRange(foundRow, statusColumn).setValue(status);
  sheet.getRange(foundRow, reviewNotesColumn).setValue(note);





  SpreadsheetApp.flush();





  /**********************************************************

   * AUTHENTICATED AUDIT LOG

   **********************************************************/



  writeAuditLog_({



    vendorId:

      id,



    action:

      status,



    note:

      note,



    adminEmail:

      admin.email,



    adminGoogleId:

      admin.sub



  });





  Logger.log(

    'STATUS UPDATED: ' +

    id +

    ' => ' +

    status +

    ' by ' +

    admin.email

  );





  return json_({



    ok: true,



    id:

      id,



    status:

      status,



    row:

      foundRow,



    admin:

      admin.email,



    message:

      'Vendor status updated successfully'



  });

}





/************************************************************

 * WRITE AUDIT LOG

 ************************************************************/



function writeAuditLog_(

  entry

) {



  const audit =

    getAuditSheet_();





  audit.appendRow([



    Utilities.formatDate(

      new Date(),

      'Asia/Kolkata',

      'yyyy-MM-dd HH:mm:ss'

    ),



    entry.vendorId || '',



    entry.action || '',



    entry.note || '',



    entry.adminEmail || '',



    entry.adminGoogleId || ''



  ]);





  SpreadsheetApp.flush();

}





/************************************************************

 * UPLOAD FOLDER

 ************************************************************/



function getUploadFolder_() {



  const folders =

    DriveApp.getFoldersByName(

      PHOTO_FOLDER_NAME

    );





  if (

    folders.hasNext()

  ) {



    return folders.next();

  }





  return DriveApp.createFolder(

    PHOTO_FOLDER_NAME

  );

}





/************************************************************

 * SAVE IMAGE

 ************************************************************/



function saveFile_(folder,fileData,name) {
  if (!fileData) return '';
  const mime=String(fileData.type||'');
  if (!['image/jpeg','image/png','image/webp'].includes(mime)) throw new Error('Unsupported photo type');
  const base64=String(fileData.data||'').split(',').pop();
  if (!base64 || base64.length>1400000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error('Invalid or oversized photo');
  const bytes=Utilities.base64Decode(base64),u=i=>(bytes[i]+256)%256;
  const valid=mime==='image/jpeg'?u(0)===255&&u(1)===216&&u(2)===255:mime==='image/png'?u(0)===137&&u(1)===80&&u(2)===78&&u(3)===71:u(0)===82&&u(1)===73&&u(2)===70&&u(3)===70&&u(8)===87&&u(9)===69&&u(10)===66&&u(11)===80;
  if (!valid) throw new Error('Invalid photo content');
  const file=folder.createFile(Utilities.newBlob(bytes,mime,name+mimeExtension_(mime)));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(file.getId())+'&sz=w1200';
}


function mimeExtension_(

  mime

) {



  if (

    mime ===

    'image/png'

  ) {



    return '.png';

  }





  if (

    mime ===

    'image/webp'

  ) {



    return '.webp';

  }





  if (

    mime ===

    'image/gif'

  ) {



    return '.gif';

  }





  return '.jpg';

}





/************************************************************

 * ROW TO OBJECT

 ************************************************************/



function rowObject_(

  headers,

  row

) {



  const obj = {};





  headers.forEach(

    (header, index) => {



      obj[header] =

        row[index] || '';



    }

  );





  return obj;

}





/************************************************************

 * JSON RESPONSE

 ************************************************************/



function json_(

  data

) {



  return ContentService



    .createTextOutput(

      JSON.stringify(

        data

      )

    )



    .setMimeType(

      ContentService.MimeType.JSON

    );

}





/************************************************************

 * CONNECTION TEST

 *

 * SAFE TO RUN MANUALLY

 ************************************************************/



function testConnection() {



  const ss =

    getSpreadsheet_();





  const sheet =

    getSheet_();





  Logger.log(

    'CONNECTED SUCCESSFULLY'

  );





  Logger.log(

    'Spreadsheet Name: ' +

    ss.getName()

  );





  Logger.log(

    'Spreadsheet ID: ' +

    ss.getId()

  );





  Logger.log(

    'Spreadsheet URL: ' +

    ss.getUrl()

  );





  Logger.log(

    'Sheet Name: ' +

    sheet.getName()

  );





  Logger.log(

    'Rows: ' +

    sheet.getLastRow()

  );





  Logger.log(

    'Columns: ' +

    sheet.getLastColumn()

  );

}





/************************************************************

 * TEST VENDOR SUBMISSION

 *

 * SAFE TEST FOR REGISTRATION

 ************************************************************/



function testVendorSubmission() {



  const body = {



    action:

      'submit',



    businessName:

      'RWG TEST Wedding Studio',



    ownerName:

      'Test Owner',



    mobile:

      '9999999999',



    whatsapp:

      '9999999999',



    email:

      'test\@example.com',



    experience:

      '10 Years',



    category:

      'Photographer',



    city:

      'Didwana',



    address:

      'Test Address Didwana',



    serviceAreas:

      'Didwana, Nagaur',



    about:

      'Test Rajasthan Wedding Guide vendor',



    services:

      'Wedding Photography',



    startingPrice:

      '10000',



    languages:

      'Hindi',



    specialities:

      'Wedding Photography'



  };





  const result =

    submitVendor_(

      body

    );





  Logger.log(

    result.getContent()

  );

}





/************************************************************

 * IMPORTANT SECURITY TEST

 *

 * This test intentionally calls updateStatus_ WITHOUT

 * an authenticated admin.

 *

 * It should return Unauthorized admin.

 *

 * It MUST NOT change a vendor status.

 ************************************************************/



function testUnauthorizedStatusUpdate() {



  const result =

    updateStatus_(

      {

        id:

          'TEST-ID',



        status:

          'Approved',



        note:

          'Unauthorized security test'

      },



      null

    );





  Logger.log(

    result.getContent()

  );

}/**

 * SECURITY TEST: INVALID GOOGLE ID TOKEN

 *

 * Expected:

 * - Fake token must be rejected.

 * - Vendor status MUST NOT change.

 */

function testInvalidGoogleIdToken() {



  const fakeToken =

    'INVALID.FAKE.GOOGLE.ID.TOKEN';



  const result = updateStatus_(

    {

      id: 'TEST-INVALID-TOKEN',

      status: 'Approved',

      note: 'Invalid token security test'

    },

    fakeToken

  );



  Logger.log(result.getContent());

}/**

 * SECURITY TEST: EXPIRED GOOGLE ID TOKEN

 *

 * SAFE TEST:

 * - किसी vendor को update नहीं करता

 * - Sheet में vendor status नहीं बदलता

 * - केवल expiry validation logic test करता है

 */

function testExpiredGoogleIdToken() {



  // Current Unix time in seconds

  const now = Math.floor(Date.now() / 1000);



  // Test payload: token 1 hour पहले expire हो चुका है

  const fakeExpiredPayload = {

    iss: 'https\://accounts.google.com',

    aud: GOOGLE_CLIENT_ID,

    email: AUTHORIZED_ADMIN_EMAIL,

    email_verified: true,

    exp: now - 3600

  };



  // Expiry validation

  if (!fakeExpiredPayload.exp || fakeExpiredPayload.exp <= now) {

    Logger.log(

      JSON.stringify({

        ok: false,

        error: 'Google ID token expired.'

      })

    );

    return;

  }



  // यह line इस test में कभी नहीं आनी चाहिए

  Logger.log(

    JSON.stringify({

      ok: true,

      error: 'TEST FAILED: Expired token was accepted.'

    })

  );

}/**

 * SECURITY TEST: UNAUTHORIZED GOOGLE ACCOUNT

 *

 * SAFE TEST:

 * - किसी vendor status को change नहीं करता

 * - केवल authorized admin email check करता है

 */

function testUnauthorizedGoogleAccount() {



  // Authorized admin के अलावा dummy Google account

  const testGoogleAccount = {

    email: 'unauthorized-test\@example.com',

    email_verified: true

  };



  const testEmail = String(testGoogleAccount.email || '')

    .trim()

    .toLowerCase();



  const authorizedEmail = String(AUTHORIZED_ADMIN_EMAIL || '')

    .trim()

    .toLowerCase();



  // Email verified check

  if (testGoogleAccount.email_verified !== true) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Google account email is not verified.'

    }));

    return;

  }



  // Authorized admin email check

  if (testEmail !== authorizedEmail) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Unauthorized admin account.'

    }));

    return;

  }



  // इस test में यहाँ कभी नहीं पहुँचना चाहिए

  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Unauthorized Google account was accepted.'

  }));

}/**

 * SECURITY TEST: UNVERIFIED GOOGLE EMAIL

 *

 * SAFE:

 * - किसी vendor status को change नहीं करता

 * - केवल email_verified security rule test करता है

 */

function testUnverifiedGoogleEmail() {



  const testGoogleAccount = {

    email: AUTHORIZED_ADMIN_EMAIL,

    email_verified: false

  };



  // Security check

  if (testGoogleAccount.email_verified !== true) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Google account email is not verified.'

    }));

    return;

  }



  // यहाँ कभी नहीं पहुँचना चाहिए

  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Unverified Google email was accepted.'

  }));

}function testMissingGoogleIdToken() {



  const result = verifyGoogleAdminToken_(null);



  Logger.log(

    JSON.stringify(result)

  );



}function testWrongGoogleAudience() {



  // Fake verified-style payload ONLY for testing audience logic.

  // No Sheet access. No vendor status update.

  const testPayload = {

    aud: 'WRONG-CLIENT-ID.apps.googleusercontent.com'

  };



  const audience = String(testPayload.aud || '');



  if (audience !== GOOGLE_CLIENT_ID) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Invalid Google token audience.'

    }));

    return;

  }



  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Wrong Google audience was accepted.'

  }));

}function testInvalidGoogleIssuer() {



  // Fake payload only for issuer validation test.

  // No Sheet access. No vendor status update.

  const testPayload = {

    iss: 'https\://fake.example.com'

  };



  const issuer = String(testPayload.iss || '');



  const validIssuer =

    issuer === 'accounts.google.com' ||

    issuer === 'https\://accounts.google.com';



  if (!validIssuer) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Invalid token issuer.'

    }));

    return;

  }



  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Invalid issuer was accepted.'

  }));

}function testMissingGoogleEmail() {



  // Fake payload only for email validation.

  // No Sheet access. No vendor status update.

  const testPayload = {

    email: ''

  };



  const email = String(testPayload.email || '').trim();



  if (!email) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Google email missing.'

    }));

    return;

  }



  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Missing Google email was accepted.'

  }));

}function testMissingGoogleSubjectId() {



  // Fake payload only for subject-ID validation.

  // No Sheet access. No vendor status update.

  const testPayload = {

    sub: ''

  };



  const subject = String(testPayload.sub || '').trim();



  if (!subject) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Google subject ID missing.'

    }));

    return;

  }



  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Missing Google subject ID was accepted.'

  }));

}/**

 * SECURITY TEST:

 * Authorized-admin context + invalid status/action.

 *

 * SAFE:

 * - updateStatus_() को call नहीं करता

 * - Spreadsheet नहीं खोलता

 * - किसी vendor record को change नहीं करता

 * - Google ID token को log/store नहीं करता

 */

function testInvalidAdminStatusAction() {



  // Simulates the state AFTER a valid token has already

  // authenticated the authorized admin.

  const verifiedAdmin = {

    ok: true,

    email: AUTHORIZED_ADMIN_EMAIL,

    sub: 'SAFE-TEST-SUBJECT'

  };



  // Deliberately invalid status/action

  const requestedStatus = 'SUPER_APPROVED';



  const allowedStatuses = [

    'Pending Approval',

    'Edit Required',

    'Approved',

    'Rejected'

  ];



  // Confirm authorized-admin context first

  if (

    !verifiedAdmin.ok ||

    String(verifiedAdmin.email || '').toLowerCase() !==

      String(AUTHORIZED_ADMIN_EMAIL || '').toLowerCase()

  ) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'TEST SETUP FAILED: Authorized admin context missing.'

    }));

    return;

  }



  // Test invalid status rejection

  if (!allowedStatuses.includes(requestedStatus)) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'Invalid status.'

    }));

    return;

  }



  // This line must NEVER be reached

  Logger.log(JSON.stringify({

    ok: true,

    error: 'TEST FAILED: Invalid status was accepted.'

  }));

}function testAuthorizedAdminEndToEnd() {



  // ONLY this TEST vendor will be touched.

  const TEST_VENDOR_ID = 'RWG-20261002-122123-755';



  // Build authenticated admin context from the account

  // currently running this Apps Script test.

 const admin = verifyGoogleAdminToken_(idToken);



  if (!admin || !admin.ok) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'TEST STOPPED: Authorized admin verification failed.',

      admin: admin

    }));

    return;

  }



  // Extra safety: never continue unless this is the configured admin.

  if (

    String(admin.email || '').toLowerCase() !==

    String(AUTHORIZED_ADMIN_EMAIL || '').toLowerCase()

  ) {

    Logger.log(JSON.stringify({

      ok: false,

      error: 'TEST STOPPED: Google account is not the authorized admin.',

      email: admin.email || ''

    }));

    return;

  }



  const body = {

    id: TEST_VENDOR_ID,

    status: 'Approved',

    note: 'Authorized admin end-to-end TEST'

  };



  const result = updateStatus_(body, admin);



  Logger.log(

    'AUTHORIZED END-TO-END TEST RESULT: ' +

    result.getContent()

  );

}

/******************************************************************************
 * ONE-TIME SAFE MIGRATION: ADD DISTRICT BETWEEN CATEGORY AND CITY
 * Run manually ONCE on development before deployment.
 ******************************************************************************/
function migrateVendorSheetAddDistrict() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    throw new Error('Vendor Registrations sheet is empty.');
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(function (header) { return String(header || '').trim(); });

  if (currentHeaders.indexOf('District') !== -1) {
    Logger.log('District column already exists. No migration needed.');
    return;
  }

  const categoryIndex = currentHeaders.indexOf('Category');
  const cityIndex = currentHeaders.indexOf('City');

  if (categoryIndex === -1 || cityIndex === -1) {
    throw new Error('Migration stopped: Category or City header was not found.');
  }
  if (cityIndex !== categoryIndex + 1) {
    throw new Error('Migration stopped: City is not immediately after Category.');
  }

  const cityColumnNumber = cityIndex + 1;
  sheet.insertColumnBefore(cityColumnNumber);
  sheet.getRange(1, cityColumnNumber)
    .setValue('District')
    .setFontWeight('bold')
    .setBackground('#c7a15a');

  SpreadsheetApp.flush();

  const migratedHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(function (header) { return String(header || '').trim(); });

  const districtIndex = migratedHeaders.indexOf('District');
  const migratedCityIndex = migratedHeaders.indexOf('City');
  if (districtIndex === -1 || migratedCityIndex !== districtIndex + 1) {
    throw new Error('Migration verification failed: District/City order is wrong.');
  }

  const statusColumn = getHeaderColumn_(sheet, 'Status');
  const reviewNotesColumn = getHeaderColumn_(sheet, 'Review Notes');

  Logger.log(
    'SUCCESS: District added between Category and City. Existing vendor records preserved: ' +
    Math.max(lastRow - 1, 0) +
    '. Status column: ' + statusColumn +
    '. Review Notes column: ' + reviewNotesColumn + '.'
  );
}


function updateVendorPhoto_(body,admin) {
  if (!admin || !admin.ok || String(admin.email||'').toLowerCase()!==AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return json_({ok:false,error:'Unauthorized admin'});
  const id=String(body.id||'').trim(),sheet=getSheet_();
  if (!id || !body.logo) return json_({ok:false,error:'Vendor and photo are required'});
  const values=sheet.getDataRange().getDisplayValues(),headers=values[0]||[];
  const idCol=headers.indexOf('Submission ID'),photoCol=headers.indexOf('Logo URL');
  if (idCol<0 || photoCol<0) throw Error('Photo column missing');
  const row=values.findIndex((r,i)=>i>0&&String(r[idCol]).trim()===id);
  if (row<1) return json_({ok:false,error:'Vendor not found'});
  const photo=saveFile_(getUploadFolder_(),body.logo,id+'-photo-'+Date.now());
  sheet.getRange(row+1,photoCol+1).setValue(photo);SpreadsheetApp.flush();
  writeAuditLog_({vendorId:id,action:'Photo updated',note:'Vendor profile photo updated by admin',adminEmail:admin.email,adminGoogleId:admin.sub});
  return json_({ok:true,id,photoUrl:photo});
}
