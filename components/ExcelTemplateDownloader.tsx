'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from './ui/Button';

type TemplateType = 
  | 'ingredients-master'
  | 'ingredients-price'
  | 'menu-manual'
  | 'manual-ingredients'
  | 'vendors'
  | 'grocery-prices';

interface TemplateConfig {
  id: TemplateType;
  name: string;
  nameKr: string;
  description: string;
  headers: string[];
  example: string[];
  instructions: string[];
}

const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    id: 'ingredients-master',
    name: 'Ingredient Master',
    nameKr: '마스터 식재료',
    description: 'Bulk register master ingredient data',
    headers: ['Category', 'Korean Name', 'English Name', 'Quantity', 'Unit', 'Yield Rate (%)'],
    example: ['Oil', '식용유', 'Cooking Oil', '18', 'L', '100'],
    instructions: [
      'Category: Oil, Raw chicken, Sauce, Powder, Dry goods, Food, Produced',
      'Unit: ml, g, L, kg, ea, pcs',
      'Yield Rate: 1-100 (percentage, default 100)'
    ]
  },
  {
    id: 'ingredients-price',
    name: 'Ingredient Prices',
    nameKr: '식재료 가격',
    description: 'Bulk update ingredient prices by country/template',
    headers: ['Template Name', 'Ingredient English Name', 'Price', 'Currency', 'Notes'],
    example: ['Canada', 'Cooking Oil', '25.99', 'CAD', 'Costco bulk purchase'],
    instructions: [
      'Template Name: Must match existing template (e.g., Canada, Mexico, Colombia)',
      'Ingredient: Must match existing master ingredient English name',
      'Currency: CAD, USD, MXN, COP, KRW, etc.'
    ]
  },
  {
    id: 'menu-manual',
    name: 'Menu Manuals',
    nameKr: '메뉴 매뉴얼',
    description: 'Bulk register menu recipes',
    headers: ['Menu Name (EN)', 'Menu Name (KR)', 'Group Name', 'Shelf Life', 'Yield', 'Yield Unit', 'Selling Price', 'Notes'],
    example: ['Crispy Chicken', '크리스피 치킨', 'Canada Menu', '2 hours', '10', 'servings', '12.99', 'Popular item'],
    instructions: [
      'Group Name: Must match existing Manual Group name',
      'Shelf Life: Text format (e.g., "2 hours", "1 day")',
      'Yield Unit: servings, pieces, portions, kg, g, etc.'
    ]
  },
  {
    id: 'manual-ingredients',
    name: 'Manual Ingredients',
    nameKr: '매뉴얼 재료',
    description: 'Bulk add ingredients to menu manuals',
    headers: ['Manual Name (EN)', 'Ingredient Name (EN)', 'Ingredient Name (KR)', 'Quantity', 'Unit', 'Section', 'Sort Order', 'Notes'],
    example: ['Crispy Chicken', 'Chicken Breast', '닭가슴살', '200', 'g', 'MAIN', '1', ''],
    instructions: [
      'Manual Name: Must match existing Menu Manual English name',
      'Section: MAIN, SAUCE, GARNISH, SIDE, TOPPING',
      'Unit: g, ml, ea, pcs, kg, L, tbsp, tsp',
      'Sort Order: Number for ordering ingredients in recipe'
    ]
  },
  {
    id: 'vendors',
    name: 'Vendors',
    nameKr: '거래처',
    description: 'Bulk register vendor/supplier information',
    headers: ['Vendor Name', 'Category', 'Country', 'City', 'Address', 'Phone', 'Email', 'Website', 'Notes'],
    example: ['Sysco Foods', 'Food', 'CA', 'Toronto', '123 Main St', '+1-416-555-0100', 'orders@sysco.ca', 'www.sysco.ca', 'Main food supplier'],
    instructions: [
      'Category: Equipment, Food, Construction, Service, Packaging, Other',
      'Country: 2-letter country code (CA, US, MX, CO, KR)',
      'Phone: Include country code'
    ]
  },
  {
    id: 'grocery-prices',
    name: 'Grocery Prices',
    nameKr: '식재료 시세',
    description: 'Bulk update grocery price information',
    headers: ['Ingredient Name (EN)', 'Country', 'Retailer', 'Package Size', 'Package Unit', 'Package Price', 'Currency', 'Tax Included', 'Source URL', 'Notes'],
    example: ['Chicken Breast', 'CA', 'Costco', '5', 'kg', '35.99', 'CAD', 'Yes', 'https://costco.ca/...', 'Bulk pack'],
    instructions: [
      'Ingredient: Must match existing ingredient English name',
      'Package Unit: g, kg, ml, L, ea, pcs',
      'Tax Included: Yes or No',
      'Source URL: Optional link to price source'
    ]
  }
];

