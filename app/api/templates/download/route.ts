import { NextRequest, NextResponse } from 'next/server';

// Template configurations matching the client-side component
const TEMPLATE_CONFIGS: Record<string, {
  name: string;
  headers: string[];
  example: string[];
  instructions: string[];
}> = {
  'ingredients-master': {
    name: 'Ingredient Master Template',
    headers: ['Category', 'Korean Name', 'English Name', 'Quantity', 'Unit', 'Yield Rate (%)'],
    example: ['Oil', '식용유', 'Cooking Oil', '18', 'L', '100'],
    instructions: [
      'Category: Oil, Raw chicken, Sauce, Powder, Dry goods, Food, Produced',
      'Unit: ml, g, L, kg, ea, pcs',
      'Yield Rate: 1-100 (percentage, default 100)'
    ]
  },
  'ingredients-price': {
    name: 'Ingredient Prices Template',
    headers: ['Template Name', 'Ingredient English Name', 'Price', 'Currency', 'Notes'],
    example: ['Canada', 'Cooking Oil', '25.99', 'CAD', 'Costco bulk purchase'],
    instructions: [
      'Template Name: Must match existing template (e.g., Canada, Mexico, Colombia)',
      'Ingredient: Must match existing master ingredient English name',
      'Currency: CAD, USD, MXN, COP, KRW, etc.'
    ]
  },
  'menu-manual': {
    name: 'Menu Manuals Template',
    headers: ['Menu Name (EN)', 'Menu Name (KR)', 'Group Name', 'Shelf Life', 'Yield', 'Yield Unit', 'Selling Price', 'Notes'],
    example: ['Crispy Chicken', '크리스피 치킨', 'Canada Menu', '2 hours', '10', 'servings', '12.99', 'Popular item'],
    instructions: [
      'Group Name: Must match existing Manual Group name',
      'Shelf Life: Text format (e.g., "2 hours", "1 day")',
      'Yield Unit: servings, pieces, portions, kg, g, etc.'
    ]
  },
  'manual-ingredients': {
    name: 'Manual Ingredients Template',
    headers: ['Manual Name (EN)', 'Ingredient Name (EN)', 'Ingredient Name (KR)', 'Quantity', 'Unit', 'Section', 'Sort Order', 'Notes'],
    example: ['Crispy Chicken', 'Chicken Breast', '닭가슴살', '200', 'g', 'MAIN', '1', ''],
    instructions: [
      'Manual Name: Must match existing Menu Manual English name',
      'Section: MAIN, SAUCE, GARNISH, SIDE, TOPPING',
      'Unit: g, ml, ea, pcs, kg, L, tbsp, tsp',
      'Sort Order: Number for ordering ingredients in recipe'
    ]
  },
  'vendors': {
    name: 'Vendors Template',
    headers: ['Vendor Name', 'Category', 'Country', 'City', 'Address', 'Phone', 'Email', 'Website', 'Notes'],
    example: ['Sysco Foods', 'Food', 'CA', 'Toronto', '123 Main St', '+1-416-555-0100', 'orders@sysco.ca', 'www.sysco.ca', 'Main food supplier'],
    instructions: [
      'Category: Equipment, Food, Construction, Service, Packaging, Other',
      'Country: 2-letter country code (CA, US, MX, CO, KR)',
      'Phone: Include country code'
    ]
  },
  'grocery-prices': {
    name: 'Grocery Prices Template',
    headers: ['Ingredient Name (EN)', 'Country', 'Retailer', 'Package Size', 'Package Unit', 'Package Price', 'Currency', 'Tax Included', 'Source URL', 'Notes'],
    example: ['Chicken Breast', 'CA', 'Costco', '5', 'kg', '35.99', 'CAD', 'Yes', 'https://costco.ca/...', 'Bulk pack'],
    instructions: [
      'Ingredient: Must match existing ingredient English name',
      'Package Unit: g, kg, ml, L, ea, pcs',
      'Tax Included: Yes or No',
      'Source URL: Optional link to price source'
    ]
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateType = searchParams.get('type');
  const format = searchParams.get('format') || 'csv';

  if (!templateType || !TEMPLATE_CONFIGS[templateType]) {
    return NextResponse.json(
      { error: 'Invalid template type', availableTypes: Object.keys(TEMPLATE_CONFIGS) },
      { status: 400 }
    );
  }

  const config = TEMPLATE_CONFIGS[templateType];

  if (format === 'xlsx') {
    // For Excel format, we'll create a proper XLSX file
    // Using a simple XML-based approach that Excel can read
    const xmlContent = createExcelXML(config);
    
    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${templateType}-template.xlsx"`,
      },
    });
  }

  // CSV format (default)
  const csvContent = createCSV(config);
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${templateType}-template.csv"`,
    },
  });
}

function createCSV(config: typeof TEMPLATE_CONFIGS[string]): string {
  const BOM = '\uFEFF';
  const lines: string[] = [];
  
  // Add instructions as comments
  lines.push(`# ${config.name}`);
  lines.push('# Instructions / 작성 가이드:');
  config.instructions.forEach(inst => lines.push(`# ${inst}`));
  lines.push('#');
  lines.push('# Delete these comment lines (starting with #) before uploading');
  lines.push('# 업로드 전에 # 으로 시작하는 이 주석 줄들을 삭제하세요');
  lines.push('#');
  
  // Add header row
  lines.push(config.headers.join(','));
  
  // Add example row
  lines.push(config.example.map(escapeCSV).join(','));
  
  // Add empty rows for user
  for (let i = 0; i < 5; i++) {
    lines.push(config.headers.map(() => '').join(','));
  }
  
  return BOM + lines.join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function createExcelXML(config: typeof TEMPLATE_CONFIGS[string]): string {
  // Create a simple XML spreadsheet that Excel can open
  const escapeXML = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  let rows = '';
  
  // Title row
  rows += `<Row ss:StyleID="Title"><Cell ss:MergeAcross="${config.headers.length - 1}"><Data ss:Type="String">${escapeXML(config.name)}</Data></Cell></Row>\n`;
  
  // Instructions rows
  rows += `<Row><Cell ss:MergeAcross="${config.headers.length - 1}"><Data ss:Type="String">Instructions / 작성 가이드:</Data></Cell></Row>\n`;
  config.instructions.forEach(inst => {
    rows += `<Row><Cell ss:MergeAcross="${config.headers.length - 1}"><Data ss:Type="String">${escapeXML(inst)}</Data></Cell></Row>\n`;
  });
  
  // Empty row
  rows += '<Row></Row>\n';
  
  // Header row with style
  rows += '<Row ss:StyleID="Header">';
  config.headers.forEach(header => {
    rows += `<Cell><Data ss:Type="String">${escapeXML(header)}</Data></Cell>`;
  });
  rows += '</Row>\n';
  
  // Example row
  rows += '<Row ss:StyleID="Example">';
  config.example.forEach(value => {
    const isNumber = !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
    rows += `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${escapeXML(value)}</Data></Cell>`;
  });
  rows += '</Row>\n';
  
  // Empty rows for data
  for (let i = 0; i < 10; i++) {
    rows += '<Row>';
    config.headers.forEach(() => {
      rows += '<Cell><Data ss:Type="String"></Data></Cell>';
    });
    rows += '</Row>\n';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Font ss:FontName="Arial" ss:Size="10"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Arial" ss:Size="14" ss:Bold="1"/>
      <Interior ss:Color="#E8F4FC" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
      <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="Example">
      <Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Template">
    <Table>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;
}
