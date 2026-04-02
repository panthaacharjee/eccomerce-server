const puppeteer = require('puppeteer');

const generatePDFFromUrl = async(options:any)=> {

   const {
    html,
    outputPath,
    format = 'A4',
  } = options;
  // console.log(options)
   const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // '--single-process'
    ],
    timeout: 30000
  });
  try{
    const page = await browser.newPage();
   

    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0', 'domcontentloaded'],
      timeout: 60000
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    await Promise.all([
      page.evaluateHandle('document.fonts.ready'),
      page.waitForNetworkIdle({ idleTime: 1000 }) // Additional network idle wait
    ]);

    const pdfOptions = {
      path: outputPath,
      format,
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true
    };

    return await page.pdf(pdfOptions);
  }finally{
    await browser.close();
  }
}
export default generatePDFFromUrl


