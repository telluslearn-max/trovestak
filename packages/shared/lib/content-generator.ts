// ============================================
// CONTENT GENERATOR
// Features and FAQ generation
// ============================================

import type { ProductFeature, FAQItem } from './types.js';

export function generateFeatures(
  productName: string,
  brand: string,
  category: string,
  subcategory?: string
): ProductFeature[] {
  const lowerName = productName.toLowerCase();
  const features: ProductFeature[] = [];
  
  // Common features for all products
  features.push({
    icon: '🛡️',
    title: 'Warranty',
    desc: 'All products come with a manufacturer warranty. We also offer extended warranty options for added peace of mind.'
  });
  
  features.push({
    icon: '✓',
    title: 'Genuine Product',
    desc: '100% authentic product sourced directly from authorized distributors and manufacturers.'
  });
  
  features.push({
    icon: '🚚',
    title: 'Fast Delivery',
    desc: 'Same-day delivery within Nairobi. Countrywide delivery via G4S or Fargo courier within 1-3 business days.'
  });
  
  features.push({
    icon: '↩️',
    title: 'Easy Returns',
    desc: '7-day return policy for unused items in original packaging. Customer satisfaction guaranteed.'
  });
  
  // Category-specific features
  if (lowerName.includes('airpod') || lowerName.includes('earbud') || lowerName.includes('headphone')) {
    features.push({
      icon: '🔊',
      title: 'Premium Audio',
      desc: 'Experience high-quality sound with advanced audio technology, noise cancellation, and immersive listening.'
    });
    
    if (lowerName.includes('noise') || lowerName.includes('anc') || lowerName.includes('pro')) {
      features.push({
        icon: '🔇',
        title: 'Active Noise Cancellation',
        desc: 'Block out distractions with industry-leading noise cancellation technology.'
      });
    }
  }
  
  if (lowerName.includes('iphone') || lowerName.includes('galaxy') || lowerName.includes('pixel')) {
    features.push({
      icon: '📱',
      title: 'Flagship Performance',
      desc: 'Powered by the latest processor technology for seamless multitasking and exceptional performance.'
    });
    
    if (lowerName.includes('camera') || lowerName.includes('pro') || lowerName.includes('ultra')) {
      features.push({
        icon: '📸',
        title: 'Pro Camera System',
        desc: 'Capture stunning photos and videos with advanced camera sensors and AI-powered features.'
      });
    }
  }
  
  if (lowerName.includes('macbook') || lowerName.includes('laptop')) {
    features.push({
      icon: '💻',
      title: 'Powerful Performance',
      desc: 'Handle demanding tasks with powerful processors, ample RAM, and fast SSD storage.'
    });
    
    features.push({
      icon: '🔋',
      title: 'All-Day Battery',
      desc: 'Work throughout the day with long-lasting battery life and fast charging capability.'
    });
  }
  
  if (lowerName.includes('watch') || lowerName.includes('fitness')) {
    features.push({
      icon: '❤️',
      title: 'Health Tracking',
      desc: 'Monitor your health with heart rate, SpO2, sleep tracking, and advanced fitness features.'
    });
  }
  
  if (lowerName.includes('jbl') || lowerName.includes('speaker')) {
    features.push({
      icon: '🎵',
      title: 'Portable Power',
      desc: 'Take your music anywhere with powerful, portable speakers featuring long battery life.'
    });
  }
  
  if (lowerName.includes('gaming') || lowerName.includes('playstation') || lowerName.includes('xbox')) {
    features.push({
      icon: '🎮',
      title: 'Gaming Excellence',
      desc: 'Experience next-generation gaming with stunning graphics, fast load times, and immersive gameplay.'
    });
  }
  
  // Keep only 6 features
  return features.slice(0, 6);
}

