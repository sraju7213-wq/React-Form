import './style.css';
import type { Car, PriceEstimate } from '../shared/types';

type DecorationType = 'Artificial' | 'Fresh' | '';

type BookingState = {
  enquiryType: string;
  serviceType: string;
  carId: string | null;
  carName: string | null;
  wantDecoration: 'Yes' | 'No';
  decorationType: DecorationType;
  wantNamePlate: 'Yes' | 'No';
  namePlateDetails: string;
  startLocation: string;
  endLocation: string;
  kms: number;
  eventDate: string;
  eventTime: string;
  fullName: string;
  email: string;
  phone: string;
  specialRequests: string;
  drivingOption: 'WITH_DRIVER' | 'SELF_DRIVE' | '';
};

type EstimateSnapshot = {
  server: PriceEstimate;
  decoration: number;
  total: number;
};

const API_BASE = '/api';
const SRINAGAR_PINS = [
  '190001',
  '190002',
  '190003',
  '190004',
  '190005',
  '190006',
  '190007',
  '190008',
  '190009',
  '190010',
];

const DECORATION_PRICING: Record<string, number> = {
  No: 0,
  Artificial: 0,
  Fresh: 7000,
};

const state: BookingState = {
  enquiryType: '',
  serviceType: '',
  carId: null,
  carName: null,
  wantDecoration: 'No',
  decorationType: '',
  wantNamePlate: 'No',
  namePlateDetails: '',
  startLocation: '',
  endLocation: '',
  kms: 0,
  eventDate: '',
  eventTime: '',
  fullName: '',
  email: '',
  phone: '',
  specialRequests: '',
  drivingOption: '',
};

let cars: Car[] = [];
let latestEstimate: EstimateSnapshot | null = null;
let estimateController: AbortController | null = null;

const form = document.getElementById('bookingForm') as HTMLFormElement | null;
const vehicleSelect = document.getElementById('vehicleSelect') as HTMLSelectElement | null;
const decorationTypeGroup = document.getElementById('decorationTypeGroup');
const namePlateGroup = document.getElementById('namePlateGroup');
const selfDriveReq = document.getElementById('selfDriveReq');
const priceEstimationCard = document.getElementById('priceEstimation');
const summaryContent = document.getElementById('summaryContent');
const whatsappBtn = document.getElementById('whatsappBtn');
const eventDateInput = document.getElementById('eventDate') as HTMLInputElement | null;
const vehiclePreview = document.getElementById('vehiclePreview');
const vehicleImage = document.getElementById('vehicleImage') as HTMLImageElement | null;
const vehicleImageCaption = document.getElementById('vehicleImageCaption');
const basePriceEl = document.getElementById('basePrice');
const distancePriceEl = document.getElementById('distancePrice');
const totalPriceEl = document.getElementById('totalPrice');
const adjustmentsListEl = document.getElementById('adjustmentsList');
const kmsInput = document.getElementById('estimatedKms') as HTMLInputElement | null;

const ensureElements = () => {
  if (!form || !vehicleSelect || !summaryContent || !whatsappBtn) {
    throw new Error('Required form elements missing');
  }
};

const extractPinCode = (value: string): string | null => {
  const match = value.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
};

const determineScope = (): 'srinagar' | 'outside_srinagar' => {
  const startPin = extractPinCode(state.startLocation);
  const endPin = extractPinCode(state.endLocation);
  if (!startPin || !endPin) {
    return 'srinagar';
  }
  const inSrinagar = SRINAGAR_PINS.includes(startPin) && SRINAGAR_PINS.includes(endPin);
  return inSrinagar ? 'srinagar' : 'outside_srinagar';
};

const decorationCost = (): number => {
  if (state.wantDecoration !== 'Yes') {
    return 0;
  }
  const type = state.decorationType || 'Artificial';
  return DECORATION_PRICING[type] ?? 0;
};

