// pages/api/export/pdf.js
import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, shop, components, buildData, timestamp } = req.body;
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="build-sheet-${customer.name || 'customer'}.pdf"`);
      res.send(pdfBuffer);
    });

    // ---- HEADER ----
    doc.rect(0, 0, 612, 80).fill('#2563eb');
    doc.font('Helvetica-Bold').fontSize(22).fillColor('white').text('CrankSmith Pro Build Sheet', 50, 30);
    doc.moveDown(2).fillColor('#111111');
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#111').text(`Generated: ${new Date(timestamp).toLocaleString()}`, 50, 90);

    // ---- SHOP & CUSTOMER INFO ----
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('SHOP INFORMATION:');
    doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.font('Helvetica').fontSize(10).fillColor('#111').text(`${shop.name}\n${shop.address}\n${shop.phone} • ${shop.email}`, { indent: 8 });
    doc.moveDown(0.7).font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('CUSTOMER INFORMATION:');
    doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.font('Helvetica').fontSize(10).fillColor('#111').text(`Name: ${customer.name || 'N/A'}\nEmail: ${customer.email || 'N/A'}\nPhone: ${customer.phone || 'N/A'}\nBike: ${customer.bikeModel || 'N/A'}`, { indent: 8 });

    // ---- COMPONENT SPEC ----
    doc.moveDown(0.7).font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('COMPONENT SPECIFICATION:');
    doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.font('Helvetica').fontSize(10).fillColor('#111').text(
      `Crankset: ${components.crankset.model} ${components.crankset.variant}\nCassette: ${components.cassette.model} ${components.cassette.variant}\nDerailleur: ${components.derailleur.model} ${components.derailleur.variant}`,
      { indent: 8 }
    );

    // ---- BUILD SUMMARY ----
    doc.moveDown(0.7).font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('BUILD SUMMARY:');
    doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.font('Helvetica').fontSize(10).fillColor('#111').text(
      `Total Weight: ${buildData.totalWeight}g\nGear Range: ${buildData.gearRange}\nChain Length: ${buildData.chainLength} links\nLabor Estimate: ${buildData.laborTime}`,
      { indent: 8 }
    );

    // ---- PARTS LIST TABLE ----
    if (buildData.partsList && buildData.partsList.length > 0) {
      drawPartsTable(doc, buildData.partsList);
    }

    // ---- INSTALLATION STEPS ----
    if (buildData.installationSteps && buildData.installationSteps.length > 0) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('INSTALLATION STEPS:');
      doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.font('Helvetica').fontSize(10).fillColor('#111');
      
      buildData.installationSteps.forEach((step, i) => {
        doc.font('Helvetica-Bold').text(`${i + 1}. ${step.title}`);
        doc.font('Helvetica').text(`   ${step.description}`);
        if (step.torque) doc.fillColor('#f59e0b').text(`   Torque: ${step.torque}`);
        if (step.specialTools) doc.fillColor('#2563eb').text(`   Tools: ${step.specialTools}`);
        doc.moveDown(0.6).fillColor('#111');
      });
    }

    // ---- WARNINGS ----
    if (buildData.warnings && buildData.warnings.length > 0) {
      doc.moveDown().font('Helvetica-Bold').fontSize(13).fillColor('#ef4444').text('WARNINGS:');
      doc.font('Helvetica').fontSize(10).fillColor('#ef4444');
      buildData.warnings.forEach(w => doc.text(`• ${w}`));
      doc.fillColor('#111');
    }

    // ---- COMPATIBILITY ANALYSIS ----
    if (buildData.compatibility) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('COMPATIBILITY ANALYSIS:');
      doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.font('Helvetica').fontSize(10).fillColor('#111');
      
      // Overall status
      const statusColor = buildData.compatibility.overallCompatibility === 'compatible' ? '#10b981' : '#ef4444';
      doc.fillColor(statusColor).text(
        `Overall Status: ${buildData.compatibility.overallCompatibility.toUpperCase()}`,
        { indent: 8 }
      );
      
      // Setup difficulty
      doc.fillColor('#111').text(
        `Setup Difficulty: ${buildData.compatibility.setupDifficulty.level} (${buildData.compatibility.setupDifficulty.estimatedTime})`,
        { indent: 8 }
      );
      
      doc.moveDown();
    }

    // ---- FOOTER ----
    doc.moveDown(2).font('Helvetica-Oblique').fontSize(10).fillColor('#111')
      .text('Generated by CrankSmith Pro – Professional Drivetrain Analysis', 50);
    
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
}

// Helper function for parts table
function drawPartsTable(doc, partsList) {
  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#2563eb').text('PARTS LIST:');
  doc.moveDown(0.2).strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
  const left = 60;
  let y = doc.y + 10;
  const colWidths = [140, 80, 40, 60, 130];
  const rowHeight = 20;
  const headerBg = '#e5e7eb';
  
  // Header
  doc.rect(left, y, colWidths.reduce((a, b) => a + b), rowHeight).fill(headerBg);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#2563eb');
  doc.text('Component', left + 4, y + 5, { width: colWidths[0] - 8 });
  doc.text('Part #', left + colWidths[0] + 4, y + 5, { width: colWidths[1] - 8 });
  doc.text('Qty', left + colWidths[0] + colWidths[1] + 4, y + 5, { width: colWidths[2] - 8 });
  doc.text('Weight', left + colWidths[0] + colWidths[1] + colWidths[2] + 4, y + 5, { width: colWidths[3] - 8 });
  doc.text('Notes', left + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 4, y + 5, { width: colWidths[4] - 8 });
  
  y += rowHeight;
  
  // Rows
  doc.font('Helvetica').fontSize(9).fillColor('#111');
  partsList.forEach((part, i) => {
    // Check if we need a new page
    if (y > 700) {
      doc.addPage();
      y = 50;
      // Redraw header
      doc.rect(left, y, colWidths.reduce((a, b) => a + b), rowHeight).fill(headerBg);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#2563eb');
      doc.text('Component', left + 4, y + 5, { width: colWidths[0] - 8 });
      doc.text('Part #', left + colWidths[0] + 4, y + 5, { width: colWidths[1] - 8 });
      doc.text('Qty', left + colWidths[0] + colWidths[1] + 4, y + 5, { width: colWidths[2] - 8 });
      doc.text('Weight', left + colWidths[0] + colWidths[1] + colWidths[2] + 4, y + 5, { width: colWidths[3] - 8 });
      doc.text('Notes', left + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 4, y + 5, { width: colWidths[4] - 8 });
      y += rowHeight;
      doc.font('Helvetica').fontSize(9).fillColor('#111');
    }
    
    // Alternate row background
    if (i % 2 === 1) {
      doc.rect(left, y, colWidths.reduce((a, b) => a + b), rowHeight).fill('#f9fafb');
    }
    
    doc.fillColor('#111');
    doc.text(part.name || '', left + 4, y + 5, { width: colWidths[0] - 8, ellipsis: true });
    doc.text(part.partNumber || '', left + colWidths[0] + 4, y + 5, { width: colWidths[1] - 8, ellipsis: true });
    doc.text(part.quantity || '', left + colWidths[0] + colWidths[1] + 4, y + 5, { width: colWidths[2] - 8, ellipsis: true });
    doc.text(part.weight || '', left + colWidths[0] + colWidths[1] + colWidths[2] + 4, y + 5, { width: colWidths[3] - 8, ellipsis: true });
    doc.text(part.notes || '', left + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 4, y + 5, { width: colWidths[4] - 8, ellipsis: true });
    
    y += rowHeight;
  });
}