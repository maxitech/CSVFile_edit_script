const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const iconv = require('iconv-lite');

const inputDir = './input';
const outputDir = './output';

if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir).forEach((file) => {
  const inputFilePath = path.join(inputDir, file);
  const outputFilePath = path.join(
    outputDir,
    path.basename(file, path.extname(file)) + '_edit' + path.extname(file)
  );

  let csvWriter;
  let dataRows = [];

  fs.createReadStream(inputFilePath)
    .pipe(iconv.decodeStream('utf16le'))
    .pipe(csv({ separator: '\t' }))
    .on('headers', (headers) => {
      const newHeaders = headers
        .map((header) => {
          if (header === 'Projekt') {
            return [
              { id: 'projektnummer', title: 'Projektnummer' },
              { id: 'projektstandort', title: 'Projektstandort' },
            ];
          } else if (header === 'Ort' || header === 'Projektleiter') {
            return { id: header, title: header };
          }
        })
        .filter((header) => header !== undefined)
        .flat();

      newHeaders.push({ id: 'Beschreibung', title: 'Beschreibung' });

      csvWriter = createObjectCsvWriter({
        path: outputFilePath,
        header: newHeaders,
      });
    })
    .on('data', (row) => {
      if (row.Projekt) {
        const firstSpaceIndex = row.Projekt.indexOf(' ');
        const projektnummer = row.Projekt.substring(0, firstSpaceIndex);
        const projektstandort = row.Projekt.substring(firstSpaceIndex + 1);

        delete row.Projekt;
        row.projektnummer = projektnummer;
        row.projektstandort = projektstandort;
      } else {
        console.error('Missing Projekt data in row:', row);
        row.projektnummer = 'N/A';
        row.projektstandort = 'N/A';
      }

      row = {
        projektnummer: row.projektnummer,
        projektstandort: row.projektstandort,
        Ort: row.Ort,
        Projektleiter: row.Projektleiter,
        Beschreibung: row.Beschreibung,
      };

      dataRows.push(row);
    })
    .on('end', () => {
      csvWriter
        .writeRecords(dataRows)
        .then(() =>
          console.log('Die CSV-Datei wurde erfolgreich geschrieben.')
        );
    });
});
