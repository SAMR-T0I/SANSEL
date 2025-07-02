// ESP32 IP Address (change this to your ESP32's IP)
const ESP32_IP = "192.168.0.19"; 

// Unit mappings
const UNITS = ['', '°C', '°F', 'mA', 'V', '%', 'kg', 'lb', 'kPa', 'psi', 'L/min'];

// Current device data
let deviceData = {
  processValue: 0,
  unitValue: 0,
  resolution: 0,
  relay1: 0,
  relay2: 0,
  out1Low: 0,
  out1High: 0
};

// Load dashboard view by default
window.onload = function() {
  fetchData();
  setInterval(fetchData, 1000);
};

// View switching functions
function loadSettings() {
  document.querySelector('.process-indicator').style.display = 'none';
  document.getElementById('settings-view').style.display = 'block';
  document.getElementById('calibration-view').style.display = 'none';
  updateNav('settings');
}

function loadDashboard() {
  document.querySelector('.process-indicator').style.display = 'block';
  document.getElementById('settings-view').style.display = 'none';
  document.getElementById('calibration-view').style.display = 'none';
  updateNav('dashboard');
}

function loadCalibration() {
  document.querySelector('.process-indicator').style.display = 'none';
  document.getElementById('settings-view').style.display = 'none';
  document.getElementById('calibration-view').style.display = 'block';
  updateNav('calibration');
}

function updateNav(activeView) {
  document.querySelectorAll('.nav a').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`.nav a:nth-child(${
    activeView === 'dashboard' ? 1 : 
    activeView === 'settings' ? 2 : 3
  })`).classList.add('active');
}

// API Communication
async function fetchData() {
  try {
    const response = await fetch(`http://${ESP32_IP}/data`);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    deviceData = {...deviceData, ...data};
    updateUI();
  } catch (error) {
    console.error('Fetch error:', error);
    document.getElementById('processValue').textContent = 'ERR';
  }
}

async function saveSetting(register, elementId) {
  const value = document.getElementById(elementId).value;
  const statusElement = document.getElementById(`${elementId}-status`);
  
  if (!value) {
    statusElement.textContent = "Please enter a value";
    statusElement.style.color = "red";
    return;
  }

  statusElement.textContent = "Saving...";
  statusElement.style.color = "blue";

  try {
    const response = await fetch(
      `http://${ESP32_IP}/write?register=${register}&value=${value}`
    );
    
    if (response.ok) {
      statusElement.textContent = "✓ Saved";
      statusElement.style.color = "green";
      setTimeout(() => statusElement.textContent = "", 2000);
      fetchData(); // Refresh data
    } else {
      throw new Error('Save failed');
    }
  } catch (error) {
    statusElement.textContent = "✗ Error";
    statusElement.style.color = "red";
    console.error('Save error:', error);
  }
}

// UI Update
function updateUI() {
  const { processValue, resolution, unitValue, relay1, relay2, out1Low, out1High } = deviceData;
  
  // Update displayed value
  const displayValue = (processValue / Math.pow(10, resolution)).toFixed(resolution);
  document.getElementById('processValue').textContent = displayValue;
  document.getElementById('unitValue').textContent = UNITS[unitValue] || '';
  
  // Update relay indicators
  document.getElementById('relay1-led').className = relay1 ? 'led on' : 'led';
  document.getElementById('relay2-led').className = relay2 ? 'led on' : 'led';
  
  // Update alarm state
  const isAlarm = processValue < out1Low || processValue > out1High;
  document.getElementById('alm-led').className = isAlarm ? 'led alarm' : 'led';
  
  // Update temperature unit indicators
  document.getElementById('c-led').className = unitValue === 1 ? 'led on' : 'led';
  document.getElementById('f-led').className = unitValue === 2 ? 'led on' : 'led';
  
  // Update settings fields if visible
  if (document.getElementById('settings-view').style.display === 'block') {
    document.getElementById('out1Low').value = out1Low;
    // Add other setting fields as needed
  }
}
