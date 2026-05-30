import { Payroll } from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusChip(status: string) {
  const map: Record<string, [string, string]> = {
    PAID:      ['#D1FAE5', '#065F46'],
    FINALIZED: ['#DBEAFE', '#1E40AF'],
    DRAFT:     ['#F3F4F6', '#374151'],
  };
  const [bg, color] = map[status] ?? map.DRAFT;
  return `<span style="background:${bg};color:${color};padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.4px">${status}</span>`;
}

export function openPayslip(payroll: Payroll) {
  const emp  = payroll.employee;
  const mon  = MONTHS[payroll.month - 1];
  const earn = payroll.items.filter(i => i.type === 'EARNING');
  const ded  = payroll.items.filter(i => i.type === 'DEDUCTION');

  const earnRows = earn.map(e => `
    <tr>
      <td style="padding:10px 20px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151">${e.label}</td>
      <td style="padding:10px 20px;border-bottom:1px solid #F3F4F6;text-align:right;font-size:13px;font-weight:600;color:#059669">${fmt(e.amount)}</td>
    </tr>`).join('');

  const dedRows = ded.map(d => `
    <tr>
      <td style="padding:10px 20px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151">${d.label}</td>
      <td style="padding:10px 20px;border-bottom:1px solid #F3F4F6;text-align:right;font-size:13px;font-weight:600;color:#DC2626">&#x2212;${fmt(d.amount)}</td>
    </tr>`).join('');

  const adjBlock = payroll.manualAdjustment !== 0 ? `
    <div style="padding:12px 24px;background:#FFFBEB;border-top:1px solid #FDE68A;font-size:13px;color:#92400E">
      <b>Manual Adjustment:</b> ${payroll.manualAdjustment > 0 ? '+' : ''}${fmt(payroll.manualAdjustment)}
      ${payroll.adjustmentRemark ? ` &mdash; ${payroll.adjustmentRemark}` : ''}
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Payslip &mdash; ${emp.firstName} ${emp.lastName} &mdash; ${mon} ${payroll.year}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#F3F4F6;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wrap{max-width:700px;margin:28px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.10)}
  table{width:100%;border-collapse:collapse}
  .hdr{background:linear-gradient(135deg,#0066FF 0%,#0047CC 100%);padding:28px 28px 24px}
  .hdr-row{display:flex;justify-content:space-between;align-items:flex-start}
  .brand{display:flex;align-items:center;gap:13px}
  .brand-icon{width:44px;height:44px;background:rgba(255,255,255,.18);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0}
  .brand-name{font-size:19px;font-weight:700;color:#fff;line-height:1.2}
  .brand-sub{font-size:11px;color:rgba(255,255,255,.65);margin-top:2px}
  .title-block{text-align:right}
  .title-block h1{font-size:22px;font-weight:700;color:#fff;letter-spacing:1.5px}
  .title-period{font-size:13px;color:rgba(255,255,255,.75);margin-top:5px}
  .title-status{margin-top:8px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr}
  .info-box{padding:22px 24px;border-bottom:1px solid #E5E7EB}
  .info-box+.info-box{border-left:1px solid #E5E7EB}
  .box-label{font-size:10px;font-weight:700;color:#0066FF;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
  .emp-name{font-size:16px;font-weight:700;color:#111827;margin-bottom:7px}
  .meta-row{display:flex;justify-content:space-between;font-size:12.5px;color:#6B7280;margin-bottom:3px}
  .meta-row b{color:#374151;font-weight:600}
  .two-col{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #E5E7EB}
  .col-head{font-size:10.5px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.8px;padding:14px 20px 10px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #E5E7EB}
  .col-head .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .two-col>div:first-child{border-right:1px solid #E5E7EB}
  .no-items{padding:14px 20px;font-size:13px;color:#9CA3AF;font-style:italic}
  .summary{background:linear-gradient(135deg,#111827 0%,#1F2937 100%);display:flex;justify-content:space-around;align-items:center;padding:22px 28px;gap:0}
  .sum-item{text-align:center;flex:1}
  .sum-label{font-size:10px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}
  .sum-val{font-size:15px;font-weight:700;color:#fff}
  .sum-val.gross{}
  .sum-val.ded{color:#F87171}
  .sum-val.net{font-size:20px;color:#34D399}
  .sum-div{width:1px;height:42px;background:rgba(255,255,255,.1);flex-shrink:0}
  .print-btn{display:block;width:calc(100% - 48px);margin:20px 24px 0;padding:13px;background:#0066FF;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.2px}
  .print-btn:hover{background:#0052CC}
  .footer{padding:18px 24px 22px;text-align:center;font-size:11px;color:#9CA3AF;line-height:1.6;border-top:1px solid #E5E7EB;margin-top:20px}
  @media print{
    body{background:#fff}
    .wrap{margin:0;box-shadow:none;border-radius:0;max-width:100%}
    .print-btn{display:none}
    @page{margin:10mm}
  }
</style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-row">
      <div class="brand">
        <div class="brand-icon">W</div>
        <div>
          <div class="brand-name">WorkTrack</div>
          <div class="brand-sub">Attendance &amp; Payroll Management</div>
        </div>
      </div>
      <div class="title-block">
        <h1>PAY SLIP</h1>
        <div class="title-period">${mon} ${payroll.year}</div>
        <div class="title-status">${statusChip(payroll.status)}</div>
      </div>
    </div>
  </div>

  <!-- Employee + Period -->
  <div class="info-grid">
    <div class="info-box">
      <div class="box-label">Employee</div>
      <div class="emp-name">${emp.firstName} ${emp.lastName}</div>
      <div class="meta-row"><span>Employee Code</span><b>${emp.employeeCode}</b></div>
      <div class="meta-row"><span>Designation</span><b>${emp.designation}</b></div>
    </div>
    <div class="info-box">
      <div class="box-label">Pay Period</div>
      <div class="emp-name">${mon} ${payroll.year}</div>
      <div class="meta-row"><span>Working Days</span><b>${payroll.totalWorkingDays}</b></div>
      <div class="meta-row"><span>Present Days</span><b>${payroll.presentDays}</b></div>
      <div class="meta-row"><span>Absent Days</span><b>${payroll.absentDays}</b></div>
      ${payroll.halfDays > 0 ? `<div class="meta-row"><span>Half Days</span><b>${payroll.halfDays}</b></div>` : ''}
      ${payroll.paidHolidays > 0 ? `<div class="meta-row"><span>Paid Holidays</span><b>${payroll.paidHolidays}</b></div>` : ''}
    </div>
  </div>

  <!-- Earnings / Deductions -->
  <div class="two-col">
    <div>
      <div class="col-head"><span class="dot" style="background:#059669"></span> Earnings</div>
      <table>${earnRows || `<tr><td class="no-items">No earnings</td></tr>`}</table>
    </div>
    <div>
      <div class="col-head"><span class="dot" style="background:#DC2626"></span> Deductions</div>
      <table>${dedRows || `<tr><td class="no-items">No deductions</td></tr>`}</table>
    </div>
  </div>

  ${adjBlock}

  <!-- Summary bar -->
  <div class="summary">
    <div class="sum-item">
      <div class="sum-label">Gross Salary</div>
      <div class="sum-val gross">${fmt(payroll.grossSalary)}</div>
    </div>
    <div class="sum-div"></div>
    <div class="sum-item">
      <div class="sum-label">Total Deductions</div>
      <div class="sum-val ded">${payroll.totalDeductions > 0 ? `&#x2212;${fmt(payroll.totalDeductions)}` : '&mdash;'}</div>
    </div>
    <div class="sum-div"></div>
    <div class="sum-item">
      <div class="sum-label">Net Salary</div>
      <div class="sum-val net">${fmt(payroll.netSalary)}</div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">&#x2193;&nbsp; Save as PDF / Print</button>

  <div class="footer">
    This is a computer-generated payslip and does not require a signature.<br/>
    Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
  </div>

</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer,width=760,height=900');
  if (!win) {
    alert('Please allow pop-ups for this site to view payslips.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
