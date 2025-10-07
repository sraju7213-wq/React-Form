// Application data
const appData = {
  vehicles: [
    {
      label: "AUDI A6",
      price: 16000,
      image: "https://i.postimg.cc/zfxy8jD7/AUDI-A6.jpg"
    },
    {
      label: "BMW 330 D Convertible",
      price: 26000,
      image: "https://i.postimg.cc/L4nyP974/BMW-330-D-Convertible.jpg"
    },
    {
      label: "BMW 5 Series F10 (Old Shape)",
      price: 16000,
      image: "https://i.postimg.cc/zvgvwYC2/BMW-5-Series-F10-OLD-SHAPE.jpg"
    },
    {
      label: "BMW 520D",
      price: 16000,
      image: "https://i.postimg.cc/26dwqh2j/BMW-520D.jpg"
    },
    {
      label: "BMW 5 SERIES G30 (New Shape)",
      price: 24000,
      image: "https://i.postimg.cc/Hj1xBv3Y/BMW-5-SERIES-G30-New-shape.jpg"
    },
    {
      label: "Mercedes G-Wagon",
      price: 132000,
      image: "https://i.postimg.cc/J7vp5wVN/Mercedes-G-wagon.jpg"
    },
    {
      label: "MERCEDES Maybach",
      price: 85000,
      image: "https://i.postimg.cc/MKBdssqh/MERCEDES-Maybach.jpg"
    },
    {
      label: "MERCEDES S-CLASS S350",
      price: 18000,
      image: "https://i.postimg.cc/cLNTPQJ6/MERCEDES-S-CLASS-S350.jpg"
    },
    {
      label: "Range Rover Sport",
      price: 85000,
      image: "https://i.postimg.cc/rwCgTKdj/Range-Rover-Sport.jpg"
    }
  ],
  decorations: [
    {label: "No", price: 0},
    {label: "Artificial", price: 0},
    {label: "Fresh", price: 7000}
  ],
  srinagarPins: ["190001", "190002", "190003", "190004", "190005", "190006", "190007", "190008", "190009", "190010"]
};

// Application state
let bookingState = {
  enquiryType: '',
  serviceType: '',
  vehicle: null,
  wantDecoration: 'No',
  decorationType: '',
  wantNamePlate: 'No',
  namePlateDetails: '',
  startLocation: '',
  endLocation: '',
  eventDate: '',
  eventTime: '',
  fullName: '',
  email: '',
  phone: '',
  specialRequests: '',
  drivingOption: ''
};

// Extract pin codes from location strings
function extractPinCode(location) {
  const pinCodeRegex = /\b(\d{6})\b/g;
  const matches = location.match(pinCodeRegex);
  return matches ? matches[matches.length - 1] : null; // Return the last 6-digit number found
}

// DOM elements
const form = document.getElementById('bookingForm');
const vehicleSelect = document.getElementById('vehicleSelect');
const decorationTypeGroup = document.getElementById('decorationTypeGroup');
const namePlateGroup = document.getElementById('namePlateGroup');
const selfDriveReq = document.getElementById('selfDriveReq');
const priceEstimation = document.getElementById('priceEstimation');
const summaryContent = document.getElementById('summaryContent');
const whatsappBtn = document.getElementById('whatsappBtn');
const eventDateInput = document.getElementById('eventDate');
const vehiclePreview = document.getElementById('vehiclePreview');
const vehicleImage = document.getElementById('vehicleImage');
const vehicleImageCaption = document.getElementById('vehicleImageCaption');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  populateVehicleOptions();
  setMinDate();
  attachEventListeners();
  updateSummary(); // Initial update
  updateVehiclePreview();
}

function populateVehicleOptions() {
  appData.vehicles.forEach(vehicle => {
    const option = document.createElement('option');
    option.value = JSON.stringify(vehicle);
    option.textContent = `${vehicle.label}`;
    vehicleSelect.appendChild(option);
  });
}

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  eventDateInput.setAttribute('min', today);
}

function attachEventListeners() {
  // Form change listeners for all inputs
  const formElements = form.querySelectorAll('input, select, textarea');
  formElements.forEach(element => {
    element.addEventListener('change', handleFormChange);
    element.addEventListener('input', handleFormInput);
  });
  
  form.addEventListener('submit', handleFormSubmit);
  
  // WhatsApp button
  whatsappBtn.addEventListener('click', generateWhatsAppMessage);
  
  // Conditional field displays
  document.querySelectorAll('input[name="wantDecoration"]').forEach(radio => {
    radio.addEventListener('change', toggleDecorationFields);
  });
  
  document.querySelectorAll('input[name="wantNamePlate"]').forEach(radio => {
    radio.addEventListener('change', toggleNamePlateFields);
  });
  
  document.querySelectorAll('input[name="drivingOption"]').forEach(radio => {
    radio.addEventListener('change', toggleSelfDriveRequirements);
  });
}

