const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier-terser');

const DIST_DIR = 'dist';

// Create dist folder
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

async function build() {
  console.log('🔨 Building production files...\n');

  // 1. Minify JavaScript
  console.log('📦 Minifying JavaScript...');
  const jsContent = fs.readFileSync('script.js', 'utf8');
  const jsResult = await minifyJS(jsContent, {
    compress: {
      drop_console: false, // Keep console logs for debugging
      dead_code: true,
      unused: true
    },
    mangle: {
      toplevel: false, // Don't mangle top-level names (needed for onclick handlers)
      reserved: [
        // Preserve function names used in HTML onclick attributes
        'removeFood', 'undoDelete', 'toggleTheme', 'quickAddMyFood',
        'deleteMyFood', 'toggleMyFoods', 'saveManualToMyFoods',
        'saveReminderSettings', 'requestNotificationPermission',
        'saveUserProfile', 'showOnboardingModal', 'deletePhoto',
        'editFood', 'cancelEdit', 'selectUSDAFood',
        'addMealSuggestion', 'addAllMealSuggestions', 'addFilipinoFood', 'toggleFilipinoFoods'
      ]
    },
    format: {
      comments: false
    }
  });
  
  if (jsResult.error) {
    console.error('❌ JS minification error:', jsResult.error);
    return;
  }
  
  fs.writeFileSync(path.join(DIST_DIR, 'script.js'), jsResult.code);
  const jsOrigSize = Buffer.byteLength(jsContent, 'utf8');
  const jsMinSize = Buffer.byteLength(jsResult.code, 'utf8');
  console.log(`   ✅ script.js: ${formatBytes(jsOrigSize)} → ${formatBytes(jsMinSize)} (${Math.round((1 - jsMinSize/jsOrigSize) * 100)}% smaller)\n`);

  // 2. Minify CSS
  console.log('🎨 Minifying CSS...');
  const cssContent = fs.readFileSync('style.css', 'utf8');
  const cssResult = new CleanCSS({
    level: 2 // Advanced optimizations
  }).minify(cssContent);
  
  if (cssResult.errors.length > 0) {
    console.error('❌ CSS minification errors:', cssResult.errors);
    return;
  }
  
  fs.writeFileSync(path.join(DIST_DIR, 'style.css'), cssResult.styles);
  const cssOrigSize = Buffer.byteLength(cssContent, 'utf8');
  const cssMinSize = Buffer.byteLength(cssResult.styles, 'utf8');
  console.log(`   ✅ style.css: ${formatBytes(cssOrigSize)} → ${formatBytes(cssMinSize)} (${Math.round((1 - cssMinSize/cssOrigSize) * 100)}% smaller)\n`);

  // 3. Minify HTML
  console.log('📄 Minifying HTML...');
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  const htmlResult = await minifyHTML(htmlContent, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true
  });
  
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), htmlResult);
  const htmlOrigSize = Buffer.byteLength(htmlContent, 'utf8');
  const htmlMinSize = Buffer.byteLength(htmlResult, 'utf8');
  console.log(`   ✅ index.html: ${formatBytes(htmlOrigSize)} → ${formatBytes(htmlMinSize)} (${Math.round((1 - htmlMinSize/htmlOrigSize) * 100)}% smaller)\n`);

  // 4. Copy additional HTML pages
  console.log('📄 Copying additional pages...');
  const additionalPages = ['about.html', 'privacy.html', 'terms.html'];
  for (const page of additionalPages) {
    if (fs.existsSync(page)) {
      const pageContent = fs.readFileSync(page, 'utf8');
      const minifiedPage = await minifyHTML(pageContent, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        minifyCSS: true
      });
      fs.writeFileSync(path.join(DIST_DIR, page), minifiedPage);
      console.log(`   ✅ ${page}`);
    }
  }
  console.log('');

  // 5. Copy PWA files
  console.log('📲 Copying PWA files...');
  
  // Copy manifest.json
  fs.copyFileSync('manifest.json', path.join(DIST_DIR, 'manifest.json'));
  console.log('   ✅ manifest.json');
  
  // Copy service worker (minify it too)
  const swContent = fs.readFileSync('sw.js', 'utf8');
  const swResult = await minifyJS(swContent, {
    compress: true,
    mangle: true,
    format: { comments: false }
  });
  fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swResult.code);
  console.log('   ✅ sw.js (minified)');
  
  // Copy icons folder
  const iconsDir = path.join(DIST_DIR, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
  }
  
  const iconFiles = fs.readdirSync('icons');
  iconFiles.forEach(file => {
    fs.copyFileSync(path.join('icons', file), path.join(iconsDir, file));
  });
  console.log(`   ✅ icons/ (${iconFiles.length} files)\n`);

  // Summary
  const totalOrig = jsOrigSize + cssOrigSize + htmlOrigSize;
  const totalMin = jsMinSize + cssMinSize + htmlMinSize;
  
  console.log('═'.repeat(50));
  console.log(`🎉 Build complete!`);
  console.log(`📊 Total: ${formatBytes(totalOrig)} → ${formatBytes(totalMin)} (${Math.round((1 - totalMin/totalOrig) * 100)}% smaller)`);
  console.log(`📁 Output: ./${DIST_DIR}/`);
  console.log('═'.repeat(50));
  console.log('\n💡 To preview: npm run serve');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

build().catch(console.error);

