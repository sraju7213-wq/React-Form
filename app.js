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

const touchedFields = new Set();
let showAllValidationErrors = false;

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
    element.addEventListener('blur', () => {
      markFieldTouched(element.name);
      runCustomValidations();
    });
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
  if (e.target.name) {
    markFieldTouched(e.target.name);
  }
  updateBookingState(e);
  updateSummary();
  updatePriceEstimation();
  if (e.target.name === 'vehicle') {
    updateVehiclePreview();
  }
  runCustomValidations();
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
  runCustomValidations();
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
  if (wantDecoration) {
    markFieldTouched('wantDecoration');
  }
  runCustomValidations();
}

function toggleNamePlateFields() {
  const wantNamePlate = document.querySelector('input[name="wantNamePlate"]:checked')?.value;
  bookingState.wantNamePlate = wantNamePlate || 'No';

  if (wantNamePlate === 'Yes') {
    namePlateGroup.classList.remove('hidden');
    markFieldTouched('namePlateDetails');
  } else {
    namePlateGroup.classList.add('hidden');
    const namePlateInput = document.querySelector('input[name="namePlateDetails"]');
    namePlateInput.value = '';
    bookingState.namePlateDetails = '';
  }
  updateSummary();
  if (wantNamePlate) {
    markFieldTouched('wantNamePlate');
  }
  runCustomValidations();
}

function toggleSelfDriveRequirements() {
  const drivingOption = document.querySelector('input[name="drivingOption"]:checked')?.value;
  if (drivingOption === 'SELF_DRIVE') {
    selfDriveReq.classList.remove('hidden');
  } else {
    selfDriveReq.classList.add('hidden');
  }
  if (drivingOption) {
    markFieldTouched('drivingOption');
  }
  runCustomValidations();
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

  showAllValidationErrors = true;
  const customValid = runCustomValidations();

  if (!customValid || !form.checkValidity()) {
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

  runCustomValidations();
});

function runCustomValidations() {
  if (!form) {
    return true;
  }

  let isValid = true;

  const additionalDetailsMessage = 'Please complete all additional details before continuing.';
  const locationMessage = 'Please enter your location or PIN code.';
  const phoneRequiredMessage = 'Phone number is required.';
  const nameRequiredMessage = 'Name is required.';
  const drivingOptionMessage = 'Please select your driving option.';

  const wantDecorationRadios = Array.from(document.querySelectorAll('input[name="wantDecoration"]'));
  if (wantDecorationRadios.length) {
    const isChecked = wantDecorationRadios.some(radio => radio.checked);
    if (!isChecked) {
      isValid = false;
    }
    updateRadioGroupValidity(
      wantDecorationRadios,
      isChecked ? '' : additionalDetailsMessage,
      shouldShowErrorForField('wantDecoration')
    );
  }

  const wantDecorationValue = document.querySelector('input[name="wantDecoration"]:checked')?.value;
  const decorationTypeGroup = document.getElementById('decorationTypeGroup');
  const decorationTypeRadios = Array.from(document.querySelectorAll('input[name="decorationType"]'));
  const shouldValidateDecorationType =
    decorationTypeGroup && !decorationTypeGroup.classList.contains('hidden') && wantDecorationValue === 'Yes';
  if (decorationTypeRadios.length) {
    const decorationChecked = decorationTypeRadios.some(radio => radio.checked);
    if (shouldValidateDecorationType && !decorationChecked) {
      isValid = false;
    }
    updateRadioGroupValidity(
      decorationTypeRadios,
      shouldValidateDecorationType && !decorationChecked ? additionalDetailsMessage : '',
      shouldValidateDecorationType && (shouldShowErrorForField('decorationType') || showAllValidationErrors)
    );
  }

  const wantNamePlateRadios = Array.from(document.querySelectorAll('input[name="wantNamePlate"]'));
  if (wantNamePlateRadios.length) {
    const namePlateChecked = wantNamePlateRadios.some(radio => radio.checked);
    if (!namePlateChecked) {
      isValid = false;
    }
    updateRadioGroupValidity(
      wantNamePlateRadios,
      namePlateChecked ? '' : additionalDetailsMessage,
      shouldShowErrorForField('wantNamePlate')
    );
  }

  const namePlateInput = document.querySelector('input[name="namePlateDetails"]');
  const namePlateGroup = document.getElementById('namePlateGroup');
  if (namePlateInput && namePlateGroup) {
    const requiresNamePlate =
      wantNamePlateRadios.some(radio => radio.checked && radio.value === 'Yes') &&
      !namePlateGroup.classList.contains('hidden');
    const namePlateValue = namePlateInput.value.trim();
    if (requiresNamePlate && !namePlateValue) {
      isValid = false;
    }
    updateFieldValidity(
      namePlateInput,
      requiresNamePlate && !namePlateValue ? additionalDetailsMessage : '',
      {
        showError: requiresNamePlate && (shouldShowErrorForField('namePlateDetails') || showAllValidationErrors)
      }
    );
  }

  ['startLocation', 'endLocation'].forEach(fieldName => {
    const input = document.querySelector(`input[name="${fieldName}"]`);
    if (!input) {
      return;
    }
    const value = input.value.trim();
    const hasValue = Boolean(value);
    const hasPin = /\b\d{6}\b/.test(value);
    if (!hasValue || !hasPin) {
      isValid = false;
    }
    const shouldShow = shouldShowErrorForField(fieldName);
    const message = !hasValue || !hasPin ? locationMessage : '';
    updateFieldValidity(input, message, {showError: shouldShow});
  });

  const fullNameInput = document.querySelector('input[name="fullName"]');
  if (fullNameInput) {
    const fullNameValue = fullNameInput.value.trim();
    if (!fullNameValue) {
      isValid = false;
    }
    updateFieldValidity(fullNameInput, fullNameValue ? '' : nameRequiredMessage, {
      showError: shouldShowErrorForField('fullName')
    });
  }

  const phoneInput = document.querySelector('input[name="phone"]');
  if (phoneInput) {
    const phoneValue = phoneInput.value.trim();
    let message = '';
    if (!phoneValue) {
      isValid = false;
      message = phoneRequiredMessage;
    } else if (!validatePhone(phoneValue)) {
      isValid = false;
      message = 'Please enter a 10-digit phone number';
    }
    updateFieldValidity(phoneInput, message, {
      showError: shouldShowErrorForField('phone')
    });
  }

  const drivingRadios = Array.from(document.querySelectorAll('input[name="drivingOption"]'));
  if (drivingRadios.length) {
    const drivingSelected = drivingRadios.some(radio => radio.checked);
    if (!drivingSelected) {
      isValid = false;
    }
    updateRadioGroupValidity(
      drivingRadios,
      drivingSelected ? '' : drivingOptionMessage,
      shouldShowErrorForField('drivingOption')
    );
  }

  return isValid;
}