interface ExcelTemplateDownloaderProps {
  onDownload?: (templateType: TemplateType) => void;
}

export default function ExcelTemplateDownloader({ onDownload }: ExcelTemplateDownloaderProps) {
  const [expandedTemplate, setExpandedTemplate] = useState<TemplateType | null>(null);
  const [downloading, setDownloading] = useState<TemplateType | null>(null);

  const downloadTemplate = async (config: TemplateConfig) => {
    setDownloading(config.id);
    
    try {
      // Create CSV content with BOM for Korean character support
      const BOM = '\uFEFF';
      const headerRow = config.headers.join(',');
      const exampleRow = config.example.map(val => {
        // Escape values containing commas or quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
      
      // Add instruction rows as comments
      const instructionRows = config.instructions.map(inst => `# ${inst}`);
      
      const csvContent = [
        BOM + '# ' + config.name + ' Template / ' + config.nameKr + ' 템플릿',
        '# Instructions / 작성 가이드:',
        ...instructionRows,
        '#',
        '# Delete these comment lines (starting with #) before uploading',
        '# 업로드 전에 # 으로 시작하는 이 주석 줄들을 삭제하세요',
        '#',
        headerRow,
        exampleRow,
        // Add a few empty rows for user to fill
        config.headers.map(() => '').join(','),
        config.headers.map(() => '').join(','),
        config.headers.map(() => '').join(','),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.id}-template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onDownload?.(config.id);
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template. Please try again.');
    }
    
    setDownloading(null);
  };

  const downloadExcelTemplate = async (config: TemplateConfig) => {
    setDownloading(config.id);
    
    try {
      // Try to use the API endpoint for proper Excel file
      const response = await fetch(`/api/templates/download?type=${config.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.id}-template.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback to CSV
        downloadTemplate(config);
        return;
      }
      
      onDownload?.(config.id);
    } catch {
      // Fallback to CSV download
      downloadTemplate(config);
    }
    
    setDownloading(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Bulk Upload Templates</h3>
            <p className="text-sm text-gray-600">
              대량 업로드용 템플릿을 다운로드하세요. Download templates for bulk data import.
            </p>
          </div>
        </div>
      </div>

      {/* Template List */}
      <div className="grid gap-3">
        {TEMPLATE_CONFIGS.map((config) => (
          <div 
            key={config.id}
            className="border rounded-lg overflow-hidden bg-white hover:shadow-sm transition-shadow"
          >
            {/* Template Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedTemplate(expandedTemplate === config.id ? null : config.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {config.name} <span className="text-gray-500">/ {config.nameKr}</span>
                  </h4>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate(config);
                  }}
                  disabled={downloading === config.id}
                >
                  {downloading === config.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadExcelTemplate(config);
                  }}
                  disabled={downloading === config.id}
                >
                  {downloading === config.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Excel
                    </>
                  )}
                </Button>
                {expandedTemplate === config.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedTemplate === config.id && (
              <div className="border-t bg-gray-50 p-4 space-y-4">
                {/* Column Preview */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Columns / 컬럼:</h5>
                  <div className="flex flex-wrap gap-2">
                    {config.headers.map((header, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-white border rounded text-sm text-gray-700"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Example Row */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Example / 예시:</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded">
                      <thead className="bg-gray-100">
                        <tr>
                          {config.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-1.5 text-left text-xs font-medium text-gray-600 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          {config.example.map((value, idx) => (
                            <td key={idx} className="px-3 py-1.5 text-gray-700 border-b">
                              {value}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Instructions */}
                <div className="flex gap-2 text-sm">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-600 space-y-1">
                    {config.instructions.map((inst, idx) => (
                      <p key={idx}>{inst}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Tips / 팁:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• CSV files support Korean text with UTF-8 BOM encoding</li>
          <li>• Delete all comment lines (starting with #) before uploading</li>
          <li>• First row must contain headers exactly as shown</li>
          <li>• CSV 파일은 UTF-8 BOM 인코딩으로 한글을 지원합니다</li>
          <li>• 업로드 전 # 으로 시작하는 주석 줄을 모두 삭제하세요</li>
        </ul>
      </div>
    </div>
  );
}
