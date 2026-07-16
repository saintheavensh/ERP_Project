export interface DeviceBrand {
  id: string;
  name: string;
}

const NOISY_PREFIXES = [
  'lcd', 'baterai', 'battery', 'touchscreen', 'ts', 'kaca', 'konektor', 
  'konektor cas', 'board', 'fleksibel', 'flexible', 'kamera', 'camera', 
  'backdoor', 'casing', 'tulang', 'frame', 'tombol', 'mic', 'speaker', 'buzzer'
];

export function parseCompatibilityStrings(productName: string, knownBrands: DeviceBrand[]): string[] {
  // 1. Clean the string from noisy prefixes
  let cleanName = productName;
  
  // Create a regex to match prefixes at the beginning of the string
  for (const prefix of NOISY_PREFIXES) {
    const regex = new RegExp(`^${prefix}\\b\\s*-?`, 'i');
    if (regex.test(cleanName)) {
      cleanName = cleanName.replace(regex, '').trim();
      break; // Usually only one prefix at the start
    }
  }

  // 2. Split by slash (/) or comma (,)
  const segments = cleanName.split(/[\/,]/).map(s => s.trim()).filter(s => s.length > 0);
  
  const parsedModels: string[] = [];
  let lastBrand = '';

  // Sort known brands by length descending so "Sony Ericsson" matches before "Sony"
  const sortedBrands = [...knownBrands].sort((a, b) => b.name.length - a.name.length);

  for (let segment of segments) {
    // Check if segment already starts with a known brand
    let hasBrand = false;
    for (const brand of sortedBrands) {
      if (segment.toLowerCase().startsWith(brand.name.toLowerCase())) {
        hasBrand = true;
        lastBrand = brand.name; // remember this brand
        break;
      }
    }

    if (!hasBrand && lastBrand) {
      // If it doesn't have a brand, prepend the last known brand
      segment = `${lastBrand} ${segment}`;
    }

    // Clean up multiple spaces
    segment = segment.replace(/\s+/g, ' ').trim();
    
    // Also handle machine codes with hyphen (Samsung A7 Sm-A725).
    // We don't need to split by hyphen here because the whole string "Samsung A7 Sm-A725" 
    // will be used to search against the deviceModels table, which may contain "A7 Sm-A725".
    // Or we will do an ILIKE search later.
    
    parsedModels.push(segment);
  }

  // Remove duplicates just in case
  return [...new Set(parsedModels)];
}