function handleFormChange(e) {
  updateBookingState(e);
  updateSummary();
  updatePriceEstimation();
  if (e.target.name === 'vehicle') {
    updateVehiclePreview();
  }
}

function handleFormInput(e) {
  updateBookingState(e);
  updateSummary();
  if (['startLocation', 'endLocation'].includes(e.target.name)) {
    updatePriceEstimation();
  }
  if (e.target.name === 'vehicle') {
    updateVehiclePreview();
  }
}

function updateBookingState(e) {
  const { name, value, type } = e.target;
  
  if (type === 'radio') {
    bookingState[name] = value;
  } else if (name === 'vehicle') {
    try {
      bookingState.vehicle = value ? JSON.parse(value) : null;
    } catch (error) {
      bookingState.vehicle = null;
    }
  } else {
    bookingState[name] = value;
  }
}

function updateVehiclePreview() {
  if (!vehiclePreview || !vehicleImage || !vehicleImageCaption) {
    return;
  }

  if (bookingState.vehicle && bookingState.vehicle.image) {
    vehiclePreview.classList.remove('hidden');
    vehicleImage.src = bookingState.vehicle.image;
    vehicleImage.alt = `${bookingState.vehicle.label} - Valley Wedding Cars`;
    vehicleImageCaption.textContent = bookingState.vehicle.label;
  } else {
    vehiclePreview.classList.add('hidden');
    vehicleImage.src = '';
    vehicleImage.alt = '';
    vehicleImageCaption.textContent = '';
  }
}

function toggleDecorationFields() {
  const wantDecoration = document.querySelector('input[name="wantDecoration"]:checked')?.value;
  bookingState.wantDecoration = wantDecoration || 'No';
  
  if (wantDecoration === 'Yes') {
    decorationTypeGroup.classList.remove('hidden');
    // Auto-select Artificial as default
    const artificialRadio = document.querySelector('input[name="decorationType"][value="Artificial"]');
    if (artificialRadio && !document.querySelector('input[name="decorationType"]:checked')) {
      artificialRadio.checked = true;
      bookingState.decorationType = 'Artificial';
    }
  } else {
    decorationTypeGroup.classList.add('hidden');
    document.querySelectorAll('input[name="decorationType"]').forEach(radio => {
      radio.checked = false;
    });
    bookingState.decorationType = '';
  }
  updateSummary();
  updatePriceEstimation();
}

function toggleNamePlateFields() {
  const wantNamePlate = document.querySelector('input[name="wantNamePlate"]:checked')?.value;
  bookingState.wantNamePlate = wantNamePlate || 'No';
  
  if (wantNamePlate === 'Yes') {
    namePlateGroup.classList.remove('hidden');
  } else {
    namePlateGroup.classList.add('hidden');
    const namePlateInput = document.querySelector('input[name="namePlateDetails"]');
    namePlateInput.value = '';
    bookingState.namePlateDetails = '';
  }
  updateSummary();
}

function toggleSelfDriveRequirements() {
  const drivingOption = document.querySelector('input[name="drivingOption"]:checked')?.value;
  if (drivingOption === 'SELF_DRIVE') {
    selfDriveReq.classList.remove('hidden');
  } else {
    selfDriveReq.classList.add('hidden');
  }
}

