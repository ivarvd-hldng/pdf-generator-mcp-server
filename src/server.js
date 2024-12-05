const PDFDocument = require('pdfkit');
const { MCPServer } = require('@anthropic-ai/mcp');

class PDFGeneratorServer extends MCPServer {
  constructor() {
    super();
    this.registerFunction('generatePDF', this.generatePDF.bind(this));
    this.registerFunction('generatePDFFromHTML', this.generatePDFFromHTML.bind(this));
  }

  async generatePDF({ content, title, author }) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument();
        let buffers = [];

        // Collect PDF data chunks
        doc.on('data', buffer => buffers.push(buffer));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve({
            data: pdfData.toString('base64'),
            contentType: 'application/pdf'
          });
        });

        // Add metadata
        doc.info['Title'] = title;
        doc.info['Author'] = author;

        // Add content
        doc.fontSize(25).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(content);

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generatePDFFromHTML({ html, options = {} }) {
    const puppeteer = require('puppeteer');
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(html);

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        printBackground: true,
        ...options
      });

      await browser.close();

      return {
        data: pdfBuffer.toString('base64'),
        contentType: 'application/pdf'
      };
    } catch (error) {
      throw error;
    }
  }
}

// Start the server
const server = new PDFGeneratorServer();
server.start();