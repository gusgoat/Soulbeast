'use strict';
const fs=require('fs');const html=fs.readFileSync('topup-test.html','utf8').replace('<body>','<body><p style="padding:12px;text-align:center;background:#5d2626;color:white">หน้าทดสอบจำลอง · ไม่ส่งอีเมล ไม่รับเงิน และไม่ใช้บัญชีจริง</p>').replace('src="./client/topup-test.js"','src="./client/topup-auth-preview.js"');fs.writeFileSync('topup-auth-preview.html',html);
