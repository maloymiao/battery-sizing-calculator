// Exide Battery Tech Specification Database Table
const batteryDatabase = {
  "XP800":  { ah: 80,  cca: 530 },
  "XP1000": { ah: 100, cca: 580 },
  "XP1300": { ah: 130, cca: 720 },
  "XP1500": { ah: 150, cca: 785 },
  "XP1700": { ah: 170, cca: 900 },
  "XP1800": { ah: 180, cca: 1050 },
  "XP2000": { ah: 200, cca: 1150 }
};

function calculateSizing() {
  // Inputs fetching
  const factorA = parseFloat(document.getElementById('soc').value) || 0;
  const factorB = parseFloat(document.getElementById('duration').value) || 0;
  const factorC = parseFloat(document.getElementById('efficiency').value) || 0;
  
  const voltage = parseFloat(document.getElementById('voltage').value) || 1;
  const ratingKW = parseFloat(document.getElementById('rating').value) || 0;
  const numStarters = parseInt(document.getElementById('starters').value) || 0;
  
  const auxLoad = parseFloat(document.getElementById('aux-load').value) || 0;
  const backupHours = parseFloat(document.getElementById('backup-time').value) || 0;
  
  const selectedModel = document.getElementById('battery-model').value;
  const parallelCount = parseInt(document.getElementById('parallel-count').value) || 1;

  // 1. Calculations matching spreadsheet formulas
  const baseCrankingCurrent = ((ratingKW * 1000) / voltage) * numStarters;
  const crankingCurrentReq = baseCrankingCurrent * factorA * factorB * factorC;
  const totalAuxAh = auxLoad * backupHours;

  // Dynamic Toggle Logic for Custom Field Inputs
  const customContainer = document.getElementById('custom-inputs-container');
  let specAh = 0;
  let specCca = 0;

  if (selectedModel === "CUSTOM") {
    customContainer.style.display = "block";
    specAh = parseFloat(document.getElementById('custom-ah').value) || 0;
    specCca = parseFloat(document.getElementById('custom-cca').value) || 0;
  } else {
    customContainer.style.display = "none";
    specAh = batteryDatabase[selectedModel].ah;
    specCca = batteryDatabase[selectedModel].cca;
  }
  
  // 2. Bank Math using the resolved battery specifications
  const totalSystemCca = specCca * parallelCount;
  const totalSystemAh = specAh * parallelCount;
  const totalQuantity = (voltage / 12) * parallelCount;

  // 3. Output generation values to interface windows
  document.getElementById('out-base-cranking').innerText = baseCrankingCurrent.toFixed(2);
  document.getElementById('out-req-cranking').innerText = crankingCurrentReq.toFixed(2);
  document.getElementById('out-req-aux').innerText = totalAuxAh.toFixed(2);
  
  document.getElementById('out-sys-cca').innerText = totalSystemCca;
  document.getElementById('out-sys-ah').innerText = totalSystemAh;
  document.getElementById('out-qty').innerText = Math.ceil(totalQuantity);

  // 4. Automated Compliance Logic Status (Pass/Fail)
  const statusDiv = document.getElementById('suitability-status');
  if (totalSystemCca >= crankingCurrentReq && totalSystemAh >= totalAuxAh) {
    statusDiv.innerText = "✅ SAFE / PASS";
    statusDiv.className = "status-box pass";
  } else {
    statusDiv.innerText = "❌ INSUFFICIENT CAPACITY";
    statusDiv.className = "status-box fail";
  }

  // Save text tracking indicators for clean PDF printing placeholder conversion
  document.querySelectorAll('.input-row').forEach(row => {
    const field = row.querySelector('input, select');
    if (field) {
      if (field.tagName === 'SELECT') {
        row.setAttribute('data-print-value', field.options[field.selectedIndex].text);
      } else {
        row.setAttribute('data-print-value', field.value);
      }
    }
  });
}

// Reset Button Execution Logic
document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('soc').value = "1.3";
  document.getElementById('duration').value = "1.15";
  document.getElementById('efficiency').value = "1.2";
  document.getElementById('voltage').value = "24";
  document.getElementById('rating').value = "8.9";
  document.getElementById('starters').value = "2";
  document.getElementById('aux-load').value = "3";
  document.getElementById('backup-time').value = "4";
  document.getElementById('battery-model').value = "XP1300";
  document.getElementById('parallel-count').value = "2";
  calculateSizing();
});

// UPGRADED: Print PDF Handler with Automated File Name Generator
document.getElementById('pdf-btn').addEventListener('click', () => {
  // 1. Fetch current Motor Rating value
  const kwRating = document.getElementById('rating').value || "0";
  
  // 2. Generate Real-time Date Stamp Strings
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const dateStamp = `${year}${month}${day}`;
  const timeStamp = `${hours}${minutes}`;
  
  // 3. Temporarily change the document title right before printing launches
  const originalTitle = document.title;
  document.title = `BatterySizing_${kwRating}kW_${dateStamp}_${timeStamp}`;
  
  // 4. Fire print engine frame
  window.print();
  
  // 5. Restore original tab title smoothly immediately after the print overlay finishes compiling
  setTimeout(() => {
    document.title = originalTitle;
  }, 100);
});

// Attach event listeners to all input variables for instant calculations on change
document.querySelectorAll('input, select').forEach(element => {
  element.addEventListener('input', calculateSizing);
});

// Run calculation loop once on initial startup
calculateSizing();