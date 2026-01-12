
const xlsx = require('xlsx');

// Note: The user confirmed the file name is 'Weekly Inventory UPDATE PURI 1-4 Jan.xlsx'
const excelFilePath = './Weekly Inventory UPDATE PURI 1-4 Jan.xlsx';

try {
  // Read the workbook
  const workbook = xlsx.readFile(excelFilePath);

  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No sheets found in the Excel file.');
  }

  // Get the worksheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert sheet to JSON
  // The header option will use the first row as keys.
  // The defval will ensure empty cells are represented as null or an empty string.
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Output the JSON to the console for the assistant to read
  console.log(JSON.stringify(jsonData, null, 2));

} catch (error) {
  console.error('Error parsing Excel file:', error.message);
  process.exit(1);
}
