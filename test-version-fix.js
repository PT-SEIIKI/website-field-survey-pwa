// Test script to verify IndexedDB version fix
// Run this in browser console to test

async function testVersionFix() {
  console.log('Testing IndexedDB version fix...');
  
  try {
    // Clear any existing database instance
    if (window.db) {
      window.db.close();
      window.db = null;
    }
    
    // Import and test the indexeddb module
    const { initDB, getAllPhotos, getFolders, getVillages } = await import('./lib/indexeddb.js');
    
    console.log('1. Testing database initialization...');
    const db = await initDB();
    console.log(`✅ Database initialized successfully with version: ${db.version}`);
    
    console.log('2. Testing getAllPhotos...');
    const photos = await getAllPhotos();
    console.log(`✅ getAllPhotos returned ${photos.length} photos`);
    
    console.log('3. Testing getFolders...');
    const folders = await getFolders();
    console.log(`✅ getFolders returned ${folders.length} folders`);
    
    console.log('4. Testing getVillages...');
    const villages = await getVillages();
    console.log(`✅ getVillages returned ${villages.length} villages`);
    
    console.log('🎉 All version fix tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Version fix test failed:', error);
    return false;
  }
}

// Auto-run test
if (typeof window !== 'undefined') {
  testVersionFix();
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testVersionFix };
}
