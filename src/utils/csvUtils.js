// utils/csvUtils.js
// utils/csvUtils.js
import Papa from 'papaparse';

export const parseCSV = (file, callback) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      callback(results.data);
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    }
  });
};


export const convertToCSV = (questions) => {
    const header = ['id', 'kategoria', 'zestaw', 'rating', 'answer']; // Adjust based on your data fields
    const rows = questions.map((q) => [
      q.id,
      q.kategoria,
      q.zestaw,
      q.rating,
      q.answer,
    ]);
  
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    return csvContent;
  };
  