const setMinDate = () => {
  if (!eventDateInput) {
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  eventDateInput.min = today;
};

const formatCurrency = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString('en-IN')}`;

const populateVehicleOptions = () => {
  if (!vehicleSelect) {
    return;
  }
  vehicleSelect.innerHTML = '<option value="">Choose a vehicle...</option>';
  cars.forEach((car) => {
    const option = document.createElement('option');
    option.value = car.id;
    option.textContent = car.name;
    vehicleSelect.appendChild(option);
  });
  if (state.carId) {
    const exists = cars.some((car) => car.id === state.carId);
    if (!exists && cars.length) {
      state.carId = cars[0].id;
      state.carName = cars[0].name;
    }
    if (state.carId) {
      vehicleSelect.value = state.carId;
    }
  }
  updateVehiclePreview();
};

const updateVehiclePreview = () => {
  if (!vehiclePreview || !vehicleImage || !vehicleImageCaption) {
    return;
  }
  const car = cars.find((item) => item.id === state.carId) ?? null;
  if (car && car.image_url) {
    vehiclePreview.classList.remove('hidden');
    vehicleImage.src = car.image_url;
    vehicleImage.alt = `${car.name} - Valley Wedding Cars`;
    vehicleImageCaption.textContent = car.name;
  } else {
    vehiclePreview.classList.add('hidden');
    vehicleImage.src = '';
    vehicleImage.alt = '';
    vehicleImageCaption.textContent = '';
  }
};

const updateSummary = () => {
  if (!summaryContent) {
    return;
  }
  const summaryItems: string[] = [];
  if (state.enquiryType) summaryItems.push(createSummaryItem('Enquiry Type', state.enquiryType));
  if (state.serviceType) summaryItems.push(createSummaryItem('Service', state.serviceType));
  if (state.startLocation) summaryItems.push(createSummaryItem('Start', state.startLocation));
  if (state.endLocation) summaryItems.push(createSummaryItem('End', state.endLocation));
  if (state.carName) summaryItems.push(createSummaryItem('Vehicle', state.carName));
  if (state.eventDate) {
    const formatted = new Date(state.eventDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    summaryItems.push(createSummaryItem('Date', formatted));
  }
  if (state.eventTime) {
    const formatted = new Date(`2000-01-01T${state.eventTime}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    summaryItems.push(createSummaryItem('Event Time', formatted));
  }
  if (state.fullName) summaryItems.push(createSummaryItem('Name', state.fullName));
  if (state.phone) summaryItems.push(createSummaryItem('Phone', state.phone));
  if (state.email) summaryItems.push(createSummaryItem('Email', state.email));
  if (state.drivingOption) {
    const drivingText = state.drivingOption === 'WITH_DRIVER' ? 'Need With Driver' : 'Self Drive';
    summaryItems.push(createSummaryItem('Driving', drivingText));
  }
  if (state.wantDecoration === 'Yes') {
    summaryItems.push(createSummaryItem('Decoration', state.decorationType || 'Artificial'));
  } else {
    summaryItems.push(createSummaryItem('Decoration', 'No'));
  }
  if (state.wantNamePlate === 'Yes' && state.namePlateDetails) {
    summaryItems.push(createSummaryItem('Name Plate', state.namePlateDetails));
  } else if (state.wantNamePlate === 'No') {
    summaryItems.push(createSummaryItem('Name Plate', 'No'));
  }
  if (state.specialRequests) {
    summaryItems.push(createSummaryItem('Message', state.specialRequests));
  }
  summaryContent.innerHTML = summaryItems.length
    ? summaryItems.join('')
    : '<p class="empty-state">Fill out the form to see your booking summary</p>';
};

const createSummaryItem = (label: string, value: string) => `
  <div class="summary-item">
    <span class="summary-label">${label}:</span>
    <span class="summary-value">${value}</span>
  </div>
`;

