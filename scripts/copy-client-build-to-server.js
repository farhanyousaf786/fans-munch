const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const clientBuildDir = path.join(projectRoot, 'client', 'build');
const serverBuildDir = path.join(projectRoot, 'server', 'build');

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function removeDirSync(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function copyDirSync(srcDir, destDir) {
  ensureDirSync(destDir);

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isFile()) {
      ensureDirSync(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  if (!fs.existsSync(clientBuildDir)) {
    console.error(`[copy-client-build-to-server] Missing client build folder: ${clientBuildDir}`);
    console.error('[copy-client-build-to-server] Run: npm --prefix client run build');
    process.exit(1);
  }

  console.log('[copy-client-build-to-server] Copying build output...');
  console.log('  from:', clientBuildDir);
  console.log('  to:  ', serverBuildDir);

  removeDirSync(serverBuildDir);
  copyDirSync(clientBuildDir, serverBuildDir);

  console.log('[copy-client-build-to-server] Done.');
}

main();
