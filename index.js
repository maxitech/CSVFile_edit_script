const fs = require('fs');
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

const inputFilePath = './input/report.csv';
const outputFilePath = './output/result.csv';

let csvWriter;
let dataRows = [];

fs.createReadStream(inputFilePath)
  .pipe(iconv.decodeStream('utf16le')) // Dekodieren von UTF-16LE zu UTF-8
  .pipe(csv({ separator: '\t' })) // Stellen Sie sicher, dass der Separator korrekt eingestellt ist, falls notwendig
  .on('headers', (headers) => {
    const newHeaders = headers
      .map((header) => {
        if (header === 'Projekt') {
          return [
            { id: 'projektnummer', title: 'Projektnummer' },
            { id: 'projektstandort', title: 'Projektstandort' },
          ];
        } else {
          return { id: header, title: header };
        }
      })
      .flat();

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

    dataRows.push(row);
  })
  .on('end', () => {
    csvWriter
      .writeRecords(dataRows)
      .then(() => console.log('Die CSV-Datei wurde erfolgreich geschrieben.'));
  });
