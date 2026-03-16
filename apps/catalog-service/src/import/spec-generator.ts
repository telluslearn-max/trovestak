// ============================================
// SPEC GENERATOR
// Category-specific technical specifications
// ============================================

export interface SpecsMap {
  [category: string]: SpecGroup;
}

export interface SpecGroup {
  [key: string]: string;
}

// Default warranty by category
export function getDefaultWarranty(category: string): string {
  const warrantyMap: Record<string, string> = {
    'mobile': '1 Year',
    'computing': '1 Year',
    'audio': '1 Year',
    'wearables': '1 Year',
    'gaming': '1 Year',
    'cameras': '1 Year',
    'smart-home': '1 Year',
    'software': '90 Days'
  };

  return warrantyMap[category] || '1 Year';
}

// Generate specs based on category and product name
export function generateSpecs(
  productName: string,
  category: string,
  subcategory?: string
): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  // Mobile Phones
  if (category === 'mobile' || lowerName.includes('iphone') || lowerName.includes('galaxy') || lowerName.includes('pixel')) {
    return generateMobileSpecs(productName);
  }

  // Laptops
  if (category === 'computing' && (lowerName.includes('macbook') || lowerName.includes('laptop'))) {
    return generateLaptopSpecs(productName);
  }

  // Tablets
  if (category === 'mobile' && (lowerName.includes('ipad') || lowerName.includes('tablet'))) {
    return generateTabletSpecs(productName);
  }

  // Audio - Earbuds
  if (category === 'audio' || lowerName.includes('airpod') || lowerName.includes('earbud') || lowerName.includes('galaxy bud')) {
    return generateEarbudSpecs(productName);
  }

  // Audio - Headphones
  if (category === 'audio' && (lowerName.includes('headphone') || lowerName.includes('wh-') || lowerName.includes('beats'))) {
    return generateHeadphoneSpecs(productName);
  }

  // Audio - Speakers
  if (category === 'audio' && (lowerName.includes('speaker') || lowerName.includes('jbl') || lowerName.includes('bose'))) {
    return generateSpeakerSpecs(productName);
  }

  // Smartwatches
  if (category === 'wearables' && (lowerName.includes('watch') || lowerName.includes('galaxy watch') || lowerName.includes('apple watch'))) {
    return generateWatchSpecs(productName);
  }

  // Gaming
  if (category === 'gaming') {
    return generateGamingSpecs(productName);
  }

  // Networking
  if (subcategory === 'networking' || subcategory === 'enterprise networking') {
    return generateNetworkingSpecs(productName);
  }

  // Printers
  if (lowerName.includes('printer')) {
    return generatePrinterSpecs(productName);
  }

  // Default generic specs
  return {
    'General': {
      'Condition': 'Brand New',
      'Availability': 'In Stock',
      'Warranty': getDefaultWarranty(category)
    }
  };
}

function generateMobileSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Display': {
      'Type': 'OLED / AMOLED',
      'Refresh Rate': '120Hz',
      'Resolution': 'Full HD+'
    },
    'Performance': {
      'Processor': 'Flagship Grade',
      'RAM': '8GB - 16GB',
      'Storage': '128GB - 1TB'
    },
    'Camera': {
      'Main Camera': '48MP - 200MP',
      'Front Camera': '12MP - 50MP',
      'Video': '4K / 8K Recording'
    },
    'Battery': {
      'Capacity': '4000mAh - 5000mAh',
      'Charging': 'Fast Charging 25W - 100W',
      'Wireless Charging': 'Supported'
    },
    'Connectivity': {
      '5G': 'Supported',
      'Wi-Fi': 'Wi-Fi 6E',
      'Bluetooth': '5.3',
      'NFC': 'Supported'
    },
    'General': {
      'OS': 'iOS / Android',
      'Warranty': '1 Year'
    }
  };

  // iPhone specific
  if (lowerName.includes('iphone')) {
    specs['Performance']['Processor'] = 'A17 Pro / A18 chip';
    specs['Display']['Type'] = 'Super Retina XDR OLED';
    specs['Connectivity']['Port'] = 'USB-C';
    specs['Water Resistance'] = { 'Rating': 'IP68' };
  }

  // Samsung specific
  if (lowerName.includes('galaxy')) {
    specs['Performance']['Processor'] = 'Snapdragon / Exynos';
    specs['Display']['Type'] = 'Dynamic AMOLED 2X';
    specs['S Pen'] = { 'Support': 'S Pen included (Ultra models)' };
  }

  // Google Pixel specific
  if (lowerName.includes('pixel')) {
    specs['Performance']['Processor'] = 'Google Tensor G4';
    specs['Camera']['Features'] = 'Magic Eraser, Night Sight, AI Features';
  }

  return specs;
}

function generateLaptopSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Display': {
      'Size': '13" - 16"',
      'Resolution': 'Retina / Full HD+',
      'Refresh Rate': '60Hz - 120Hz'
    },
    'Performance': {
      'Processor': 'Apple M-series / Intel Core / AMD Ryzen',
      'RAM': '8GB - 64GB',
      'Graphics': 'Integrated / Dedicated'
    },
    'Storage': {
      'Type': 'SSD',
      'Capacity': '256GB - 2TB'
    },
    'Battery': {
      'Life': 'Up to 20 hours',
      'Charging': 'USB-C / MagSafe'
    },
    'Connectivity': {
      'Ports': 'USB-C, Thunderbolt',
      'Wi-Fi': 'Wi-Fi 6E',
      'Bluetooth': '5.3'
    },
    'General': {
      'OS': 'macOS / Windows',
      'Warranty': '1 Year'
    }
  };

  // MacBook specific
  if (lowerName.includes('macbook air')) {
    specs['Performance']['Processor'] = 'Apple M3 / M4';
    specs['Display']['Type'] = 'Liquid Retina';
  }

  if (lowerName.includes('macbook pro')) {
    specs['Performance']['Processor'] = 'Apple M3 Pro / M3 Max / M4 Pro / M4 Max';
    specs['Display']['Type'] = 'Liquid Retina XDR';
    specs['Display']['Features'] = 'ProMotion, HDR';
  }

  return specs;
}

function generateTabletSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Display': {
      'Size': '8.3" - 13"',
      'Resolution': 'Retina / Full HD',
      'Technology': 'Liquid Retina / Super AMOLED'
    },
    'Performance': {
      'Processor': 'A-series / M-series / Snapdragon',
      'RAM': '4GB - 16GB',
      'Storage': '64GB - 1TB'
    },
    'Camera': {
      'Rear': '8MP - 12MP',
      'Front': '7MP - 12MP'
    },
    'Battery': {
      'Life': 'Up to 10 hours',
      'Charging': 'USB-C / Lightning'
    },
    'Connectivity': {
      'Wi-Fi': 'Wi-Fi 6E',
      'Bluetooth': '5.3',
      'Cellular': 'Optional (5G)'
    },
    'General': {
      'OS': 'iPadOS / Android',
      'Warranty': '1 Year'
    }
  };

  // iPad specific
  if (lowerName.includes('ipad')) {
    specs['Apple Pencil'] = { 'Support': 'Apple Pencil compatible' };
    specs['Keyboard'] = { 'Support': 'Magic Keyboard / Smart Keyboard' };
  }

  return specs;
}

function generateEarbudSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Audio': {
      'Driver': 'Custom Apple / Dynamic',
      'Frequency Response': '20Hz - 20kHz',
      'Active Noise Cancellation': 'Supported'
    },
    'Battery': {
      'Earbuds': '4 - 8 hours',
      'With Charging Case': '20 - 30 hours',
      'Charging': 'USB-C / Wireless'
    },
    'Connectivity': {
      'Bluetooth': '5.0 - 5.3',
      'Codecs': 'AAC, LDAC, aptX'
    },
    'Features': {
      'Transparency Mode': 'Supported',
      'Spatial Audio': 'Supported',
      'Water Resistance': 'IPX4'
    },
    'General': {
      'Warranty': '1 Year'
    }
  };

  // AirPods specific
  if (lowerName.includes('airpod')) {
    specs['Performance']['Processor'] = 'Apple H1 / H2 Chip';
    specs['General']['Integration'] = 'Apple';
  }

  // Galaxy Buds specific
  if (lowerName.includes('galaxy bud')) {
    specs['General']['Integration'] = 'Galaxy ecosystem';
  }

  return specs;
}

function generateHeadphoneSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Audio': {
      'Driver': '30mm - 40mm',
      'Frequency Response': '4Hz - 40kHz',
      'Impedance': '32 Ohms',
      'Active Noise Cancellation': 'Supported'
    },
    'Battery': {
      'Life': '20 - 40 hours',
      'Charging': 'USB-C',
      'Quick Charge': '10 min = 3-5 hours'
    },
    'Connectivity': {
      'Bluetooth': '5.0 - 5.3',
      'Multipoint': 'Supported',
      'Wired': '3.5mm / USB-C'
    },
    'Features': {
      'Voice Assistant': 'Supported',
      'Touch Controls': 'Supported',
      'Foldable': 'Yes'
    },
    'General': {
      'Weight': '250g - 300g',
      'Warranty': '1 Year'
    }
  };

  // Sony WH specific
  if (lowerName.includes('wh-')) {
    specs['Audio']['Processor'] = 'Sony V1 / QN1';
    specs['Audio']['LDAC Support'] = 'Yes';
  }

  // Bose specific
  if (lowerName.includes('bose')) {
    specs['Audio']['Technology'] = 'Bose AR';
  }

  return specs;
}

function generateSpeakerSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Audio': {
      'Driver': 'Custom',
      'Output Power': '20W - 100W',
      'Frequency Response': '50Hz - 20kHz'
    },
    'Battery': {
      'Life': '12 - 24 hours',
      'Charging': 'USB-C'
    },
    'Connectivity': {
      'Bluetooth': '5.1 - 5.3',
      'Wi-Fi': 'Optional',
      'Aux': '3.5mm'
    },
    'Features': {
      'Waterproof': 'IPX5 - IPX7',
      'PartyBoost': 'Supported (JBL)',
      'Speakerphone': 'Supported'
    },
    'General': {
      'Weight': '500g - 2kg',
      'Warranty': '1 Year'
    }
  };

  // JBL specific
  if (lowerName.includes('jbl')) {
    specs['Features']['JBL PartyBoost'] = 'Connect multiple speakers';
  }

  // Marshall specific
  if (lowerName.includes('marshall')) {
    specs['General']['Controls'] = 'Analog knobs';
  }

  return specs;
}

function generateWatchSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Display': {
      'Size': '40mm - 49mm',
      'Type': 'OLED / AMOLED',
      'Always-On': 'Supported'
    },
    'Sensors': {
      'Heart Rate': 'Supported',
      'SpO2': 'Supported',
      'ECG': 'Supported',
      'GPS': 'Supported'
    },
    'Battery': {
      'Life': '18 - 36 hours',
      'Wireless Charging': 'Supported'
    },
    'Features': {
      'Water Resistance': '5ATM / IP68',
      'NFC': 'Supported',
      'LTE': 'Optional (Cellular)'
    },
    'General': {
      'OS': 'watchOS / Wear OS',
      'Warranty': '1 Year'
    }
  };

  // Apple Watch specific
  if (lowerName.includes('apple watch')) {
    specs['Sensors']['Temperature Sensing'] = 'Supported';
    specs['Features']['Crash Detection'] = 'Supported';
  }

  // Galaxy Watch specific
  if (lowerName.includes('galaxy watch')) {
    specs['Features']['Samsung Health'] = 'Supported (BIA, Blood Pressure)';
  }

  return specs;
}

function generateGamingSpecs(productName: string): Record<string, Record<string, string>> {
  const lowerName = productName.toLowerCase();

  const specs: Record<string, Record<string, string>> = {
    'Performance': {
      'CPU': 'Custom AMD / Intel',
      'GPU': 'Custom RDNA / RTX',
      'RAM': '16GB - 24GB'
    },
    'Storage': {
      'SSD': '825GB - 2TB',
      'Expansion': 'External SSD support'
    },
    'Display': {
      'Resolution': 'Up to 4K',
      'Frame Rate': 'Up to 120fps',
      'HDR': 'Supported'
    },
    'Features': {},
    'General': {
      'Warranty': '1 Year'
    }
  };

  // PlayStation specific
  if (lowerName.includes('playstation') || lowerName.includes('ps5')) {
    specs['Features']['Ray Tracing'] = 'Supported';
    specs['Features']['Tempest 3D Audio'] = 'Supported';
  }

  // Xbox specific
  if (lowerName.includes('xbox')) {
    specs['Features']['Quick Resume'] = 'Supported';
    specs['Features']['Game Pass'] = 'Note: Subscription sold separately';
  }

  return specs;
}

function generateNetworkingSpecs(productName: string): Record<string, Record<string, string>> {
  const specs: Record<string, Record<string, string>> = {
    'Performance': {
      'Speed': 'Up to 10Gbps',
      'Ports': '24 - 48 ports',
      'PoE': 'Supported'
    },
    'Management': {
      'Type': 'Managed / Smart',
      'VLAN': 'Supported',
      'QoS': 'Supported'
    },
    'Physical': {
      'Mounting': 'Rackmount / Desktop',
      'Fans': 'Quiet operation'
    },
    'General': {
      'Warranty': 'Lifetime / 1 Year'
    }
  };

  return specs;
}

function generatePrinterSpecs(productName: string): Record<string, Record<string, string>> {
  const specs: Record<string, Record<string, string>> = {
    'Print': {
      'Type': 'Laser / Inkjet',
      'Speed': '20 - 40 ppm',
      'Resolution': '1200 x 1200 dpi'
    },
    'Functions': {
      'Print': 'Yes',
      'Scan': 'Yes',
      'Copy': 'Yes',
      'Fax': 'Optional'
    },
    'Connectivity': {
      'USB': 'Supported',
      'Wi-Fi': 'Supported',
      'Ethernet': 'Supported'
    },
    'General': {
      'Duty Cycle': '10,000 - 50,000 pages/month',
      'Warranty': '1 Year'
    }
  };

  return specs;
}

// Addon eligibility rules
export function getAddonEligibility(
  price: number,
  category: string,
  subcategory?: string
): {
  bnpl: boolean;
  trade_in: boolean;
  shipping: boolean;
  same_day: boolean;
  insurance: boolean;
} {
  const lowerCategory = category.toLowerCase();

  return {
    // BNPL for items above KES 15,000
    bnpl: price >= 15000,

    // Trade-in for phones, laptops, tablets, watches, consoles
    trade_in: ['mobile', 'computing', 'wearables', 'gaming'].includes(lowerCategory) ||
      lowerCategory.includes('phone') ||
      lowerCategory.includes('laptop') ||
      lowerCategory.includes('watch') ||
      lowerCategory.includes('console'),

    // Shipping for all products
    shipping: true,

    // Same-day for Nairobi area products (high value)
    same_day: price >= 10000,

    // Insurance for items above KES 10,000
    insurance: price >= 10000
  };
}
