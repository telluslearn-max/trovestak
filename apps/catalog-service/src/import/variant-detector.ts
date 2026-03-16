// ============================================
// VARIANT DETECTOR
// Extracts colors, storage, sizes from product names
// ============================================

interface DetectedVariant {
  type: 'color' | 'storage' | 'size' | 'tier';
  value: string;
  price?: number;
}

interface ColorVariant {
  name: string;
  hex: string;
  hex2?: string;
}

// Color mappings for common product colors
const COLOR_MAP: Record<string, { hex: string; hex2?: string }> = {
  // Common & Brand Specific
  'midnight': { hex: '#1c2030', hex2: '#2d3350' },
  'starlight': { hex: '#f5f5f0', hex2: '#e8e8e0' },
  'space black': { hex: '#2d2d2d', hex2: '#3d3d3d' },
  'space grey': { hex: '#6e6e73', hex2: '#8e8e93' },
  'silver': { hex: '#e3e3e3', hex2: '#f3f3f3' },
  'gold': { hex: '#f5e6c8', hex2: '#faf0d8' },
  'rose gold': { hex: '#e8d4d0', hex2: '#f0e0da' },
  'blue': { hex: '#0071e3', hex2: '#1a8fe3' },
  'purple': { hex: '#8e8eff', hex2: '#a0a0ff' },
  'pink': { hex: '#ffb3c6', hex2: '#ffc5d4' },
  'green': { hex: '#34c759', hex2: '#50d078' },
  'product red': { hex: '#ff3b30', hex2: '#ff5550' },
  'black': { hex: '#1c1c1e', hex2: '#2c2c2e' },
  'white': { hex: '#f5f5f7', hex2: '#ffffff' },
  'titanium black': { hex: '#1a1a1c', hex2: '#2a2a2e' },
  'titanium silver': { hex: '#b8b8bc', hex2: '#d0d0d4' },
  'titanium blue': { hex: '#3a5a7a', hex2: '#4a6a8a' },
  'titanium natural': { hex: '#c4b59d', hex2: '#d4c5ad' },
  'titanium gray': { hex: '#8a8a8c', hex2: '#9a9a9c' },
  'titanium violet': { hex: '#6a5a7a', hex2: '#7a6a8a' },
  'onyx': { hex: '#1c1c1c', hex2: '#2c2c2c' },
  'cream': { hex: '#f5f0e6', hex2: '#fff8f0' },
  'violet': { hex: '#6a5acd', hex2: '#7a6add' },
  'graphite': { hex: '#4a4a4a', hex2: '#5a5a5a' },
  'noise cancelling black': { hex: '#1a1a1a', hex2: '#2a2a2a' },
  'noise cancelling silver': { hex: '#c0c0c0', hex2: '#d0d0d0' },
  'triple black': { hex: '#1a1a1a', hex2: '#2a2a2a' },
  'soapstone': { hex: '#e8e4dc', hex2: '#f8f4ec' },
  'arctic white': { hex: '#f5f5f5', hex2: '#ffffff' },
  'lunar blue': { hex: '#4a5568', hex2: '#5a6578' },
  'red': { hex: '#cc0000', hex2: '#dd0000' },
  'teal': { hex: '#008080', hex2: '#009090' },
  'squad': { hex: '#4a5568', hex2: '#5a6578' },
  'grey': { hex: '#6b7280', hex2: '#7b7280' },
  'navy': { hex: '#000080', hex2: '#0010a0' },
  'forest green': { hex: '#228b22', hex2: '#329b32' },
  'rose': { hex: '#e8b4b8', hex2: '#f8c4c8' },
  'lavender': { hex: '#c4b8e8', hex2: '#d4c8f8' },
};

// Storage patterns
const STORAGE_PATTERNS = [
  /(\d+)GB/i,
  /(\d+)GB\s*\/?\s*(\d+)?GB/i,
  /(\d+)TB/i,
  /(\d+)\s*TB\s*\/?\s*(\d+)?GB/i,
  /(\d+)GB\s*SSD/i,
  /(\d+)GB\s*NVMe/i,
];

