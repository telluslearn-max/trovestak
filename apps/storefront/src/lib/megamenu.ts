export interface MegaMenuLink {
  name: string;
  href: string;
}

export interface MegaMenuItem {
  category: string;
  links: MegaMenuLink[];
}

export interface MegaMenuColumn {
  title: string;
  items: MegaMenuItem[];
  footer: MegaMenuFooter;
}

export interface MegaMenuFooter {
  name: string;
  href: string;
}

export interface MegaMenuCategory {
  columns: MegaMenuColumn[];
  footer: MegaMenuFooter;
}

export interface MegaMenuData {
  [key: string]: MegaMenuCategory;
}

export const megaMenuData: MegaMenuData = {
  mobile: {
    columns: [
      {
        title: "Mobile Phones",
        items: [
          {
            category: "Flagship Phones",
            links: [
              { name: "iPhone", href: "/category/mobile/flagship-phones/apple" },
              { name: "Samsung Galaxy S", href: "/category/mobile/flagship-phones/samsung" },
              { name: "Google Pixel", href: "/category/mobile/flagship-phones/google" },
              { name: "OnePlus", href: "/category/mobile/flagship-phones/oneplus" },
            ]
          },
          {
            category: "Mid-Range Phones",
            links: [
              { name: "Samsung A Series", href: "/category/mobile/mid-range-phones/Samsung" },
              { name: "Xiaomi", href: "/category/mobile/mid-range-phones/Xiaomi" },
              { name: "OPPO", href: "/category/mobile/mid-range-phones/OPPO" },
              { name: "vivo", href: "/category/mobile/mid-range-phones/vivo" },
            ]
          },
          {
            category: "Budget Phones",
            links: [
              { name: "Infinix", href: "/category/mobile/budget-phones/Infinix" },
              { name: "Tecno", href: "/category/mobile/budget-phones/Tecno" },
              { name: "Realme", href: "/category/mobile/budget-phones/Realme" },
              { name: "Nokia", href: "/category/mobile/budget-phones/Nokia" },
            ]
          },
        ],
        footer: { name: "Shop All Phones", href: "/category/mobile" }
      },
      {
        title: "Tablets",
        items: [
          {
            category: "iPad",
            links: [
              { name: "iPad Pro", href: "/category/mobile/ipad/Apple" },
              { name: "iPad Air", href: "/category/mobile/ipad/Apple" },
              { name: "iPad Mini", href: "/category/mobile/ipad/Apple" },
              { name: "iPad 10th Gen", href: "/category/mobile/ipad/Apple" },
            ]
          },
          {
            category: "Android Tablets",
            links: [
              { name: "Samsung Tab S", href: "/category/mobile/android-tablets/Samsung" },
              { name: "Xiaomi Pad", href: "/category/mobile/android-tablets/Xiaomi" },
              { name: "Lenovo Tab", href: "/category/mobile/android-tablets/Lenovo" },
            ]
          },
        ],
        footer: { name: "Shop All Tablets", href: "/category/mobile/ipad" }
      },
      {
        title: "Accessories",
        items: [
          {
            category: "Charging",
            links: [
              { name: "Phone Chargers", href: "/category/mobile/charging" },
              { name: "Cables", href: "/category/mobile/charging" },
              { name: "Power Banks", href: "/category/mobile/charging" },
              { name: "Wireless Chargers", href: "/category/mobile/charging" },
            ]
          },
          {
            category: "Cases & Protection",
            links: [
              { name: "Phone Cases", href: "/category/mobile/accessories" },
              { name: "Tablet Cases", href: "/category/mobile/accessories" },
              { name: "Screen Protectors", href: "/category/mobile/accessories" },
            ]
          },
        ],
        footer: { name: "Shop All Accessories", href: "/category/mobile/accessories" }
      },
    ],
    footer: { name: "Shop All Phones", href: "/category/mobile" }
  },
  computing: {
    columns: [
      {
        title: "Laptops",
        items: [
          {
            category: "MacBooks",
            links: [
              { name: "MacBook Air", href: "/category/computers/macbooks/Apple" },
              { name: "MacBook Pro", href: "/category/computers/macbooks/Apple" },
            ]
          },
          {
            category: "Windows Laptops",
            links: [
              { name: "Business Laptops", href: "/category/computers/windows-laptops" },
              { name: "Gaming Laptops", href: "/category/computers/windows-laptops" },
              { name: "Student Laptops", href: "/category/computers/windows-laptops" },
              { name: "Ultrabooks", href: "/category/computers/windows-laptops" },
            ]
          },
          {
            category: "Chromebooks",
            links: [
              { name: "Chrome OS Laptops", href: "/category/computers/windows-laptops" },
            ]
          },
        ],
        footer: { name: "Shop All Laptops", href: "/category/computers/laptops" }
      },
      {
        title: "Desktops & Monitors",
        items: [
          {
            category: "Desktops",
            links: [
              { name: "iMac", href: "/category/computers/desktops/Apple" },
              { name: "Mac Mini/Mac Studio", href: "/category/computers/desktops/Apple" },
              { name: "HP All-in-One", href: "/category/computers/desktops/HP" },
              { name: "Gaming PCs", href: "/category/computers/desktops" },
            ]
          },
          {
            category: "Monitors",
            links: [
              { name: "Gaming Monitors", href: "/category/computers/monitors" },
              { name: "4K Monitors", href: "/category/computers/monitors" },
              { name: "Ultrawide Monitors", href: "/category/computers/monitors" },
              { name: "Business Monitors", href: "/category/computers/monitors" },
            ]
          },
        ],
        footer: { name: "Shop All Desktops", href: "/category/computers/desktops" }
      },
      {
        title: "Accessories & Power",
        items: [
          {
            category: "Power & UPS",
            links: [
              { name: "UPS Systems", href: "/category/computers/power" },
              { name: "Power Strips", href: "/category/computers/power" },
              { name: "Surge Protectors", href: "/category/computers/power" },
            ]
          },
          {
            category: "Peripherals",
            links: [
              { name: "Keyboards & Mice", href: "/category/computers/peripherals" },
              { name: "Webcams", href: "/category/computers/peripherals" },
              { name: "Laptop Bags", href: "/category/computers/peripherals" },
              { name: "Docking Stations", href: "/category/computers/peripherals" },
            ]
          },
        ],
        footer: { name: "Shop All Accessories", href: "/category/computers/accessories" }
      },
    ],
    footer: { name: "Shop All Computing", href: "/category/computers" }
  },
  audio: {
    columns: [
      {
        title: "Headphones",
        items: [
          {
            category: "Over-Ear Headphones",
            links: [
              { name: "Sony WH-1000XM5", href: "/category/audio/over-ear-headphones/Sony" },
              { name: "Bose QC45", href: "/category/audio/over-ear-headphones/Bose" },
              { name: "Apple AirPods Max", href: "/category/audio/over-ear-headphones/Apple" },
              { name: "JBL Tune", href: "/category/audio/over-ear-headphones/JBL" },
            ]
          },
          {
            category: "Wireless Earbuds",
            links: [
              { name: "Apple AirPods", href: "/category/audio/wireless-earbuds/Apple" },
              { name: "Samsung Galaxy Buds", href: "/category/audio/wireless-earbuds/Samsung" },
              { name: "Sony WF-1000XM5", href: "/category/audio/wireless-earbuds/Sony" },
              { name: "JBL/Bose/Beats", href: "/category/audio/wireless-earbuds" },
            ]
          },
        ],
        footer: { name: "Shop All Headphones", href: "/category/audio/headphones" }
      },
      {
        title: "Speakers",
        items: [
          {
            category: "Bluetooth Speakers",
            links: [
              { name: "JBL Flip", href: "/category/audio/bluetooth-speakers/JBL" },
              { name: "Sony SRS", href: "/category/audio/bluetooth-speakers/Sony" },
              { name: "Ultimate Ears", href: "/category/audio/bluetooth-speakers" },
              { name: "Portable Speakers", href: "/category/audio/bluetooth-speakers" },
            ]
          },
          {
            category: "Home Audio",
            links: [
              { name: "Soundbars", href: "/category/audio/soundbars" },
              { name: "Home Theater", href: "/category/audio/home-audio" },
              { name: "Smart Speakers", href: "/category/audio/home-audio" },
            ]
          },
        ],
        footer: { name: "Shop All Speakers", href: "/category/audio/speakers" }
      },
      {
        title: "Professional Audio",
        items: [
          {
            category: "Studio Equipment",
            links: [
              { name: "Microphones", href: "/category/audio/professional-audio" },
              { name: "Audio Interfaces", href: "/category/audio/professional-audio" },
              { name: "Studio Monitors", href: "/category/audio/professional-audio" },
            ]
          },
          {
            category: "Business Audio",
            links: [
              { name: "Conference Systems", href: "/category/audio/business-audio" },
              { name: "PA Systems", href: "/category/audio/business-audio" },
            ]
          },
        ],
        footer: { name: "Shop All Audio", href: "/category/audio" }
      },
    ],
    footer: { name: "Shop All Audio", href: "/category/audio" }
  },
  gaming: {
    columns: [
      {
        title: "Consoles",
        items: [
          {
            category: "PlayStation 5",
            links: [
              { name: "PS5 Standard", href: "/category/gaming/playstation-5" },
              { name: "PS5 Digital", href: "/category/gaming/playstation-5" },
              { name: "PS5 Accessories", href: "/category/gaming/playstation-5" },
            ]
          },
          {
            category: "Xbox Series X|S",
            links: [
              { name: "Xbox Series X", href: "/category/gaming/xbox-series?brand=Microsoft" },
              { name: "Xbox Series S", href: "/category/gaming/xbox-series?brand=Microsoft" },
              { name: "Xbox Accessories", href: "/category/gaming/xbox-series" },
            ]
          },
          {
            category: "Nintendo Switch",
            links: [
              { name: "OLED Model", href: "/category/gaming/nintendo-switch?brand=Nintendo" },
              { name: "Standard", href: "/category/gaming/nintendo-switch?brand=Nintendo" },
              { name: "Lite", href: "/category/gaming/nintendo-switch?brand=Nintendo" },
            ]
          },
        ],
        footer: { name: "Shop All Consoles", href: "/category/gaming/consoles" }
      },
      {
        title: "PC Gaming",
        items: [
          {
            category: "Gaming Laptops",
            links: [
              { name: "High-End Gaming", href: "/category/computers/gaming-laptops" },
              { name: "Mid-Range Gaming", href: "/category/computers/gaming-laptops" },
            ]
          },
          {
            category: "Gaming PCs",
            links: [
              { name: "Pre-Built Gaming PCs", href: "/category/computers/gaming-pcs" },
              { name: "Custom Build", href: "/category/computers/gaming-pcs" },
            ]
          },
          {
            category: "Graphics Cards",
            links: [
              { name: "NVIDIA RTX", href: "/category/gaming/pc-gaming/NVIDIA" },
              { name: "AMD Radeon", href: "/category/gaming/pc-gaming/AMD" },
            ]
          },
        ],
        footer: { name: "Shop PC Gaming", href: "/category/gaming/pc-gaming" }
      },
      {
        title: "Gaming Accessories",
        items: [
          {
            category: "Controllers",
            links: [
              { name: "PS5 Controllers", href: "/category/gaming/playstation-accessories" },
              { name: "Xbox Controllers", href: "/category/gaming/xbox-series" },
              { name: "Pro Controllers", href: "/category/gaming/controllers" },
            ]
          },
          {
            category: "Gaming Gear",
            links: [
              { name: "Gaming Headsets", href: "/category/gaming/consoles" },
              { name: "Gaming Keyboards", href: "/category/gaming/consoles" },
              { name: "Gaming Mice", href: "/category/gaming/consoles" },
              { name: "Mouse Pads", href: "/category/gaming/consoles" },
            ]
          },
        ],
        footer: { name: "Shop All Accessories", href: "/category/gaming/consoles" }
      },
    ],
    footer: { name: "Shop All Gaming", href: "/category/gaming" }
  },
  cameras: {
    columns: [
      {
        title: "Cameras",
        items: [
          {
            category: "Digital Cameras",
            links: [
              { name: "DSLR Cameras", href: "/category/cameras/dslr-cameras" },
              { name: "Mirrorless", href: "/category/cameras/mirrorless" },
              { name: "Point & Shoot", href: "/category/cameras" },
            ]
          },
          {
            category: "Action & Special",
            links: [
              { name: "Action Cameras", href: "/category/cameras/action-cameras" },
              { name: "Instant Cameras", href: "/category/cameras/instant-cameras" },
              { name: "360 Cameras", href: "/category/cameras" },
            ]
          },
          {
            category: "Brands",
            links: [
              { name: "Sony", href: "/category/cameras?brand=Sony" },
              { name: "Canon", href: "/category/cameras?brand=Canon" },
              { name: "Nikon", href: "/category/cameras?brand=Nikon" },
            ]
          },
        ],
        footer: { name: "Shop All Cameras", href: "/category/cameras" }
      },
      {
        title: "Drones & Gimbal",
        items: [
          {
            category: "Drones",
            links: [
              { name: "DJI Drones", href: "/category/cameras/drones/DJI" },
              { name: "Consumer Drones", href: "/category/cameras/drones" },
              { name: "Professional Drones", href: "/category/cameras/drones" },
            ]
          },
          {
            category: "Stabilizers",
            links: [
              { name: "DJI Gimbals", href: "/category/cameras/gimbals/DJI" },
              { name: "Zhiyun Gimbals", href: "/category/cameras/gimbals" },
              { name: "Handheld Stabilizers", href: "/category/cameras/gimbals" },
            ]
          },
        ],
        footer: { name: "Shop All Drones", href: "/category/cameras/drones" }
      },
      {
        title: "Accessories",
        items: [
          {
            category: "Lenses",
            links: [
              { name: "Camera Lenses", href: "/category/cameras/lenses" },
              { name: "Lens Accessories", href: "/category/cameras/lenses" },
            ]
          },
          {
            category: "Storage & Bags",
            links: [
              { name: "Memory Cards", href: "/category/cameras/accessories" },
              { name: "Camera Bags", href: "/category/cameras/accessories" },
              { name: "Tripods", href: "/category/cameras/accessories" },
            ]
          },
        ],
        footer: { name: "Shop Accessories", href: "/category/cameras/accessories" }
      },
    ],
    footer: { name: "Shop All Cameras", href: "/category/cameras" }
  },
  wearables: {
    columns: [
      {
        title: "Smartwatches",
        items: [
          {
            category: "Apple Watch",
            links: [
              { name: "Series 10", href: "/category/wearables/apple-watch/Apple" },
              { name: "Ultra 2", href: "/category/wearables/apple-watch/Apple" },
              { name: "SE", href: "/category/wearables/apple-watch/Apple" },
            ]
          },
          {
            category: "Samsung Galaxy Watch",
            links: [
              { name: "Galaxy Watch 7", href: "/category/wearables/samsung-watch/Samsung" },
              { name: "Galaxy Watch Ultra", href: "/category/wearables/samsung-watch/Samsung" },
              { name: "Galaxy Watch FE", href: "/category/wearables/samsung-watch/Samsung" },
            ]
          },
          {
            category: "Other Brands",
            links: [
              { name: "Garmin", href: "/category/wearables/smartwatches/Garmin" },
              { name: "Amazfit", href: "/category/wearables/smartwatches/Amazfit" },
              { name: "Fitbit", href: "/category/wearables/smartwatches/Fitbit" },
            ]
          },
        ],
        footer: { name: "Shop All Smartwatches", href: "/category/wearables/smartwatches" }
      },
      {
        title: "Fitness & Audio",
        items: [
          {
            category: "Fitness Trackers",
            links: [
              { name: "Xiaomi Band", href: "/category/wearables/fitness-trackers/Xiaomi" },
              { name: "Garmin", href: "/category/wearables/fitness-trackers/Garmin" },
              { name: "Amazfit Band", href: "/category/wearables/fitness-trackers/Amazfit" },
            ]
          },
          {
            category: "Wireless Earbuds",
            links: [
              { name: "AirPods", href: "/category/wearables/wireless-earbuds/Apple" },
              { name: "Galaxy Buds", href: "/category/wearables/wireless-earbuds/Samsung" },
              { name: "Other Earbuds", href: "/category/wearables/wireless-earbuds" },
            ]
          },
        ],
        footer: { name: "Shop All Wearables", href: "/category/wearables" }
      },
      {
        title: "Smart Glasses",
        items: [
          {
            category: "Smart Glasses",
            links: [
              { name: "Audio Glasses", href: "/category/wearables/smart-glasses" },
              { name: "AR Glasses", href: "/category/wearables/smart-glasses" },
              { name: "Camera Glasses", href: "/category/wearables/smart-glasses" },
            ]
          },
        ],
        footer: { name: "Shop Smart Glasses", href: "/category/wearables/smart-glasses" }
      },
    ],
    footer: { name: "Shop All Wearables", href: "/category/wearables" }
  },
  "smart-home": {
    columns: [
      {
        title: "Smart TVs",
        items: [
          {
            category: "Samsung TVs",
            links: [
              { name: "QLED 4K", href: "/category/smart-home/samsung-tvs/Samsung" },
              { name: "Crystal UHD", href: "/category/smart-home/samsung-tvs/Samsung" },
              { name: "OLED", href: "/category/smart-home/samsung-tvs/Samsung" },
            ]
          },
          {
            category: "Other Brands",
            links: [
              { name: "LG OLED", href: "/category/smart-home/lg-tvs/LG" },
              { name: "Sony TVs", href: "/category/smart-home/sony-tvs/Sony" },
              { name: "TCL TVs", href: "/category/smart-home/tcl-tvs/TCL" },
              { name: "Hisense TVs", href: "/category/smart-home/hisense-tvs/Hisense" },
            ]
          },
          {
            category: "Vision Plus",
            links: [
              { name: "Vidaa TVs", href: "/category/smart-home/vision-plus-tvs/Vision+" },
              { name: "Smart TVs", href: "/category/smart-home/vision-plus-tvs" },
            ]
          },
        ],
        footer: { name: "Shop All TVs", href: "/category/smart-home/smart-tvs" }
      },
      {
        title: "Connectivity",
        items: [
          {
            category: "Starlink",
            links: [
              { name: "Residential Kit", href: "/category/smart-home/starlink/Starlink" },
              { name: "Roam/Mini", href: "/category/smart-home/starlink/Starlink" },
              { name: "Accessories", href: "/category/smart-home/starlink" },
            ]
          },
          {
            category: "Networking",
            links: [
              { name: "WiFi 6 Routers", href: "/category/smart-home/networking" },
              { name: "WiFi 7 Routers", href: "/category/smart-home/networking" },
              { name: "Mesh WiFi", href: "/category/smart-home/mesh-wifi" },
              { name: "Mobile WiFi", href: "/category/smart-home/mobile-wifi" },
            ]
          },
        ],
        footer: { name: "Shop Connectivity", href: "/category/smart-home/networking" }
      },
      {
        title: "Streaming & Smart",
        items: [
          {
            category: "Streaming Devices",
            links: [
              { name: "Apple TV", href: "/category/smart-home/streaming/Apple" },
              { name: "Chromecast", href: "/category/smart-home/streaming" },
              { name: "Amazon Fire TV", href: "/category/smart-home/streaming" },
            ]
          },
          {
            category: "Smart Home",
            links: [
              { name: "Smart Lights", href: "/category/smart-home/smart-lights" },
              { name: "Smart Plugs", href: "/category/smart-home/smart-home-devices" },
              { name: "Security Cameras", href: "/category/smart-home/security-cameras" },
            ]
          },
        ],
        footer: { name: "Shop Smart Home", href: "/category/smart-home" }
      },
    ],
    footer: { name: "Shop All Smart Home", href: "/category/smart-home" }
  },
};

export const mainCategories = [
  { id: "mobile", name: "Mobile" },
  { id: "computing", name: "Computing" },
  { id: "audio", name: "Audio" },
  { id: "gaming", name: "Gaming" },
  { id: "cameras", name: "Cameras" },
  { id: "wearables", name: "Wearables" },
  { id: "smart-home", name: "Smart Home" },
  { id: "deals", name: "Deals" },
];
