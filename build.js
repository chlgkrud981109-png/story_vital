// Cloudflare Pages 빌드: prototype/ 을 dist/ 로 복사 (별도 번들링 없음)
// 기존 Pages 설정(npm run build → dist 배포)을 그대로 재활용하기 위한 스크립트
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'prototype');
const out = path.join(__dirname, 'dist');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
console.log('dist/ 생성 완료 —', fs.readdirSync(out).join(', '));