function updateSummary() {
  let summaryHtml = '';
  
  if (bookingState.enquiryType) {
    summaryHtml += createSummaryItem('Enquiry Type', bookingState.enquiryType);
  }
  
  if (bookingState.serviceType) {
    summaryHtml += createSummaryItem('Service', bookingState.serviceType);
  }
  
  if (bookingState.startLocation) {
    summaryHtml += createSummaryItem('Start', bookingState.startLocation);
  }
  
  if (bookingState.endLocation) {
    summaryHtml += createSummaryItem('End', bookingState.endLocation);
  }
  
  if (bookingState.vehicle) {
    summaryHtml += createSummaryItem('Vehicle', bookingState.vehicle.label);
  }
  
  if (bookingState.eventDate) {
    const formattedDate = new Date(bookingState.eventDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    summaryHtml += createSummaryItem('Date', formattedDate);
  }
  
  if (bookingState.eventTime) {
    const formattedTime = new Date(`2000-01-01T${bookingState.eventTime}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    summaryHtml += createSummaryItem('Event Time', formattedTime);
  }
  
  if (bookingState.fullName) {
    summaryHtml += createSummaryItem('Name', bookingState.fullName);
  }
  
  if (bookingState.phone) {
    summaryHtml += createSummaryItem('Phone', bookingState.phone);
  }
  
  if (bookingState.email) {
    summaryHtml += createSummaryItem('Email', bookingState.email);
  }
  
  if (bookingState.drivingOption) {
    const drivingText = bookingState.drivingOption === 'WITH_DRIVER' ? 'Need With Driver' : 'Self Drive';
    summaryHtml += createSummaryItem('Driving', drivingText);
  }
  
  if (bookingState.wantDecoration === 'Yes' && bookingState.decorationType) {
    summaryHtml += createSummaryItem('Decoration', bookingState.decorationType);
  } else if (bookingState.wantDecoration === 'No') {
    summaryHtml += createSummaryItem('Decoration', 'No');
  }
  
  if (bookingState.wantNamePlate === 'Yes' && bookingState.namePlateDetails) {
    summaryHtml += createSummaryItem('Name Plate', bookingState.namePlateDetails);
  } else if (bookingState.wantNamePlate === 'No') {
    summaryHtml += createSummaryItem('Name Plate', 'No');
  }
  
  if (bookingState.specialRequests) {
    summaryHtml += createSummaryItem('Message', bookingState.specialRequests);
  }
  
  summaryContent.innerHTML = summaryHtml || '<p class="empty-state">Fill out the form to see your booking summary</p>';
}

function createSummaryItem(label, value) {
  return `
    <div class="summary-item">
      <span class="summary-label">${label}:</span>
      <span class="summary-value">${value}</span>
    </div>
  `;
}

function updatePriceEstimation() {
  if (!bookingState.vehicle) {
    priceEstimation.classList.add('hidden');
    return;
  }
  
  // Show price estimation section
  priceEstimation.classList.remove('hidden');
  
  let vehiclePrice = bookingState.vehicle.price;
  let decorationPrice = 0;
  
  if (bookingState.wantDecoration === 'Yes' && bookingState.decorationType === 'Fresh') {
    decorationPrice = 7000;
  }
  
  let basePrice = vehiclePrice + decorationPrice;
  let discount = 0;
  let surcharge = 0;
  let totalPrice = basePrice;
  
  // Extract pin codes from locations
  const startPinCode = extractPinCode(bookingState.startLocation);
  const endPinCode = extractPinCode(bookingState.endLocation);
  
  // Check for Srinagar discount or outside surcharge
  const startInSrinagar = startPinCode && appData.srinagarPins.includes(startPinCode);
  const endInSrinagar = endPinCode && appData.srinagarPins.includes(endPinCode);
  
  const discountRow = document.getElementById('discountRow');
  const surchargeRow = document.getElementById('surchargeRow');
  
  if (startPinCode && endPinCode) {
    if (startInSrinagar && endInSrinagar) {
      // Both locations in Srinagar - 15% discount
      discount = Math.round(basePrice * 0.15);
      totalPrice = basePrice - discount;
      discountRow.style.display = 'flex';
      surchargeRow.style.display = 'none';
    } else if (!startInSrinagar || !endInSrinagar) {
      // Any location outside Srinagar - 10% surcharge
      surcharge = Math.round(basePrice * 0.10);
      totalPrice = basePrice + surcharge;
      surchargeRow.style.display = 'flex';
      discountRow.style.display = 'none';
    } else {
      discountRow.style.display = 'none';
      surchargeRow.style.display = 'none';
    }
  } else {
    discountRow.style.display = 'none';
    surchargeRow.style.display = 'none';
  }
  
  // Update price display
  document.getElementById('vehiclePrice').textContent = `₹${vehiclePrice.toLocaleString('en-IN')}`;
  document.getElementById('decorationPrice').textContent = `₹${decorationPrice.toLocaleString('en-IN')}`;
  document.getElementById('discountAmount').textContent = `-₹${discount.toLocaleString('en-IN')}`;
  document.getElementById('surchargeAmount').textContent = `+₹${surcharge.toLocaleString('en-IN')}`;
  document.getElementById('totalPrice').textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
}

function generateWhatsAppMessage() {
  if (!bookingState.vehicle || !bookingState.fullName || !bookingState.phone) {
    alert('Please fill in at least vehicle selection, name, and phone number to generate WhatsApp message.');
    return;
  }
  
  let message = `*Valley Wedding Cars - Booking Request*\n\n`;
  message += `*Customer Details:*\n`;
  message += `Name: ${bookingState.fullName}\n`;
  message += `Phone: ${bookingState.phone}\n`;
  if (bookingState.email) message += `Email: ${bookingState.email}\n`;
  
  message += `\n*Booking Details:*\n`;
  message += `Enquiry Type: ${bookingState.enquiryType || 'Not specified'}\n`;
  message += `Service Type: ${bookingState.serviceType || 'Not specified'}\n`;
  message += `Vehicle: ${bookingState.vehicle.label}\n`;
  
  if (bookingState.wantDecoration === 'Yes' && bookingState.decorationType) {
    message += `Decoration: ${bookingState.decorationType}\n`;
  }
  
  if (bookingState.wantNamePlate === 'Yes' && bookingState.namePlateDetails) {
    message += `Name Plate: ${bookingState.namePlateDetails}\n`;
  }
  
  if (bookingState.startLocation) {
    message += `Start Location: ${bookingState.startLocation}\n`;
  }
  
  if (bookingState.endLocation) {
    message += `End Location: ${bookingState.endLocation}\n`;
  }
  
  if (bookingState.eventDate) {
    const formattedDate = new Date(bookingState.eventDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    message += `Event Date: ${formattedDate}\n`;
  }
  
  if (bookingState.eventTime) {
    const formattedTime = new Date(`2000-01-01T${bookingState.eventTime}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    message += `Event Time: ${formattedTime}\n`;
  }
  
  if (bookingState.drivingOption) {
    const drivingText = bookingState.drivingOption === 'WITH_DRIVER' ? 'With Driver' : 'Self Drive';
    message += `Driving Option: ${drivingText}\n`;
  }
  
  // Price breakdown
  message += `\n*Price Breakdown:*\n`;
  let vehiclePrice = bookingState.vehicle.price;
  let decorationPrice = 0;
  
  if (bookingState.wantDecoration === 'Yes' && bookingState.decorationType === 'Fresh') {
    decorationPrice = 7000;
  }
  
  let basePrice = vehiclePrice + decorationPrice;
  let discount = 0;
  let surcharge = 0;
  let totalPrice = basePrice;
  
  message += `Vehicle Cost: ₹${vehiclePrice.toLocaleString('en-IN')}\n`;
  if (decorationPrice > 0) {
    message += `Decoration Cost: ₹${decorationPrice.toLocaleString('en-IN')}\n`;
  }
  
  // Extract pin codes from locations
  const startPinCode = extractPinCode(bookingState.startLocation);
  const endPinCode = extractPinCode(bookingState.endLocation);
  
  // Check for Srinagar discount or outside surcharge
  const startInSrinagar = startPinCode && appData.srinagarPins.includes(startPinCode);
  const endInSrinagar = endPinCode && appData.srinagarPins.includes(endPinCode);
  
  if (startPinCode && endPinCode) {
    if (startInSrinagar && endInSrinagar) {
      discount = Math.round(basePrice * 0.15);
      totalPrice = basePrice - discount;
      message += `Srinagar Discount (15%): -₹${discount.toLocaleString('en-IN')}\n`;
    } else if (!startInSrinagar || !endInSrinagar) {
      surcharge = Math.round(basePrice * 0.10);
      totalPrice = basePrice + surcharge;
      message += `Outside Srinagar Surcharge (10%): +₹${surcharge.toLocaleString('en-IN')}\n`;
    }
  }
  
  message += `*Total Amount: ₹${totalPrice.toLocaleString('en-IN')}*\n`;
  
  if (bookingState.specialRequests) {
    message += `\n*Special Requests:*\n${bookingState.specialRequests}\n`;
  }
  
  message += `\nPlease confirm the booking details and let me know if any changes are needed.`;
  
  // Generate WhatsApp URL
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Show success message
  alert('Booking request submitted successfully! You can also use the WhatsApp button to send your booking details directly.');
}

// Form validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

// Add real-time validation feedback
document.addEventListener('input', function(e) {
  if (e.target.type === 'email') {
    if (e.target.value && !validateEmail(e.target.value)) {
      e.target.setCustomValidity('Please enter a valid email address');
    } else {
      e.target.setCustomValidity('');
    }
  }
  
  if (e.target.name === 'phone') {
    if (e.target.value && !validatePhone(e.target.value)) {
      e.target.setCustomValidity('Please enter a 10-digit phone number');
    } else {
      e.target.setCustomValidity('');
    }
  }
});