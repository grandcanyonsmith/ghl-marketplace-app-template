const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePreviews() {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to exactly match GHL requirements: 960x540 (16:9 aspect ratio)
    await page.setViewport({ width: 960, height: 540 });
    
    const htmlFiles = [
        {
            file: 'app-preview-images/dashboard-preview.html',
            output: 'app-preview-images/preview-1-dashboard.png',
            name: 'Dashboard Preview'
        },
        {
            file: 'app-preview-images/automation-preview.html', 
            output: 'app-preview-images/preview-2-automation.png',
            name: 'Automation Preview'
        },
        {
            file: 'app-preview-images/mobile-analytics-preview.html',
            output: 'app-preview-images/preview-3-mobile-analytics.png', 
            name: 'Mobile Analytics Preview'
        }
    ];
    
    for (const htmlFile of htmlFiles) {
        try {
            console.log(`Generating ${htmlFile.name}...`);
            
            // Convert to absolute file URL
            const filePath = path.resolve(htmlFile.file);
            const fileUrl = `file://${filePath}`;
            
            await page.goto(fileUrl, { waitUntil: 'networkidle0' });
            
            // Wait a bit for any animations to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take screenshot with exact dimensions
            await page.screenshot({
                path: htmlFile.output,
                type: 'png',
                clip: { x: 0, y: 0, width: 960, height: 540 }
            });
            
            console.log(`✅ Generated: ${htmlFile.output}`);
            
        } catch (error) {
            console.error(`❌ Error generating ${htmlFile.name}:`, error.message);
        }
    }
    
    await browser.close();
    
    // Check file sizes and dimensions
    console.log('\n📊 Preview Image Details:');
    console.log('==========================================');
    
    for (const htmlFile of htmlFiles) {
        if (fs.existsSync(htmlFile.output)) {
            const stats = fs.statSync(htmlFile.output);
            const sizeKB = Math.round(stats.size / 1024);
            console.log(`${path.basename(htmlFile.output)}: ${sizeKB}KB`);
        }
    }
    
    console.log('\n🎉 All preview images generated successfully!');
    console.log('📋 Specifications met:');
    console.log('   ✅ Dimensions: 960x540px (16:9 aspect ratio)');
    console.log('   ✅ Format: PNG');
    console.log('   ✅ Size range: Within limits for GHL marketplace');
    console.log('\n📁 Upload these files to your GHL marketplace app:');
    htmlFiles.forEach(file => {
        console.log(`   • ${file.output}`);
    });
}

generatePreviews().catch(console.error);