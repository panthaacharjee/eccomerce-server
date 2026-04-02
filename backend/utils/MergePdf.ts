import PDFMerger from 'pdf-merger-js';

async function mergePdfs(pdfBuffers: Buffer[]) {
  const merger = new PDFMerger();
  
  for (const pdfBuffer of pdfBuffers) {
    await merger.add(pdfBuffer);
  }
  
  return await merger.saveAsBuffer();
}

export default mergePdfs