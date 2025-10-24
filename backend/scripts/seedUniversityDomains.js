// University Domains Seed Script
// Populates the UniversityBranding collection with known university mappings

const mongoose = require('mongoose');
const config = require('../config.json');
const UniversityBranding = require('../models/universityBranding.model');

// University data with domains and official colors
const UNIVERSITY_DATA = [
  // Illinois
  { name: 'Northern Illinois University', aliases: ['niu', 'northern illinois university'], domain: 'niu.edu', primary: '#BA0C2F', secondary: '#000000' },
  { name: 'University of Illinois Chicago', aliases: ['uic', 'university of illinois chicago', 'university of illinois at chicago'], domain: 'uic.edu', primary: '#001E62', secondary: '#D50032' },
  { name: 'University of Illinois at Urbana-Champaign', aliases: ['uiuc', 'university of illinois', 'university of illinois at urbana-champaign'], domain: 'illinois.edu', primary: '#13294B', secondary: '#E84A27' },
  { name: 'Northwestern University', aliases: ['northwestern', 'northwestern university'], domain: 'northwestern.edu', primary: '#4E2A84', secondary: '#FFFFFF' },
  { name: 'University of Chicago', aliases: ['uchicago', 'university of chicago'], domain: 'uchicago.edu', primary: '#800000', secondary: '#767676' },
  { name: 'DePaul University', aliases: ['depaul', 'depaul university'], domain: 'depaul.edu', primary: '#004B87', secondary: '#D40000' },
  { name: 'Loyola University Chicago', aliases: ['loyola', 'loyola university chicago'], domain: 'luc.edu', primary: '#8B2332', secondary: '#F1BE48' },
  { name: 'Illinois Institute of Technology', aliases: ['iit', 'illinois institute of technology', 'illinois tech'], domain: 'iit.edu', primary: '#CC0000', secondary: '#5E6A71' },

  // California
  { name: 'Stanford University', aliases: ['stanford', 'stanford university'], domain: 'stanford.edu', primary: '#8C1515', secondary: '#FFFFFF' },
  { name: 'University of California, Berkeley', aliases: ['uc berkeley', 'berkeley', 'university of california berkeley'], domain: 'berkeley.edu', primary: '#003262', secondary: '#FDB515' },
  { name: 'University of California, Los Angeles', aliases: ['ucla', 'university of california los angeles'], domain: 'ucla.edu', primary: '#2D68C4', secondary: '#FFD100' },
  { name: 'University of Southern California', aliases: ['usc', 'university of southern california'], domain: 'usc.edu', primary: '#990000', secondary: '#FFCC00' },
  { name: 'California Institute of Technology', aliases: ['caltech', 'california institute of technology'], domain: 'caltech.edu', primary: '#FF6C0C', secondary: '#FFFFFF' },

  // Massachusetts
  { name: 'Harvard University', aliases: ['harvard', 'harvard university'], domain: 'harvard.edu', primary: '#A41034', secondary: '#FFFFFF' },
  { name: 'Massachusetts Institute of Technology', aliases: ['mit', 'massachusetts institute of technology'], domain: 'mit.edu', primary: '#A31F34', secondary: '#8A8B8C' },
  { name: 'Boston University', aliases: ['bu', 'boston university'], domain: 'bu.edu', primary: '#CC0000', secondary: '#FFFFFF' },
  { name: 'Northeastern University', aliases: ['northeastern', 'northeastern university'], domain: 'northeastern.edu', primary: '#C8102E', secondary: '#000000' },

  // Texas
  { name: 'University of Texas at Austin', aliases: ['ut austin', 'university of texas', 'university of texas at austin'], domain: 'utexas.edu', primary: '#BF5700', secondary: '#FFFFFF' },
  { name: 'University of Texas at Dallas', aliases: ['ut dallas', 'university of texas at dallas'], domain: 'utdallas.edu', primary: '#C75B12', secondary: '#008542' },
  { name: 'Texas A&M University', aliases: ['texas a&m', 'texas a&m university'], domain: 'tamu.edu', primary: '#500000', secondary: '#FFFFFF' },

  // New York
  { name: 'Columbia University', aliases: ['columbia', 'columbia university'], domain: 'columbia.edu', primary: '#B9D9EB', secondary: '#FFFFFF', textColor: '#003D79' },
  { name: 'New York University', aliases: ['nyu', 'new york university'], domain: 'nyu.edu', primary: '#57068C', secondary: '#FFFFFF' },
  { name: 'Cornell University', aliases: ['cornell', 'cornell university'], domain: 'cornell.edu', primary: '#B31B1B', secondary: '#FFFFFF' },

  // Pennsylvania
  { name: 'Pennsylvania State University', aliases: ['penn state', 'penn state university', 'psu', 'pennsylvania state university'], domain: 'psu.edu', primary: '#041E42', secondary: '#FFFFFF' },
  { name: 'University of Pennsylvania', aliases: ['upenn', 'university of pennsylvania', 'penn'], domain: 'upenn.edu', primary: '#011F5B', secondary: '#990000' },

  // Add more universities as needed...
];

async function seedUniversityDomains() {
  try {
    console.log('🌱 Starting university domains seed...');
    
    // Connect to database
    await mongoose.connect(config.connectionString);
    console.log('✅ Connected to database');

    let seeded = 0;
    let updated = 0;
    let skipped = 0;

    for (const uni of UNIVERSITY_DATA) {
      // Check if university already exists (by primary name or any alias)
      const existing = await UniversityBranding.findOne({
        $or: [
          { universityName: new RegExp(`^${uni.name}$`, 'i') },
          { universityName: { $in: uni.aliases.map(alias => new RegExp(`^${alias}$`, 'i')) } }
        ]
      });

      if (existing) {
        // Update existing entry if domain or colors are different
        let needsUpdate = false;
        const updates = {};

        if (existing.domain !== uni.domain) {
          updates.domain = uni.domain;
          updates.logoUrl = `https://logo.clearbit.com/${uni.domain}?size=128`;
          needsUpdate = true;
        }

        if (existing.primaryColor !== uni.primary) {
          updates.primaryColor = uni.primary;
          needsUpdate = true;
        }

        if (existing.secondaryColor !== uni.secondary) {
          updates.secondaryColor = uni.secondary;
          needsUpdate = true;
        }

        if (uni.textColor && existing.textColor !== uni.textColor) {
          updates.textColor = uni.textColor;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await UniversityBranding.findByIdAndUpdate(existing._id, updates);
          console.log(`🔄 Updated: ${uni.name} -> ${uni.domain}`);
          updated++;
        } else {
          console.log(`⏭️  Skipped: ${uni.name} (already exists)`);
          skipped++;
        }
      } else {
        // Create new entry
        await UniversityBranding.create({
          universityName: uni.name,
          displayName: uni.name,
          domain: uni.domain,
          logoUrl: `https://logo.clearbit.com/${uni.domain}?size=128`,
          primaryColor: uni.primary,
          secondaryColor: uni.secondary,
          textColor: uni.textColor || '#FFFFFF',
          fetchCount: 0
        });
        console.log(`✅ Seeded: ${uni.name} -> ${uni.domain}`);
        seeded++;
      }
    }

    console.log('\n🎉 Seed completed!');
    console.log(`📊 Stats: ${seeded} seeded, ${updated} updated, ${skipped} skipped`);
    console.log(`📈 Total universities in database: ${seeded + updated + skipped}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seedUniversityDomains();
}

module.exports = { seedUniversityDomains, UNIVERSITY_DATA };











