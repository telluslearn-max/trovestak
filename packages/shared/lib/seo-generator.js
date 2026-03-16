// ============================================
// SEO GENERATOR
// Auto-generates SEO titles and descriptions
// ============================================
export function generateSEOTitle(productName, keyFeature, storeName = 'Trovestak Kenya') {
    let title = productName;
    if (keyFeature && !title.toLowerCase().includes(keyFeature.toLowerCase())) {
        title += ` | ${keyFeature}`;
    }
    if (!title.includes(storeName)) {
        title += ` | ${storeName}`;
    }
    return title;
}
export function generateSEODescription(productName, features = [], storeName = 'Trovestak', city = 'Nairobi') {
    const brand = productName.split(' ')[0];
    let description = `Buy ${productName} in Kenya. `;
    if (features.length > 0) {
        description += features.slice(0, 3).join(', ') + '. ';
    }
    description += `Best price at ${storeName}. `;
    description += `Free delivery in ${city}. `;
    description += `Genuine products with warranty.`;
    // Limit to ~160 chars
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }
    return description;
}
export function generateOverview(productName, brand, category) {
    const brandName = brand.split(' ')[0];
    const templates = {
        'Apple': `The ${productName} delivers premium performance with Apple's renowned design and build quality. Experience seamless integration with the Apple ecosystem, powerful hardware, and industry-leading software.`,
        'Samsung': `The ${productName} offers cutting-edge technology and premium build quality from Samsung. Features advanced display technology, powerful cameras, and Samsung's innovative features.`,
        'Sony': `The ${productName} provides exceptional audio quality with Sony's signature sound engineering. Premium construction for lasting performance and comfort.`,
        'JBL': `The ${productName} delivers powerful JBL Original Pro Sound with deep bass. Designed for music lovers who want premium audio on the go with durable, portable design.`,
        'Bose': `The ${productName} features world-class noise cancellation and premium audio quality that Bose is known for. Comfortable for all-day listening with exceptional clarity.`,
        'Beats': `The ${productName} combines Beats' signature bold sound with premium design. Perfect for those who want style and substance in their audio devices.`,
        'Marshall': `The ${productName} delivers Marshall's legendary signature sound with classic analog controls. A statement piece for audiophiles who appreciate vintage aesthetics.`,
        'Logitech': `The ${productName} is a premium peripheral from Logitech. Built for productivity, gaming, and professional use with reliable performance.`,
        'Shokz': `The ${productName} uses bone conduction technology for open-ear listening. Perfect for athletes and outdoor enthusiasts who want to stay aware.`,
        'Google': `The ${productName} offers the best of Google AI and software integration. Smooth performance with timely updates and seamless Android experience.`,
        'HP': `The ${productName} is a reliable HP product built for business and professional use. Trusted HP quality and support with enterprise-grade features.`,
        'Dell': `The ${productName} is a premium Dell device built for performance and reliability. Perfect for professionals and businesses needing powerful computing.`,
        'Lenovo': `The ${productName} offers reliable performance from Lenovo. Built with ThinkPad quality and innovation for business and personal use.`,
        'Asus': `The ${productName} delivers powerful performance from ASUS. Known for quality components and innovative design in computing devices.`,
        'Microsoft': `The ${productName} provides the full Windows experience with Microsoft quality. Perfect integration with Microsoft 365 and Windows ecosystem.`
    };
    // Check for partial matches
    for (const [key, template] of Object.entries(templates)) {
        if (brandName.toLowerCase().includes(key.toLowerCase())) {
            return template;
        }
    }
    // Default template
    return `The ${productName} is a premium product offering excellent value. Quality construction with reliable performance for everyday use.`;
}
export function generateSubtitle(productName, brand) {
    const parts = [];
    // Add brand if not in name
    if (!productName.toLowerCase().includes(brand.toLowerCase().split(' ')[0].toLowerCase())) {
        parts.push(brand);
    }
    // Detect key features from name
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('pro') || lowerName.includes('ultra') || lowerName.includes('max')) {
        parts.push('Pro Performance');
    }
    if (lowerName.includes('5g') || lowerName.includes('wifi 6')) {
        parts.push('Fast Connectivity');
    }
    if (lowerName.includes('ai')) {
        parts.push('AI Powered');
    }
    if (lowerName.includes('camera') || lowerName.includes('photo')) {
        parts.push('Pro Camera');
    }
    if (lowerName.includes('battery') || lowerName.includes('power')) {
        parts.push('All-Day Battery');
    }
    if (lowerName.includes('防水') || lowerName.includes('waterproof') || lowerName.includes('water resistant')) {
        parts.push('Water Resistant');
    }
    if (parts.length === 0) {
        parts.push('Premium Quality');
    }
    return parts.join(' · ');
}
export function generateBreadcrumb(navCategory, navSubcategory, productName) {
    const breadcrumb = ['Home'];
    if (navCategory) {
        breadcrumb.push(navCategory);
    }
    if (navSubcategory) {
        breadcrumb.push(navSubcategory);
    }
    if (productName) {
        breadcrumb.push(productName);
    }
    return breadcrumb;
}
