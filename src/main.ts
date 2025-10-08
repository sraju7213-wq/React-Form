import './style.css';
import type { Car, PriceEstimate, PriceEstimateInput } from './shared/types';
import { formatCurrency } from './shared/price';

type BookingState = {
  enquiryType: string;
  serviceType: string;
  wantDecoration: 'Yes' | 'No';
  decorationType: 'Artificial' | 'Fresh' | '';
  wantNamePlate: 'Yes' | 'No';
  namePlateDetails: string;
  startLocation: string;
  endLocation: string;
  vehicleId: string | null;
  eventDate: string;
  eventTime: string;
  fullName: string;
  email: string;
  phone: string;
  specialRequests: string;
  drivingOption: 'WITH_DRIVER' | 'SELF_DRIVE' | '';
  kms: number;
  scope: 'srinagar' | 'outside_srinagar';
};

type DecorOption = 'No' | 'Artificial' | 'Fresh';

type SummaryItem = {
  label: string;
  value: string;
};

const SRINAGAR_PINS = new Set([
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
]);

const DECORATION_PRICES: Record<DecorOption, number> = {
  No: 0,
  Artificial: 0,
  Fresh: 7000,
};

const DEFAULT_STATE: BookingState = {
  enquiryType: '',
  serviceType: '',
  wantDecoration: 'No',
  decorationType: '',
  wantNamePlate: 'No',
  namePlateDetails: '',
  startLocation: '',
  endLocation: '',
  vehicleId: null,
  eventDate: '',
  eventTime: '',
  fullName: '',
  email: '',
  phone: '',
  specialRequests: '',
  drivingOption: '',
  kms: 0,
  scope: 'srinagar',
};

const elements = {
  form: document.getElementById('bookingForm') as HTMLFormElement | null,
  vehicleSelect: document.getElementById('vehicleSelect') as HTMLSelectElement | null,
  decorationTypeGroup: document.getElementById('decorationTypeGroup') as HTMLElement | null,
  namePlateGroup: document.getElementById('namePlateGroup') as HTMLElement | null,
  selfDriveReq: document.getElementById('selfDriveReq') as HTMLElement | null,
  priceEstimation: document.getElementById('priceEstimation') as HTMLElement | null,
  summaryContent: document.getElementById('summaryContent') as HTMLElement | null,
  whatsappBtn: document.getElementById('whatsappBtn') as HTMLButtonElement | null,
  eventDateInput: document.getElementById('eventDate') as HTMLInputElement | null,
  vehiclePreview: document.getElementById('vehiclePreview') as HTMLElement | null,
  vehicleImage: document.getElementById('vehicleImage') as HTMLImageElement | null,
  vehicleImageCaption: document.getElementById('vehicleImageCaption') as HTMLElement | null,
  vehiclePrice: document.getElementById('vehiclePrice') as HTMLElement | null,
  distancePrice: document.getElementById('distancePrice') as HTMLElement | null,
  decorationPrice: document.getElementById('decorationPrice') as HTMLElement | null,
  totalPrice: document.getElementById('totalPrice') as HTMLElement | null,
  adjustmentsList: document.getElementById('adjustmentsList') as HTMLElement | null,
};

let bookingState: BookingState = { ...DEFAULT_STATE };
let cars: Car[] = [];
let currentEstimate: PriceEstimate | null = null;

async function init(): Promise<void> {
  if (!elements.form || !elements.vehicleSelect) {
    return;
  }

  setMinDate();
  await loadCars();
  attachEventListeners();
  syncState();
}

function setMinDate(): void {
  if (!elements.eventDateInput) {
    return;
  }
  const today = new Date();
  const iso = today.toISOString().split('T')[0];
  elements.eventDateInput.min = iso;
}

async function loadCars(): Promise<void> {
  try {
    const response = await fetch('/api/cars');
    if (!response.ok) {
      throw new Error(`Failed to load cars: ${response.status}`);
    }
    const data = (await response.json()) as Car[];
    cars = data.filter((car) => car.active);
    populateVehicleOptions();
  } catch (error) {
    console.error(error);
    showVehicleError();
  }
}

function populateVehicleOptions(): void {
  if (!elements.vehicleSelect) {
    return;
  }
  elements.vehicleSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Choose a vehicle...';
  elements.vehicleSelect.appendChild(placeholder);

  cars
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((car) => {
      const option = document.createElement('option');
      option.value = car.id;
      option.textContent = car.name;
      option.dataset.basePrice = String(car.base_price);
      option.dataset.perKm = String(car.per_km ?? 0);
      option.dataset.imageUrl = car.image_url ?? '';
      elements.vehicleSelect?.appendChild(option);
    });
}