function updateFieldValidity(input, message, {showError = true} = {}) {
  if (!input) {
    return;
  }

  const container = findValidationContainer(input);

  if (message) {
    input.setCustomValidity(message);
    if (showError) {
      input.classList.add('is-invalid');
      if (container) {
        container.classList.add('has-error');
        const errorEl = ensureErrorElement(container);
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
    } else {
      input.classList.remove('is-invalid');
      if (container) {
        container.classList.remove('has-error');
        const errorEl = container.querySelector('.form-error');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('visible');
        }
      }
    }
  } else {
    input.setCustomValidity('');
    input.classList.remove('is-invalid');
    if (container) {
      container.classList.remove('has-error');
      const errorEl = container.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }
  }
}

function updateRadioGroupValidity(radios, message, showError = true) {
  if (!radios.length) {
    return;
  }

  const firstRadio = radios[0];
  const container = findValidationContainer(firstRadio);
  const radioGroupElement = container?.querySelector('.radio-group') || firstRadio.closest('.radio-group');

  if (message) {
    firstRadio.setCustomValidity(message);
    if (showError) {
      if (radioGroupElement) {
        radioGroupElement.classList.add('is-invalid');
      }
      radios.forEach(radio => radio.classList.add('is-invalid'));
      if (container) {
        container.classList.add('has-error');
        const errorEl = ensureErrorElement(container);
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
    } else {
      if (radioGroupElement) {
        radioGroupElement.classList.remove('is-invalid');
      }
      radios.forEach(radio => radio.classList.remove('is-invalid'));
      if (container) {
        container.classList.remove('has-error');
        const errorEl = container.querySelector('.form-error');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('visible');
        }
      }
    }
  } else {
    firstRadio.setCustomValidity('');
    if (radioGroupElement) {
      radioGroupElement.classList.remove('is-invalid');
    }
    radios.forEach(radio => radio.classList.remove('is-invalid'));
    if (container) {
      container.classList.remove('has-error');
      const errorEl = container.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }
  }
}

function findValidationContainer(element) {
  if (!element) {
    return null;
  }
  return element.closest('[data-validation-group]') || element.closest('.form-group');
}

function ensureErrorElement(container) {
  let errorEl = container.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    container.appendChild(errorEl);
  }
  return errorEl;
}

function markFieldTouched(name) {
  if (!name) {
    return;
  }
  touchedFields.add(name);
}

function shouldShowErrorForField(name) {
  return showAllValidationErrors || touchedFields.has(name);
}