// Size patterns (for laptops, watches, tablets)
const SIZE_PATTERNS = [
  /(\d+)[-"]inch/i,
  /(\d+)["']?\s*(?:inch|")/i,
  /(\d+)mm\b/i, // Watches
  /(13\.?\d*)["']?\s*(?:inch)?/i,
  /(14\.?\d*)["']?\s*(?:inch)?/i,
  /(15\.?\d*)["']?\s*(?:inch)?/i,
  /(16\.?\d*)["']?\s*(?:inch)?/i,
];

// RAM patterns
const RAM_PATTERNS = [
  /(\d+)GB\s*RAM/i,
  /(\d+)GB\s*DDR[45]/i,
];

// Chip patterns
const CHIP_PATTERNS = [
  /M\d/i, // Apple Silicon
  /A\d+\s*(Pro)?/i, // Apple A-series
  /Snapdragon\s*\d+/i,
  /Exynos\s*\d+/i,
  /Dimensity\s*\d+/i,
  /Tensor\s*G?\d/i,
  /Intel\s*Core\s*[i]\d/i,
  /AMD\s*Ryzen\s*\d/i,
];

export function detectVariants(productName: string): DetectedVariant[] {
  const variants: DetectedVariant[] = [];
  const lowerName = productName.toLowerCase();

  // Detect storage
  for (const pattern of STORAGE_PATTERNS) {
    const match = lowerName.match(pattern);
    if (match) {
      const storage = match[0];
      if (!variants.find(v => v.type === 'storage' && v.value.includes(storage))) {
        variants.push({
          type: 'storage',
          value: storage.toUpperCase().replace(/\s*\/?\s*/g, ' / ').trim()
        });
      }
    }
  }

  // Detect size
  for (const pattern of SIZE_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      const size = match[0].replace(/["']/g, '"').replace(/inch/gi, '-inch').trim();
      if (!variants.find(v => v.type === 'size' && v.value.includes(size))) {
        variants.push({
          type: 'size',
          value: size
        });
      }
    }
  }

  // Detect colors
  for (const [colorName, colorValues] of Object.entries(COLOR_MAP)) {
    if (lowerName.includes(colorName)) {
      if (!variants.find(v => v.type === 'color')) {
        variants.push({
          type: 'color',
          value: colorName.charAt(0).toUpperCase() + colorName.slice(1)
        });
      }
    }
  }

  return variants;
}

export function extractColors(productName: string): ColorVariant[] {
  const colors: ColorVariant[] = [];
  const lowerName = productName.toLowerCase();

  for (const [colorName, colorValues] of Object.entries(COLOR_MAP)) {
    if (lowerName.includes(colorName)) {
      colors.push({
        name: colorName.charAt(0).toUpperCase() + colorName.slice(1),
        hex: colorValues.hex,
        hex2: colorValues.hex2
      });
    }
  }

  return colors;
}

export function extractStorage(productName: string): string[] {
  const storage: string[] = [];
  const lowerName = productName.toLowerCase();

  for (const pattern of STORAGE_PATTERNS) {
    const match = lowerName.match(pattern);
    if (match) {
      const value = match[0].toUpperCase().replace(/\s*\/?\s*/g, ' / ').trim();
      if (!storage.includes(value)) {
        storage.push(value);
      }
    }
  }

  return storage;
}

export function extractSize(productName: string): string | null {
  for (const pattern of SIZE_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      return match[0].replace(/["']/g, '"').trim();
    }
  }
  return null;
}

export function extractRAM(productName: string): string | null {
  for (const pattern of RAM_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }
  return null;
}

export function extractChip(productName: string): string | null {
  for (const pattern of CHIP_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

export function generateShortName(productName: string): string {
  // Remove brand prefix if present at start
  let shortName = productName;

  // Common brand prefixes to remove
  const brandPrefixes = [
    'Apple ', 'Samsung ', 'Google ', 'Sony ', 'JBL ', 'Bose ',
    'Beats ', 'Logitech ', 'Marshall ', 'Shokz ', 'Microsoft ',
    'HP ', 'Dell ', 'Lenovo ', 'Asus ', 'Acer ', 'OnePlus ', 'Xiaomi ',
    'Redmi ', 'POCO ', 'Huawei ', 'Oppo ', 'Vivo ', 'Realme '
  ];

  for (const prefix of brandPrefixes) {
    if (shortName.startsWith(prefix)) {
      shortName = shortName.substring(prefix.length);
      break;
    }
  }

  // Remove storage info in parentheses
  shortName = shortName.replace(/\s*\([^)]*\d+GB[^)]*\)/gi, '');

  // Remove specific model numbers that are too long
  shortName = shortName.replace(/\s*\(.*\)/g, '');

  // Trim and limit length
  shortName = shortName.trim();
  if (shortName.length > 40) {
    shortName = shortName.substring(0, 37) + '...';
  }

  return shortName || productName;
}

export function generateSlug(productName: string): string {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/--/g, '-');
}
