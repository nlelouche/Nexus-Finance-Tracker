/**
 * Utility for handling file downloads and data validation for the Export/Import engine.
 */

export const downloadJSON = (data: any, fileName: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateBackupSchema = (data: any): boolean => {
  // Basic validation to ensure the JSON has the expected root properties
  const requiredKeys = [
    'transactions', 'investments', 'goals', 'recurringExpenses', 
    'targetAllocations', 'baseCurrency', 'exchangeRates', 
    'allocationTargets', 'aiConfig', 'dashboardWidgets', 'investmentWidgets'
  ];
  return requiredKeys.every(key => Object.prototype.hasOwnProperty.call(data, key));
};

export const readFileAsJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch (err) {
        reject(new Error('Invalid JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsText(file);
  });
};