function showVehicleError(): void {
  if (!elements.vehicleSelect) {
    return;
  }
  elements.vehicleSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.textContent = 'Unable to load vehicles';
  elements.vehicleSelect.appendChild(option);
  elements.vehicleSelect.disabled = true;
}

function attachEventListeners(): void {
  const { form, vehicleSelect, whatsappBtn } = elements;
  if (!form) {
    return;
  }

  form.addEventListener('input', () => syncState());
  form.addEventListener('change', () => syncState());
  form.addEventListener('submit', (event) => handleFormSubmit(event));

  vehicleSelect?.addEventListener('change', () => updateVehiclePreview());
  whatsappBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    generateWhatsAppMessage();
  });
}

function syncState(): void {
  if (!elements.form) {
    return;
  }
  const data = new FormData(elements.form);
  bookingState = {
    enquiryType: (data.get('enquiryType') as string) ?? '',
    serviceType: (data.get('serviceType') as string) ?? '',
    wantDecoration: (data.get('wantDecoration') as BookingState['wantDecoration']) ?? 'No',
    decorationType: ((data.get('decorationType') as BookingState['decorationType']) ?? '') as BookingState['decorationType'],
    wantNamePlate: (data.get('wantNamePlate') as BookingState['wantNamePlate']) ?? 'No',
    namePlateDetails: (data.get('namePlateDetails') as string) ?? '',
    startLocation: (data.get('startLocation') as string) ?? '',
    endLocation: (data.get('endLocation') as string) ?? '',
    vehicleId: (data.get('vehicle') as string) || null,
    eventDate: (data.get('eventDate') as string) ?? '',
    eventTime: (data.get('eventTime') as string) ?? '',
    fullName: (data.get('fullName') as string) ?? '',
    email: (data.get('email') as string) ?? '',
    phone: (data.get('phone') as string) ?? '',
    specialRequests: (data.get('specialRequests') as string) ?? '',
    drivingOption: (data.get('drivingOption') as BookingState['drivingOption']) ?? '',
    kms: parseNumber((data.get('kms') as string) ?? ''),
    scope: 'srinagar',
  };

  bookingState.scope = detectScope(bookingState.startLocation, bookingState.endLocation);
  updateConditionalFields();
  updateVehiclePreview();
  updateSummary();
  refreshPriceEstimation();
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function detectScope(start: string, end: string): BookingState['scope'] {
  const startPin = extractPinCode(start);
  const endPin = extractPinCode(end);
  if (!startPin && !endPin) {
    return 'srinagar';
  }
  const startIn = startPin ? SRINAGAR_PINS.has(startPin) : true;
  const endIn = endPin ? SRINAGAR_PINS.has(endPin) : true;
  return startIn && endIn ? 'srinagar' : 'outside_srinagar';
}

function extractPinCode(location: string): string | null {
  const match = location.match(/\b(\d{6})\b/g);
  if (!match || match.length === 0) {
    return null;
  }
  return match[match.length - 1];
}

function updateConditionalFields(): void {
  const { decorationTypeGroup, namePlateGroup, selfDriveReq } = elements;
  if (!decorationTypeGroup || !namePlateGroup || !selfDriveReq) {
    return;
  }
  const wantsDecoration = bookingState.wantDecoration === 'Yes';
  decorationTypeGroup.classList.toggle('hidden', !wantsDecoration);

  const wantsNamePlate = bookingState.wantNamePlate === 'Yes';
  namePlateGroup.classList.toggle('hidden', !wantsNamePlate);

  const selfDrive = bookingState.drivingOption === 'SELF_DRIVE';
  selfDriveReq.classList.toggle('hidden', !selfDrive);
}

function updateVehiclePreview(): void {
  const car = cars.find((item) => item.id === bookingState.vehicleId) ?? null;
  const { vehiclePreview, vehicleImage, vehicleImageCaption } = elements;
  if (!vehiclePreview || !vehicleImage || !vehicleImageCaption) {
    return;
  }

  if (!car) {
    vehiclePreview.classList.add('hidden');
    vehicleImage.src = '';
    vehicleImage.alt = '';
    vehicleImageCaption.textContent = '';
    return;
  }

  if (car.image_url) {
    vehicleImage.src = car.image_url;
    vehicleImage.alt = `${car.name} preview`;
  } else {
    vehicleImage.removeAttribute('src');
    vehicleImage.alt = '';
  }
  vehicleImageCaption.textContent = `${car.name} • Base ₹${car.base_price.toLocaleString('en-IN')}`;
  vehiclePreview.classList.remove('hidden');
}

function updateSummary(): void {
  const container = elements.summaryContent;
  if (!container) {
    return;
  }

  const car = cars.find((item) => item.id === bookingState.vehicleId) ?? null;
  const items: SummaryItem[] = [
    { label: 'Enquiry Type', value: bookingState.enquiryType || '—' },
    { label: 'Service Type', value: bookingState.serviceType || '—' },
    { label: 'Event Date', value: bookingState.eventDate || '—' },
    { label: 'Event Time', value: bookingState.eventTime || '—' },
    { label: 'Vehicle', value: car?.name ?? '—' },
    { label: 'Start Location', value: bookingState.startLocation || '—' },
    { label: 'End Location', value: bookingState.endLocation || '—' },
    { label: 'Decoration', value: bookingState.wantDecoration === 'Yes' ? bookingState.decorationType || 'Yes' : 'No' },
    { label: 'Driving Option', value: bookingState.drivingOption || '—' },
  ];

  container.innerHTML = '';
  const list = document.createElement('dl');
  list.className = 'summary-list';

  for (const item of items) {
    const dt = document.createElement('dt');
    dt.textContent = item.label;
    const dd = document.createElement('dd');
    dd.textContent = item.value;
    list.appendChild(dt);
    list.appendChild(dd);
  }

  container.appendChild(list);
}

function computeDecorationPrice(): number {
  if (bookingState.wantDecoration !== 'Yes') {
    return DECORATION_PRICES.No;
  }
  const decor = bookingState.decorationType || 'No';
  return DECORATION_PRICES[decor as DecorOption] ?? 0;
}

async function refreshPriceEstimation(): Promise<void> {
  const priceCard = elements.priceEstimation;
  if (!priceCard) {
    return;
  }

  const car = cars.find((item) => item.id === bookingState.vehicleId) ?? null;
  if (!car) {
    priceCard.classList.add('hidden');
    currentEstimate = null;
    resetPriceCard();
    return;
  }

  const payload: PriceEstimateInput = {
    carId: car.id,
    kms: bookingState.kms ?? 0,
    scope: bookingState.scope,
  };

  if (bookingState.eventDate) {
    payload.dateISO = bookingState.eventDate;
  }

  try {
    const response = await fetch('/api/price-estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to estimate');
    }

    const estimate = (await response.json()) as PriceEstimate;
    currentEstimate = estimate;
    updatePriceCard(estimate);
    priceCard.classList.remove('hidden');
  } catch (error) {
    console.error('Unable to fetch price estimate', error);
    currentEstimate = null;
    priceCard.classList.add('hidden');
    resetPriceCard();
  }
}