export function generateFAQ(
  productName: string,
  brand: string,
  category: string
): FAQItem[] {
  const brandName = brand.split(' ')[0];
  const faq: FAQItem[] = [];
  
  // Always include these common questions
  faq.push({
    q: `Is this ${brandName} genuine and brand new?`,
    a: 'Yes — all products we sell are 100% genuine and brand new, sourced directly from authorised distributors.'
  });
  
  faq.push({
    q: 'What warranty do I get?',
    a: 'This product comes with a 1 Year manufacturer warranty. We also offer extended warranty options — ask our team for details.'
  });
  
  faq.push({
    q: 'Do you offer same-day delivery?',
    a: 'Yes, we offer same-day delivery within Nairobi for orders placed before 12:00 PM. Countrywide delivery takes 1-3 business days via G4S or Fargo courier.'
  });
  
  // Category-specific questions
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('phone') || lowerName.includes('iphone') || lowerName.includes('galaxy') || lowerName.includes('pixel')) {
    faq.push({
      q: 'Will this phone work with Safaricom and Airtel networks in Kenya?',
      a: 'Yes, all our phones are unlocked and compatible with Kenyan network carriers including Safaricom, Airtel Kenya, and Telkom Kenya. They support all local 4G and 5G bands.'
    });
    
    faq.push({
      q: 'Does this phone support 5G in Kenya?',
      a: 'Yes, 5G is available in Nairobi and major cities. The phone supports 5G bands compatible with Safaricom and Airtel 5G networks.'
    });
  }
  
  if (lowerName.includes('laptop') || lowerName.includes('macbook')) {
    faq.push({
      q: 'Is this laptop suitable for productivity work?',
      a: 'Absolutely — this laptop is powered by a high-performance processor and ample RAM, perfect for productivity tasks, video conferencing, and creative work.'
    });
  }
  
  if (lowerName.includes('airpod') || lowerName.includes('earbud') || lowerName.includes('headphone')) {
    faq.push({
      q: 'Are these compatible with my phone/laptop?',
      a: 'Yes, these audio devices use Bluetooth and are compatible with all Bluetooth-enabled devices including iPhones, Android phones, laptops, and tablets.'
    });
  }
  
  if (lowerName.includes('printer') || lowerName.includes('ink') || lowerName.includes('toner')) {
    faq.push({
      q: 'What ink/toner does this printer use?',
      a: 'This printer uses standard HP ink cartridges. We stock original HP cartridges — ask our team about compatible options and pricing.'
    });
  }
  
  if (lowerName.includes('ps5') || lowerName.includes('playstation') || lowerName.includes('xbox')) {
    faq.push({
      q: 'Do games for this console work in Kenya?',
      a: 'Yes, all our consoles are region-free and support games from any region. They include a Kenya-compatible power plug.'
    });
  }
  
  // Always include payment question
  faq.push({
    q: 'What payment methods do you accept?',
    a: 'We accept M-Pesa, bank transfer, Visa/Mastercard, and credit card instalments through our finance partners. We also offer Buy Now Pay Later options.'
  });
  
  // Return 6 FAQ items
  return faq.slice(0, 6);
}

export function generateDefaultFeatures(): ProductFeature[] {
  return [
    {
      icon: '🛡️',
      title: 'Warranty',
      desc: 'All products come with a manufacturer warranty. We also offer extended warranty options.'
    },
    {
      icon: '✓',
      title: 'Genuine Product',
      desc: '100% authentic product sourced directly from authorized distributors.'
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      desc: 'Same-day delivery within Nairobi. Countrywide delivery within 1-3 business days.'
    },
    {
      icon: '↩️',
      title: 'Easy Returns',
      desc: '7-day return policy for unused items in original packaging.'
    },
    {
      icon: '💳',
      title: 'Flexible Payment',
      desc: 'M-Pesa, bank transfer, and credit card instalments available.'
    },
    {
      icon: '📞',
      title: 'Support',
      desc: 'Our team is ready to help with any questions or concerns.'
    }
  ];
}

export function generateDefaultFAQ(brand: string): FAQItem[] {
  return [
    {
      q: `Is this ${brand} product genuine and brand new?`,
      a: 'Yes — all products we sell are 100% genuine and brand new, sourced directly from authorised distributors.'
    },
    {
      q: 'What warranty do I get?',
      a: 'This product comes with a 1 Year manufacturer warranty. Extended warranty options are available.'
    },
    {
      q: 'Do you offer same-day delivery?',
      a: 'Yes, we offer same-day delivery within Nairobi for orders placed before 12:00 PM. Countrywide delivery takes 1-3 business days.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept M-Pesa, bank transfer, Visa/Mastercard, and credit card instalments.'
    },
    {
      q: 'Can I return this product?',
      a: 'Yes, we accept returns within 7 days for items in original, unused condition.'
    },
    {
      q: 'Do you offer installation services?',
      a: 'For large appliances and electronics, we offer white-glove delivery and setup in Nairobi. Contact us for details.'
    }
  ];
}
