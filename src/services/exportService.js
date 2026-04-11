import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Universal Export Service
 * Supports PDF, Excel, and Word (HTML-compatible)
 */
export const exportService = {
  /**
   * Export to PDF
   * @param {string} title - Report title
   * @param {Array} columns - [{ header: 'Name', dataKey: 'name' }]
   * @param {Array} data - Array of objects
   * @param {string} fileName - Output filename
   */
  exportToPDF: (title, columns, data, fileName = 'report.pdf') => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, 14, 22);
    
    // Meta info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 30);
    doc.text('Sistema Municipal de Albercas', 14, 35);
    
    // Table
    doc.autoTable({
      columns: columns,
      body: data,
      startY: 45,
      theme: 'grid',
      headStyles: { fillStyle: '#6366f1', textColor: 255 },
      alternateRowStyles: { fillColor: '#f8fafc' },
      margin: { top: 45 },
    });
    
    doc.save(fileName);
  },

  /**
   * Export to Excel (XLSX)
   * @param {Array} data - Array of objects
   * @param {string} fileName - Output filename
   */
  exportToExcel: (data, fileName = 'report.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    
    // Auto-size columns (rough approximation)
    const maxWidths = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = String(row[key]);
        maxWidths[key] = Math.max(maxWidths[key] || 10, val.length + 2);
      });
    });
    worksheet['!cols'] = Object.keys(maxWidths).map(k => ({ wch: maxWidths[k] }));

    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export to Word (via HTML Blob)
   * @param {string} title - Report title
   * @param {Array} columns - Column headers
   * @param {Array} data - Array of objects (values only)
   * @param {string} fileName - Output filename
   */
  exportToWord: (title, columns, data, fileName = 'report.doc') => {
    // We wrap the table in standard Microsoft Office XML/HTML headers
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: 'Calibri', sans-serif; }
        table { border-collapse: collapse; width: 100%; border: 1px solid #ddd; }
        th { background-color: #6366f1; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
        td { padding: 10px; border: 1px solid #ddd; }
        h1 { color: #1e293b; }
      </style>
      </head><body>
    `;
    const footer = "</body></html>";
    
    let tableHtml = `<h1>${title}</h1>`;
    tableHtml += `<p>Fecha: ${new Date().toLocaleString('es-MX')}</p><br/>`;
    tableHtml += "<table><thead><tr>";
    
    columns.forEach(col => {
      tableHtml += `<th>${col}</th>`;
    });
    
    tableHtml += "</tr></thead><tbody>";
    
    data.forEach(row => {
      tableHtml += "<tr>";
      row.forEach(cell => {
        tableHtml += `<td>${cell || ''}</td>`;
      });
      tableHtml += "</tr>";
    });
    
    tableHtml += "</tbody></table>";
    
    const fullHtml = header + tableHtml + footer;
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
};