function resetPriceCard(): void {
  elements.vehiclePrice && (elements.vehiclePrice.textContent = '₹0');
  elements.distancePrice && (elements.distancePrice.textContent = '₹0');
  elements.decorationPrice && (elements.decorationPrice.textContent = '₹0');
  elements.totalPrice && (elements.totalPrice.textContent = '₹0');
  if (elements.adjustmentsList) {
    elements.adjustmentsList.innerHTML = '';
  }
}

function updatePriceCard(estimate: PriceEstimate): void {
  const decorationCost = computeDecorationPrice();
  const totalWithExtras = estimate.total + decorationCost;
  elements.vehiclePrice && (elements.vehiclePrice.textContent = formatCurrency(estimate.base));
  elements.distancePrice && (elements.distancePrice.textContent = formatCurrency(estimate.perKmComponent));
  elements.decorationPrice && (elements.decorationPrice.textContent = formatCurrency(decorationCost));
  elements.totalPrice && (elements.totalPrice.textContent = formatCurrency(totalWithExtras));

  if (elements.adjustmentsList) {
    elements.adjustmentsList.innerHTML = '';
    if (estimate.adjustments.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'price-adjustments__empty';
      empty.textContent = 'No additional adjustments applied.';
      elements.adjustmentsList.appendChild(empty);
    } else {
      estimate.adjustments.forEach((adjustment) => {
        const row = document.createElement('div');
        row.className = `price-item ${adjustment.delta >= 0 ? 'surcharge' : 'discount'}`;

        const name = document.createElement('span');
        name.textContent = adjustment.rule_name;

        const delta = document.createElement('span');
        const prefix = adjustment.delta >= 0 ? '+' : '';
        delta.textContent = `${prefix}${formatCurrency(Math.round(adjustment.delta))}`;

        row.appendChild(name);
        row.appendChild(delta);
        elements.adjustmentsList?.appendChild(row);
      });
    }
  }
}

