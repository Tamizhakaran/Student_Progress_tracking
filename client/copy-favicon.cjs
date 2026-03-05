const fs = require('fs');
try {
    fs.copyFileSync('C:\\Users\\Tamizhakaran K\\.gemini\\antigravity\\brain\\ba412f75-257c-4230-abfe-403f09f383d6\\favicon_1772699621954.png', 'c:\\Users\\Tamizhakaran K\\OneDrive\\Desktop\\Student progress monitor\\client\\public\\favicon.png');
    console.log('Copy successful');
} catch (e) {
    console.error('Copy failed:', e);
}
