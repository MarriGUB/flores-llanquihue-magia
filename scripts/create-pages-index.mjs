import { promises as fs } from 'fs';
import path from 'path';

const projectBase = '/flores-llanquihue-magia';
const clientDir = path.resolve('dist', 'client');
const assetsDir = path.join(clientDir, 'assets');

try {
  const files = await fs.readdir(assetsDir);
  const indexScript = files.find((file) => /^index-.*\.js$/.test(file));
  const styleFile = files.find((file) => /^styles-.*\.css$/.test(file));
  if (!indexScript) throw new Error('No index script found in dist/client/assets');
  if (!styleFile) throw new Error('No stylesheet found in dist/client/assets');

  const faviconFile = (await fs.stat(path.join(clientDir, 'favicon.ico')).then(() => 'favicon.ico', () => null));

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flores Llanquihue Magia</title>
    ${faviconFile ? `<link rel="icon" type="image/png" href="${projectBase}/${faviconFile}" />` : ''}
    <link rel="stylesheet" href="${projectBase}/assets/${styleFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${projectBase}/assets/${indexScript}"></script>
  </body>
</html>`;

  await fs.writeFile(path.join(clientDir, 'index.html'), html, 'utf8');
  await fs.writeFile(path.join(clientDir, '404.html'), html, 'utf8');
  console.log('Created index.html and 404.html in dist/client');
} catch (error) {
  console.error('Failed to create pages index:', error);
  process.exit(1);
}