function generateWhatsAppMessage(): void {
  const car = cars.find((item) => item.id === bookingState.vehicleId) ?? null;
  if (!car) {
    alert('Please select a vehicle before sending your enquiry.');
    return;
  }

  const lines: string[] = [];
  lines.push('*Valley Wedding Cars Enquiry*');
  if (bookingState.fullName) {
    lines.push(`Name: ${bookingState.fullName}`);
  }
  if (bookingState.phone) {
    lines.push(`Phone: ${bookingState.phone}`);
  }
  if (bookingState.email) {
    lines.push(`Email: ${bookingState.email}`);
  }
  if (bookingState.enquiryType) {
    lines.push(`Enquiry Type: ${bookingState.enquiryType}`);
  }
  if (bookingState.serviceType) {
    lines.push(`Service Type: ${bookingState.serviceType}`);
  }
  if (bookingState.eventDate) {
    lines.push(`Event Date: ${bookingState.eventDate}`);
  }
  if (bookingState.eventTime) {
    lines.push(`Event Time: ${bookingState.eventTime}`);
  }
  lines.push(`Vehicle: ${car.name}`);
  lines.push(`Start Location: ${bookingState.startLocation || '—'}`);
  lines.push(`End Location: ${bookingState.endLocation || '—'}`);
  lines.push(`Driving Option: ${bookingState.drivingOption || '—'}`);

  if (bookingState.wantDecoration === 'Yes') {
    lines.push(`Decoration: ${bookingState.decorationType || 'Requested'}`);
  } else {
    lines.push('Decoration: No');
  }

  if (bookingState.wantNamePlate === 'Yes') {
    lines.push(`Name Plate: ${bookingState.namePlateDetails || 'Yes'}`);
  }

  if (currentEstimate) {
    const decorationCost = computeDecorationPrice();
    const totalWithExtras = currentEstimate.total + decorationCost;
    lines.push('');
    lines.push('*Price Breakdown*');
    lines.push(`Vehicle Base: ${formatCurrency(currentEstimate.base)}`);
    if (currentEstimate.perKmComponent > 0) {
      lines.push(`Distance Component: ${formatCurrency(currentEstimate.perKmComponent)}`);
    }
    if (decorationCost > 0) {
      lines.push(`Decoration: ${formatCurrency(decorationCost)}`);
    }
    for (const adjustment of currentEstimate.adjustments) {
      const prefix = adjustment.delta >= 0 ? '+' : '';
      lines.push(`${adjustment.rule_name}: ${prefix}${formatCurrency(Math.round(adjustment.delta))}`);
    }
    lines.push(`Total Estimate: ${formatCurrency(totalWithExtras)}`);
  }

  if (bookingState.specialRequests) {
    lines.push('');
    lines.push('*Special Requests*');
    lines.push(bookingState.specialRequests);
  }

  const encoded = encodeURIComponent(lines.join('\n'));
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}

function handleFormSubmit(event: Event): void {
  event.preventDefault();
  const form = elements.form;
  if (!form) {
    return;
  }
  if (!runCustomValidations()) {
    return;
  }
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  alert('Booking request captured! Use the WhatsApp button to send the enquiry directly.');
}

function runCustomValidations(): boolean {
  const form = elements.form;
  if (!form) {
    return false;
  }
  let valid = true;

  const decorationRadios = form.elements.namedItem('decorationType');
  if (bookingState.wantDecoration === 'Yes' && decorationRadios instanceof RadioNodeList) {
    const value = decorationRadios.value;
    if (!value) {
      alert('Please choose a decoration type.');
      valid = false;
    }
  }

  if (bookingState.wantNamePlate === 'Yes' && !bookingState.namePlateDetails.trim()) {
    alert('Please enter name plate details.');
    valid = false;
  }

  if (!bookingState.vehicleId) {
    alert('Please select a vehicle.');
    valid = false;
  }

  return valid;
}

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
