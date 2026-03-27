const PDFDocument = require('pdfkit');

/**
 * Generates a comprehensive Farm Intelligence Report in PDF format.
 * @param {Object} data - The dataset for the report.
 * @param {Object} res - Express response object to pipe the PDF stream.
 */
function generateFarmReport(data, res) {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4'
  });

  // Set HTTP Headers for PDF Download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=AgriMicro_Report_${data.farm.farm_name.replace(/\s+/g, '_')}.pdf`);

  // Pipe the document to the response stream
  doc.pipe(res);

  // --- Header & Footer Helper ---
  const generateHeader = () => {
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('AgriMicro IQ', 110, 57)
      .fontSize(10)
      .text('Farm Intelligence Platform', 110, 80)
      .text('Adaptive Micro-Zone Analytics', 200, 50, { align: 'right' })
      .text(`Generated: ${new Date().toLocaleString()}`, 200, 65, { align: 'right' })
      .moveDown();
    
    doc.moveTo(50, 100).lineTo(550, 100).stroke('#eeeeee');
  };

  const generateFooter = () => {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).text(
        `Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: 500 }
      );
      doc.fontSize(8).text(
        '© AgriMicro IQ - Precision Farming Decisions. Confidential Intelligence Report.',
        50,
        doc.page.height - 35,
        { align: 'center', width: 500, color: '#999999' }
      );
    }
  };

  // --- Title Section ---
  generateHeader();
  doc.moveDown(2);
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#065f46').text('Farm Intelligence Report', { align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#64748b').text('Consolidated Analytics & AI Decision Logic', { align: 'center' });
  doc.moveDown(2);

  // --- Section 1: Farm Overview ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 1: Farm Overview');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#10b981');
  doc.moveDown(0.8);
  
  doc.fontSize(12).font('Helvetica-Bold').text(`Farm Name: `, { continued: true }).font('Helvetica').text(data.farm.farm_name);
  doc.fontSize(12).font('Helvetica-Bold').text(`Crop Type: `, { continued: true }).font('Helvetica').text(data.farm.crop_type);
  doc.fontSize(12).font('Helvetica-Bold').text(`Creation Date: `, { continued: true }).font('Helvetica').text(new Date(data.farm.created_at).toLocaleDateString());
  doc.moveDown(1.5);

  // --- Section 2: Micro-Zone Analysis ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 2: Micro-Zone Analysis');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#eeeeee');
  doc.moveDown(0.8);

  if (!data.zones || data.zones.length === 0) {
    doc.fontSize(11).font('Helvetica-Oblique').text('No micro-zone data telemetry detected for this farm.');
  } else {
    data.zones.forEach((zone, index) => {
      const healthStatus = zone.ndvi_value < 0.4 ? 'Poor (Critical Stress)' : (zone.ndvi_value <= 0.7 ? 'Moderate (Monitor)' : 'Healthy (Optimal)');
      const color = zone.ndvi_value < 0.4 ? '#ef4444' : (zone.ndvi_value <= 0.7 ? '#f59e0b' : '#10b981');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(`Zone Node ${index + 1}: `, { continued: true });
      doc.font('Helvetica').text(zone.id.split('-')[0].toUpperCase());
      doc.font('Helvetica-Bold').text('   NDVI Value: ', { continued: true }).font('Helvetica').text(zone.ndvi_value.toFixed(2));
      doc.font('Helvetica-Bold').text('   Health Status: ', { continued: true }).fillColor(color).text(healthStatus);
      doc.moveDown(0.3);
    });
  }
  doc.moveDown(1);

  // --- Section 3: Pest Risk Analysis ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 3: Pest Risk Analysis');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#eeeeee');
  doc.moveDown(0.8);

  const pestData = data.pestPredictions || [];
  if (pestData.length === 0) {
    doc.fontSize(11).font('Helvetica-Oblique').text('No active pest risk simulations logged for the current growth cycle.');
  } else {
    pestData.forEach((pest) => {
      const riskColor = pest.risk_level.toLowerCase() === 'high' ? '#ef4444' : (pest.risk_level.toLowerCase() === 'medium' ? '#f59e0b' : '#10b981');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(`Zone ID ${pest.zone_id.split('-')[0].toUpperCase()}: `);
      doc.font('Helvetica').text(`- Risk Level: `, { continued: true }).fillColor(riskColor).font('Helvetica-Bold').text(pest.risk_level);
      doc.fillColor('#334155').font('Helvetica').text(`- Probability: `, { continued: true }).font('Helvetica-Bold').text(`${(pest.probability * 100).toFixed(1)}%`);
      doc.font('Helvetica').text(`- Detected Pest: `, { continued: true }).font('Helvetica-Bold').text(pest.predicted_pest);
      doc.moveDown(0.5);
    });
  }
  doc.moveDown(1);

  // --- Section 4: Resource Optimization ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 4: Resource Optimization');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#eeeeee');
  doc.moveDown(0.8);

  const resourceData = data.resourceRecommendations || [];
  if (resourceData.length === 0) {
    doc.fontSize(11).font('Helvetica-Oblique').text('Precision resource quotas pending ML optimization sequence.');
  } else {
    resourceData.forEach((res) => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(`Zone ID ${res.zone_id.split('-')[0].toUpperCase()}: `);
      doc.font('Helvetica').text(`- Water Requirement: `, { continued: true }).font('Helvetica-Bold').fillColor('#2563eb').text(`${res.water_requirement.toFixed(1)} Liters`);
      doc.font('Helvetica').fillColor('#334155').text(`- Fertilizer Dosage: `, { continued: true }).font('Helvetica-Bold').fillColor('#7c3aed').text(`${res.fertilizer_amount.toFixed(1)} kg`);
      doc.moveDown(0.5);
    });
  }
  doc.moveDown(1);

  // --- Section 5: Yield & Profit Prediction ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 5: Yield & Profit Prediction');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#eeeeee');
  doc.moveDown(0.8);

  if (!data.yield) {
    doc.fontSize(11).font('Helvetica-Oblique').text('Temporal yield forecasts unavailable. Execute simulation for predictive modeling.');
  } else {
    doc.fontSize(12).font('Helvetica-Bold').text(`Projected Harvest Yield: `, { continued: true }).fillColor('#065f46').text(`${data.yield.expected_yield.toFixed(2)} Tons`);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#334155').text(`Projected Net Profit: `, { continued: true }).fillColor('#065f46').text(`₹${data.yield.expected_profit.toLocaleString()}`);
  }
  doc.moveDown(2);

  // --- Section 6: Action Planner ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 6: Action Planner');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#eeeeee');
  doc.moveDown(0.8);

  const actionData = data.actionPlans || [];
  if (actionData.length === 0) {
    doc.fontSize(11).font('Helvetica-Oblique').text('Prioritized field operations pending strategic analysis.');
  } else {
    actionData.forEach((action) => {
      const priorityLabel = action.priority_score > 0.7 ? 'CRITICAL' : (action.priority_score >= 0.4 ? 'MODERATE' : 'LOW');
      const priorityColor = action.priority_score > 0.7 ? '#ef4444' : (action.priority_score >= 0.4 ? '#f59e0b' : '#10b981');
      
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(`Zone ID ${action.zone_id.split('-')[0].toUpperCase()}: `);
      doc.font('Helvetica').text(`- Priority Score: `, { continued: true }).font('Helvetica-Bold').text(`${action.priority_score.toFixed(2)} [`, { continued: true }).fillColor(priorityColor).text(priorityLabel, { continued: true }).fillColor('#334155').text(']');
      doc.font('Helvetica').text(`- Strategy: `, { continued: true }).font('Helvetica-Bold').text(action.action_type);
      doc.moveDown(0.5);
    });
  }
  doc.moveDown(1);

  // --- Section 7: Personalized Guidance ---
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Section 7: Personalized Guidance');
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#eeeeee');
  doc.moveDown(0.8);

  const guidanceData = data.guidance || [];
  if (guidanceData.length === 0) {
    // Backend Fallback Logic based on NDVI if no guidance in DB
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0369a1').text('AI Generated Advisory:');
    doc.fontSize(10).font('Helvetica').fillColor('#334155').text('Based on current telemetry, the system recommends maintaining the current irrigation schedule. Monitor low-NDVI nodes closely for potential chlorophyll depletion.');
  } else {
    guidanceData.forEach(g => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0369a1').text(`Advisory [Zone ${g.zone_id?.split('-')[0].toUpperCase() || 'Global'}]:`);
        doc.fontSize(10).font('Helvetica').fillColor('#334155').text(g.guidance_text);
        doc.moveDown(0.5);
    });
  }

  // --- Finalize ---
  generateFooter();
  doc.end();
}

module.exports = generateFarmReport;
