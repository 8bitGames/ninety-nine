const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = 'public/bot-icon';
const outputDir = 'public/bot-icon/optimized';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, path.parse(file).name + '.webp');

            sharp(inputPath)
                .resize(256, 256, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 80 })
                .toFile(outputPath)
                .then(info => {
                    console.log(`Optimized: ${file} -> ${outputPath}`);
                })
                .catch(err => {
                    console.error(`Error processing ${file}:`, err);
                });
        }
    });
});
