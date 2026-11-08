import {cp, mkdir} from 'node:fs/promises';

await mkdir('dist', {recursive:true});
for (const file of ['index.html','stats.js','同学微信头像.jpg','剪影.jpg','剪影原始图片.jpg']) {
  await cp(file, `dist/${file}`);
}
