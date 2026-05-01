// Default beige/typewriter invoice template
// Variables: {{STORE_NAME}} {{STORE_CITY}} {{STORE_PHONE}} {{STORE_INSTAGRAM}}
//            {{STORE_LOGO_HTML}} {{CUSTOMER_NAME}} {{CUSTOMER_PHONE}} {{CUSTOMER_CITY}}
//            {{INVOICE_NUMBER}} {{DATE}} {{ITEMS_TABLE_ROWS}}
//            {{SUBTOTAL}} {{DELIVERY}} {{DISCOUNT}} {{DISCOUNT_PCT}} {{TOTAL}}

export const DEFAULT_INVOICE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice #{{INVOICE_NUMBER}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier Prime','Courier New',monospace;background:#ede9df;color:#2a1f0e;min-height:100vh}
    .page{max-width:720px;margin:0 auto;padding:48px 52px;background:#ede9df}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
    .hdr-left .title{font-size:36px;font-weight:700;letter-spacing:2px;line-height:1}
    .hdr-left .subtitle{font-size:13px;font-weight:700;letter-spacing:1px;margin:4px 0 14px}
    .hdr-left p{font-size:12px;line-height:1.9;letter-spacing:0.3px}
    .divider{border:none;border-top:1.5px solid #2a1f0e;margin:20px 0}
    .cust-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
    .cust-label{font-size:13px;font-weight:700;letter-spacing:1px;margin-bottom:8px}
    .cust-field{font-size:12px;line-height:2;letter-spacing:0.3px}
    .cust-right{text-align:right;font-size:12px;line-height:2;letter-spacing:0.3px}
    table{width:100%;border-collapse:collapse;margin-bottom:32px}
    .th{font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 4px;text-align:left;border-bottom:1.5px solid #2a1f0e}
    .th-num{text-align:right}
    .td-item{font-size:12px;padding:10px 4px;border-bottom:1px dashed #9a8c78;letter-spacing:0.3px}
    .td-num{font-size:12px;padding:10px 4px;border-bottom:1px dashed #9a8c78;text-align:right;letter-spacing:0.3px}
    .totals{width:260px;margin-left:auto;font-size:12px;letter-spacing:0.3px}
    .tot-row{display:flex;justify-content:space-between;padding:5px 0;line-height:1.6}
    .tot-label{color:#5a4a38}
    .tot-divider{border:none;border-top:1px solid #9a8c78;margin:6px 0}
    .tot-final{display:flex;justify-content:space-between;padding:7px 0;font-weight:700;font-size:13px;letter-spacing:1px}
    .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:52px}
    .footer-text .ty{font-size:13px;font-weight:700;letter-spacing:2px;margin-bottom:4px}
    .footer-text .ty-ar{font-size:14px;letter-spacing:0.5px;font-family:Arial,sans-serif}
    .footer-qr{text-align:right}
    .footer-qr .follow{font-size:11px;letter-spacing:1px;margin-bottom:6px}
    .print-bar{position:fixed;bottom:24px;right:24px;z-index:99}
    .btn-print{background:#2a1f0e;color:#ede9df;border:none;padding:11px 24px;font-family:'Courier New',monospace;font-size:13px;font-weight:700;letter-spacing:1.5px;cursor:pointer;border-radius:4px}
    .btn-print:hover{background:#3d2e14}
    @media print{.print-bar{display:none}body{background:#ede9df}.page{padding:32px 40px}}
  </style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-left">
      <div class="title">INVOICE</div>
      <div class="subtitle">{{STORE_NAME}}</div>
      <p>{{STORE_CITY}}</p>
      <p>{{STORE_PHONE}}</p>
      <p>{{STORE_INSTAGRAM}}</p>
    </div>
    <div>{{STORE_LOGO_HTML}}</div>
  </div>

  <hr class="divider"/>

  <div class="cust-row">
    <div>
      <div class="cust-label">Customer:</div>
      <div class="cust-field">
        <div>Name: &nbsp;{{CUSTOMER_NAME}}</div>
        <div>Phone: {{CUSTOMER_PHONE}}</div>
        <div>City: &nbsp;{{CUSTOMER_CITY}}</div>
      </div>
    </div>
    <div class="cust-right">
      <div>Invoice #: {{INVOICE_NUMBER}}</div>
      <div>Date: &nbsp;&nbsp;&nbsp;{{DATE}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="th" style="width:55%">PARTICULARS</th>
        <th class="th th-num" style="width:15%">PRICE</th>
        <th class="th th-num" style="width:10%">QTY</th>
        <th class="th th-num" style="width:20%">AMOUNT</th>
      </tr>
    </thead>
    <tbody>{{ITEMS_TABLE_ROWS}}</tbody>
  </table>

  <div class="totals">
    <div class="tot-row"><span class="tot-label">التوصيل</span><span>{{DELIVERY}}</span></div>
    <div class="tot-row"><span class="tot-label">SUBTOTAL</span><span>{{SUBTOTAL}}</span></div>
    <div class="tot-row"><span class="tot-label">{{DISCOUNT_PCT}}% DISCOUNT</span><span>-{{DISCOUNT}}</span></div>
    <hr class="tot-divider"/>
    <div class="tot-final"><span>TOTAL</span><span>{{TOTAL}}</span></div>
  </div>

  <div class="footer">
    <div class="footer-text">
      <div class="ty">THANK YOU FOR YOUR ORDER.</div>
      <div class="ty-ar">شكرًا لقيامكم بالتسوق معنا.</div>
    </div>
    <div class="footer-qr">
      <div class="follow">Follow us</div>
      {{QR_CODE_HTML}}
    </div>
  </div>
</div>
<div class="print-bar">
  <button class="btn-print" onclick="window.print()">PRINT</button>
</div>
</body>
</html>`;

export function applyInvoiceVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => vars[key] ?? "");
}