const renderAdjustments = (estimate: PriceEstimate, decoration: number) => {
  if (!adjustmentsListEl) {
    return;
  }
  adjustmentsListEl.innerHTML = '';
  if (estimate.adjustments.length === 0 && decoration <= 0) {
    const noAdj = document.createElement('div');
    noAdj.className = 'price-item muted';
    noAdj.textContent = 'No additional adjustments';
    adjustmentsListEl.appendChild(noAdj);
    return;
  }

  estimate.adjustments.forEach((adjustment) => {
    const item = document.createElement('div');
    item.className = `price-item ${adjustment.delta >= 0 ? 'surcharge' : 'discount'}`;
    const formattedDelta = `${adjustment.delta >= 0 ? '+' : ''}${formatCurrency(adjustment.delta)}`;
    item.innerHTML = `
      <span>${adjustment.rule_name}</span>
      <span>${formattedDelta}</span>
    `;
    adjustmentsListEl.appendChild(item);
  });

  if (decoration > 0) {
    const decorationItem = document.createElement('div');
    decorationItem.className = 'price-item surcharge';
    decorationItem.innerHTML = `
      <span>Decoration Add-on</span>
      <span>+${formatCurrency(decoration)}</span>
    `;
    adjustmentsListEl.appendChild(decorationItem);
  }
};

