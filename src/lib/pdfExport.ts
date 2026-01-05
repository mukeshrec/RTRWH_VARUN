import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationResults } from './calculations';
import { CostBreakdown, EconomicAnalysis } from './costEstimation';

interface ProjectInput {
  userName: string;
  locationName: string;
  roofArea: number;
  roofType: string;
  householdSize: number;
}

export function generatePDFReport(
  results: CalculationResults,
  costBreakdown: CostBreakdown,
  economicAnalysis: EconomicAnalysis,
  projectInput: ProjectInput
) {
  const doc = new jsPDF();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RTRWH Assessment Report', 105, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${projectInput.userName} • ${projectInput.locationName}`, 105, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const feasibilityText = results.isFeasible ? 'Project is FEASIBLE' : 'Partially Feasible';
  if (results.isFeasible) {
    doc.setTextColor(0, 128, 0);
  } else {
    doc.setTextColor(184, 134, 11);
  }
  doc.text(feasibilityText, 20, yPosition);
  doc.setTextColor(0, 0, 0);

  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Water Available', `${results.waterAvailable.toLocaleString()} L`],
      ['Water Required', `${results.waterRequired.toLocaleString()} L`],
      ['Coverage', `${((results.waterAvailable / results.waterRequired) * 100).toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Storage Tank Design', 20, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Parameter', 'Value']],
    body: [
      ['Tank Capacity', `${results.tankCapacity.toLocaleString()} L`],
      ['Tank Diameter', `${results.tankDiameter.toFixed(2)} m`],
      ['Tank Height', `${results.tankHeight.toFixed(2)} m`],
      ['Tank Type', results.tankCapacity <= 15000 ? 'Ferro-cement' : results.tankCapacity <= 50000 ? 'Masonry' : 'RCC'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Collection System', 20, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Parameter', 'Value']],
    body: [
      ['Peak Flow', `${results.peakFlow.toFixed(2)} lps`],
      ['Gutter Diameter', `${results.gutterDiameter} mm`],
      ['Downpipe Diameter', `${results.downpipeDiameter} mm`],
      ['First Flush Volume', `${results.firstFlushVolume.toFixed(1)} L`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Filter Specifications', 20, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Parameter', 'Value']],
    body: [
      ['Filter Type', results.filterType],
      ['Filter Area', `${results.filterArea.toFixed(2)} m²`],
      ['Filter Dimensions', `${results.filterLength.toFixed(1)} m × ${results.filterWidth.toFixed(1)} m`],
      ['Filtration Rate', `${results.filterType === 'Slow Sand' ? '100-200' : '3000-6000'} L/hr/m²`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recharge Structure', 20, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Parameter', 'Value']],
    body: [
      ['Structure Type', results.rechargeStructureType],
      ['Depth', `${results.rechargeStructureDepth.toFixed(1)} m`],
      ['Diameter', `${results.rechargeStructureDiameter.toFixed(2)} m`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Analysis', 20, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Cost (₹)']],
    body: [
      ['Storage Tank', costBreakdown.tankCost.toLocaleString()],
      ['Piping System', costBreakdown.pipingCost.toLocaleString()],
      ['Filter Unit', costBreakdown.filterCost.toLocaleString()],
      ['Recharge Structure', costBreakdown.rechargeStructureCost.toLocaleString()],
      ['Civil Works', costBreakdown.civilWorksCost.toLocaleString()],
      ['Labor', costBreakdown.laborCost.toLocaleString()],
      ['Total Investment', `₹${costBreakdown.totalCost.toLocaleString()}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Viability', 20, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: [
      ['Annual Benefits', `₹${economicAnalysis.totalAnnualBenefits.toLocaleString()}`],
      ['B/C Ratio', economicAnalysis.bcRatio.toFixed(2)],
      ['Payback Period', `${economicAnalysis.paybackPeriod.toFixed(1)} years`],
      ['Payback with 50% Subsidy', `${economicAnalysis.paybackPeriodWithSubsidy.toFixed(1)} years`],
      ['Annual Water Savings', `₹${economicAnalysis.annualWaterSavings.toLocaleString()}`],
      ['Annual Maintenance', `₹${economicAnalysis.annualMaintenanceCost.toLocaleString()}`],
      ['NPV (20 years)', `₹${economicAnalysis.netPresentValue.toLocaleString()}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
  });

  if (results.warnings.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(184, 134, 11);
    doc.text('Warnings & Considerations', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    results.warnings.forEach((warning) => {
      const lines = doc.splitTextToSize(`• ${warning}`, 170);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });
    });
  }

  if (results.recommendations.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 10;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Recommendations', 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    results.recommendations.forEach((recommendation) => {
      const lines = doc.splitTextToSize(`• ${recommendation}`, 170);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });
    });
  }

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Next Steps', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Review Design', 20, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Download detailed technical report with drawings and BOQ', 25, yPosition);

  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('2. Seek Approvals', 20, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Apply for necessary permissions and explore subsidy schemes', 25, yPosition);

  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('3. Implementation', 20, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Hire qualified contractors and begin construction', 25, yPosition);

  const fileName = `RTRWH_Assessment_Report_${projectInput.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