const updatePriceEstimation = async () => {
  if (!priceEstimationCard || !state.carId) {
    latestEstimate = null;
    if (priceEstimationCard) {
      priceEstimationCard.classList.add('hidden');
    }
    return;
  }

  priceEstimationCard.classList.remove('hidden');

  if (estimateController) {
    estimateController.abort();
  }
  estimateController = new AbortController();
  try {
    const payload = {
      carId: state.carId,
      kms: state.kms,
      dateISO: state.eventDate || undefined,
      scope: determineScope(),
    };
    const response = await fetch(`${API_BASE}/price-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: estimateController.signal,
    });
    if (!response.ok) {
      throw new Error('Unable to calculate price');
    }
    const data = (await response.json()) as { estimate: PriceEstimate };
    const decoration = decorationCost();
    const total = data.estimate.total + decoration;
    latestEstimate = { server: data.estimate, decoration, total };

    if (basePriceEl) basePriceEl.textContent = formatCurrency(data.estimate.base);
    if (distancePriceEl) {
      distancePriceEl.textContent = formatCurrency(data.estimate.perKmComponent);
    }
    renderAdjustments(data.estimate, decoration);
    if (totalPriceEl) totalPriceEl.textContent = formatCurrency(total);
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    console.error(error);
    latestEstimate = null;
    if (basePriceEl) basePriceEl.textContent = '—';
    if (distancePriceEl) distancePriceEl.textContent = '—';
    if (totalPriceEl) totalPriceEl.textContent = '—';
    if (adjustmentsListEl) {
      adjustmentsListEl.innerHTML = '<div class="price-item muted">Unable to calculate price</div>';
    }
  }
};

const getFieldValue = (element: Element): string => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  if (element instanceof HTMLSelectElement) {
    return element.value;
  }
  return '';
};

const handleStateUpdate = (name: string, value: string) => {
  switch (name) {
    case 'enquiryType':
    case 'serviceType':
    case 'specialRequests':
    case 'fullName':
    case 'email':
    case 'phone':
      (state as Record<string, string>)[name] = value;
      break;
    case 'startLocation':
      state.startLocation = value;
      break;
    case 'endLocation':
      state.endLocation = value;
      break;
    case 'eventDate':
      state.eventDate = value;
      break;
    case 'eventTime':
      state.eventTime = value;
      break;
    case 'wantDecoration':
      state.wantDecoration = value === 'Yes' ? 'Yes' : 'No';
      if (state.wantDecoration === 'No') {
        state.decorationType = '';
      }
      toggleDecorationFields();
      break;
    case 'decorationType':
      state.decorationType = value as DecorationType;
      break;
    case 'wantNamePlate':
      state.wantNamePlate = value === 'Yes' ? 'Yes' : 'No';
      toggleNamePlateFields();
      break;
    case 'namePlateDetails':
      state.namePlateDetails = value;
      break;
    case 'vehicle': {
      const car = cars.find((item) => item.id === value) ?? null;
      state.carId = car ? car.id : null;
      state.carName = car ? car.name : null;
      updateVehiclePreview();
      break;
    }
    case 'estimatedKms':
      state.kms = value ? Math.max(0, Number(value)) : 0;
      break;
    case 'drivingOption':
      state.drivingOption = value as BookingState['drivingOption'];
      toggleSelfDriveRequirements();
      break;
    default:
      break;
  }
};

const toggleDecorationFields = () => {
  if (!decorationTypeGroup) {
    return;
  }
  if (state.wantDecoration === 'Yes') {
    decorationTypeGroup.classList.remove('hidden');
    if (!state.decorationType) {
      state.decorationType = 'Artificial';
      const defaultRadio = decorationTypeGroup.querySelector(
        'input[name="decorationType"][value="Artificial"]',
      ) as HTMLInputElement | null;
      if (defaultRadio) {
        defaultRadio.checked = true;
      }
    }
  } else {
    decorationTypeGroup.classList.add('hidden');
    const radios = decorationTypeGroup.querySelectorAll('input[name="decorationType"]');
    radios.forEach((radio) => {
      if (radio instanceof HTMLInputElement) {
        radio.checked = false;
      }
    });
  }
};

const toggleNamePlateFields = () => {
  if (!namePlateGroup) {
    return;
  }
  if (state.wantNamePlate === 'Yes') {
    namePlateGroup.classList.remove('hidden');
  } else {
    namePlateGroup.classList.add('hidden');
    const input = namePlateGroup.querySelector('input[name="namePlateDetails"]') as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
    state.namePlateDetails = '';
  }
};

const toggleSelfDriveRequirements = () => {
  if (!selfDriveReq) {
    return;
  }
  if (state.drivingOption === 'SELF_DRIVE') {
    selfDriveReq.classList.remove('hidden');
  } else {
    selfDriveReq.classList.add('hidden');
  }
};

const handleFormInput = (event: Event) => {
  const target = event.target as Element | null;
  if (!target || !target.getAttribute) {
    return;
  }
  const name = target.getAttribute('name');
  if (!name) {
    return;
  }
  handleStateUpdate(name, getFieldValue(target));
  updateSummary();
};

const handleFormChange = (event: Event) => {
  const target = event.target as Element | null;
  if (!target) {
    return;
  }
  const name = target.getAttribute('name');
  if (!name) {
    return;
  }
  handleStateUpdate(name, getFieldValue(target));
  updateSummary();
  void updatePriceEstimation();
};

const handleFormSubmit = (event: Event) => {
  event.preventDefault();
  if (!form) {
    return;
  }
  const phoneInput = form.querySelector('input[name="phone"]') as HTMLInputElement | null;
  if (phoneInput && phoneInput.value && !/^\d{10}$/.test(phoneInput.value.trim())) {
    phoneInput.setCustomValidity('Please enter a 10-digit phone number');
  } else if (phoneInput) {
    phoneInput.setCustomValidity('');
  }

  if (!form.reportValidity()) {
    return;
  }

  alert('Thank you! We will reach out shortly.');
};

const generateWhatsAppMessage = () => {
  if (!state.carName || !state.fullName || !state.phone) {
    alert('Please complete vehicle selection, name, and phone number first.');
    return;
  }

  const estimate = latestEstimate;
  let message = `*Valley Wedding Cars - Booking Request*\n\n`;
  message += `*Customer Details:*\n`;
  message += `Name: ${state.fullName}\n`;
  message += `Phone: ${state.phone}\n`;
  if (state.email) message += `Email: ${state.email}\n`;

  message += `\n*Booking Details:*\n`;
  message += `Enquiry Type: ${state.enquiryType || 'Not specified'}\n`;
  message += `Service Type: ${state.serviceType || 'Not specified'}\n`;
  message += `Vehicle: ${state.carName}\n`;
  if (state.wantDecoration === 'Yes') {
    message += `Decoration: ${state.decorationType || 'Artificial'}\n`;
  }
  if (state.wantNamePlate === 'Yes' && state.namePlateDetails) {
    message += `Name Plate: ${state.namePlateDetails}\n`;
  }
  if (state.startLocation) message += `Start Location: ${state.startLocation}\n`;
  if (state.endLocation) message += `End Location: ${state.endLocation}\n`;
  if (state.kms) message += `Estimated Distance: ${state.kms} km\n`;
  if (state.eventDate) {
    const formatted = new Date(state.eventDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    message += `Event Date: ${formatted}\n`;
  }
  if (state.eventTime) {
    const formatted = new Date(`2000-01-01T${state.eventTime}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    message += `Event Time: ${formatted}\n`;
  }
  if (state.drivingOption) {
    const drivingText = state.drivingOption === 'WITH_DRIVER' ? 'With Driver' : 'Self Drive';
    message += `Driving Option: ${drivingText}\n`;
  }

  if (estimate) {
    message += `\n*Price Estimate:*\n`;
    message += `Base Fare: ${formatCurrency(estimate.server.base)}\n`;
    message += `Distance Component: ${formatCurrency(estimate.server.perKmComponent)}\n`;
    estimate.server.adjustments.forEach((adjustment) => {
      const delta = `${adjustment.delta >= 0 ? '+' : ''}${formatCurrency(adjustment.delta)}`;
      message += `${adjustment.rule_name}: ${delta}\n`;
    });
    if (estimate.decoration > 0) {
      message += `Decoration Add-on: +${formatCurrency(estimate.decoration)}\n`;
    }
    message += `Total Estimate: *${formatCurrency(estimate.total)}*\n`;
  }

  if (state.specialRequests) {
    message += `\nSpecial Requests: ${state.specialRequests}\n`;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/917006091511?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

const fetchCars = async () => {
  try {
    const response = await fetch(`${API_BASE}/cars`);
    if (!response.ok) {
      throw new Error('Unable to fetch cars');
    }
    const data = (await response.json()) as { cars: Car[] };
    cars = data.cars;
    populateVehicleOptions();
    if (!state.carId && cars.length) {
      state.carId = cars[0].id;
      state.carName = cars[0].name;
      if (vehicleSelect) {
        vehicleSelect.value = state.carId;
      }
      updateVehiclePreview();
      updateSummary();
    }
    updateSummary();
    void updatePriceEstimation();
  } catch (error) {
    console.error('Failed to load cars', error);
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Unable to load cars';
    option.disabled = true;
    vehicleSelect?.appendChild(option);
  }
};

const attachEventListeners = () => {
  if (!form) {
    return;
  }
  form.addEventListener('input', handleFormInput);
  form.addEventListener('change', handleFormChange);
  form.addEventListener('submit', handleFormSubmit);
  whatsappBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    generateWhatsAppMessage();
  });
};

const initializeStateFromForm = () => {
  if (!form) {
    return;
  }
  const elements = Array.from(form.elements) as Element[];
  elements.forEach((element) => {
    const name = element.getAttribute?.('name');
    if (!name) {
      return;
    }
    if (
      element instanceof HTMLInputElement &&
      element.type === 'radio' &&
      !element.checked
    ) {
      return;
    }
    handleStateUpdate(name, getFieldValue(element));
  });
  updateSummary();
  updateVehiclePreview();
};

const init = async () => {
  ensureElements();
  setMinDate();
  initializeStateFromForm();
  attachEventListeners();
  await fetchCars();
  void updatePriceEstimation();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  void init();
}

if (kmsInput) {
  kmsInput.addEventListener('input', () => {
    state.kms = kmsInput.value ? Math.max(0, Number(kmsInput.value)) : 0;
    void updatePriceEstimation();
  });
}
