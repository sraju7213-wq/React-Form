// Application data gathered from https://github.com/sraju7213-wq/Vwc-ultimate-
const appData = {
  vehicles: [
    {
      label: "AUDI A6",
      price: 16000,
      image: "https://i.postimg.cc/zfxy8jD7/AUDI-A6.jpg"
    },
    {
      label: "BMW 5 Series F10 (Old Shape)",
      price: null,
      image: "https://i.postimg.cc/zvgvwYC2/BMW-5-Series-F10-OLD-SHAPE.jpg"
    },
    {
      label: "BMW 5 Series G30",
      price: null,
      image: "https://i.postimg.cc/Hj1xBv3Y/BMW-5-SERIES-G30-New-shape.jpg"
    },
    {
      label: "BMW 520D",
      price: null,
      image: "https://i.postimg.cc/26dwqh2j/BMW-520D.jpg"
    },
    {
      label: "BMW Convertible",
      price: 26000,
      image: "https://i.postimg.cc/L4nyP974/BMW-330-D-Convertible.jpg"
    },
    {
      label: "Hyundai Creta",
      price: 12000,
      image: "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&w=900&q=80"
    },
    {
      label: "Hyundai Verna",
      price: 12000,
      image: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=900&q=80"
    },
    {
      label: "Mercedes CLA 200",
      price: 14000,
      image: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80"
    },
    {
      label: "Mercedes G Wagon",
      price: 160000,
      image: "https://i.postimg.cc/J7vp5wVN/Mercedes-G-wagon.jpg"
    },
    {
      label: "Mercedes S Class",
      price: 22000,
      image: "https://i.postimg.cc/cLNTPQJ6/MERCEDES-S-CLASS-S350.jpg"
    },
    {
      label: "Range Rover Sport",
      price: 85000,
      image: "https://i.postimg.cc/rwCgTKdj/Range-Rover-Sport.jpg"
    },
    {
      label: "Range Rover Sport 2",
      price: 125000,
      image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80"
    }
  ],
  decorations: [
    { label: "No", price: 0 },
    { label: "Artificial", price: 0 },
    { label: "Fresh", price: 7000 }
  ],
  srinagarPins: [
    "190001",
    "190002",
    "190003",
    "190004",
    "190005",
    "190006",
    "190007",
    "190008",
    "190009",
    "190010"
  ]
};

// Application state
let bookingState = {
  enquiryType: "",
  serviceType: "",
  vehicle: null,
  wantDecoration: "No",
  decorationType: "",
  wantNamePlate: "No",
  namePlateDetails: "",
  startLocation: "",
  endLocation: "",
  eventDate: "",
  eventTime: "",
  fullName: "",
  email: "",
  phone: "",
  specialRequests: "",
  drivingOption: ""
};

// DOM elements
const form = document.getElementById("bookingForm");
const formSteps = Array.from(document.querySelectorAll(".form-step"));
const progressItems = Array.from(
  document.querySelectorAll(".step-progress__item")
);
const vehicleSelect = document.getElementById("vehicleSelect");
const decorationTypeGroup = document.getElementById("decorationTypeGroup");
const namePlateGroup = document.getElementById("namePlateGroup");
const selfDriveReq = document.getElementById("selfDriveReq");
const priceEstimation = document.getElementById("priceEstimation");
const summaryContent = document.getElementById("summaryContent");
const whatsappBtn = document.getElementById("whatsappBtn");
const eventDateInput = document.getElementById("eventDate");
const vehiclePreview = document.getElementById("vehiclePreview");
const vehicleImage = document.getElementById("vehicleImage");
const vehicleImageCaption = document.getElementById("vehicleImageCaption");
const summaryPanel = document.getElementById("summaryPanel");
const summaryToggle = document.getElementById("summaryToggle");
const summaryClose = document.getElementById("summaryClose");

let currentStepIndex = 0;

// Initialize the application
window.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  populateVehicleOptions();
  setMinDate();
  attachEventListeners();
  toggleDecorationFields();
  toggleNamePlateFields();
  toggleSelfDriveRequirements();
  updateSummary();
  updateVehiclePreview();
  updatePriceEstimation();
  showStep(currentStepIndex);
  setupSummaryPanel();
}

function populateVehicleOptions() {
  appData.vehicles.forEach((vehicle) => {
    const option = document.createElement("option");
    const priceLabel = formatVehiclePrice(vehicle.price);
    option.value = JSON.stringify({
      label: vehicle.label,
      price: vehicle.price,
      image: vehicle.image,
      priceLabel
    });
    option.textContent = `${vehicle.label} — ${priceLabel}`;
    vehicleSelect.appendChild(option);
  });
}

function setMinDate() {
  const today = new Date().toISOString().split("T")[0];
  eventDateInput?.setAttribute("min", today);
}

function attachEventListeners() {
  const formElements = form.querySelectorAll("input, select, textarea");
  formElements.forEach((element) => {
    element.addEventListener("change", handleFormChange);
    element.addEventListener("input", handleFormInput);
  });

  form.addEventListener("submit", handleFormSubmit);
  whatsappBtn?.addEventListener("click", generateWhatsAppMessage);

  document
    .querySelectorAll('input[name="wantDecoration"]')
    .forEach((radio) => radio.addEventListener("change", toggleDecorationFields));

  document
    .querySelectorAll('input[name="wantNamePlate"]')
    .forEach((radio) => radio.addEventListener("change", toggleNamePlateFields));

  document
    .querySelectorAll('input[name="drivingOption"]')
    .forEach((radio) => radio.addEventListener("change", toggleSelfDriveRequirements));

  document.querySelectorAll(".next-step").forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateStep(currentStepIndex)) {
        return;
      }
      const nextIndex = Number(button.dataset.next) - 1;
      showStep(nextIndex);
    });
  });

  document.querySelectorAll(".prev-step").forEach((button) => {
    button.addEventListener("click", () => {
      const prevIndex = Number(button.dataset.prev) - 1;
      showStep(prevIndex);
    });
  });
}

function setupSummaryPanel() {
  if (!summaryToggle || !summaryPanel) return;

  summaryToggle.setAttribute("aria-expanded", "false");

  summaryToggle.addEventListener("click", () => toggleSummaryPanel());
  summaryClose?.addEventListener("click", () => toggleSummaryPanel(false));

  const mediaQuery = window.matchMedia("(min-width: 961px)");
  const handleChange = (event) => {
    if (event.matches) {
      summaryPanel.classList.remove("is-visible");
      summaryToggle.setAttribute("aria-expanded", "false");
    }
  };
  mediaQuery.addEventListener("change", handleChange);
}

function toggleSummaryPanel(forceState) {
  const willShow =
    typeof forceState === "boolean"
      ? forceState
      : !summaryPanel.classList.contains("is-visible");
  summaryPanel.classList.toggle("is-visible", willShow);
  summaryToggle?.setAttribute("aria-expanded", String(willShow));
}

function showStep(index) {
  if (index < 0 || index >= formSteps.length) {
    return;
  }
  currentStepIndex = index;

  formSteps.forEach((step, stepIndex) => {
    const isActive = stepIndex === currentStepIndex;
    step.classList.toggle("is-active", isActive);
    step.toggleAttribute("hidden", !isActive);
  });

  progressItems.forEach((item, progressIndex) => {
    item.classList.toggle("is-active", progressIndex === currentStepIndex);
    item.classList.toggle("is-complete", progressIndex < currentStepIndex);
  });

  const scrollTarget = formSteps[currentStepIndex];
  if (scrollTarget) {
    const top = scrollTarget.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: top < 0 ? 0 : top, behavior: "smooth" });
  }
}

function validateStep(stepIndex) {
  const step = formSteps[stepIndex];
  if (!step) return true;

  const inputs = Array.from(step.querySelectorAll("input, select, textarea"));
  for (const input of inputs) {
    if (!input.checkValidity()) {
      input.reportValidity();
      return false;
    }
  }
  return true;
}

function handleFormChange(event) {
  updateBookingState(event);
  updateSummary();
  updatePriceEstimation();
  if (event.target.name === "vehicle") {
    updateVehiclePreview();
  }
}

function handleFormInput(event) {
  updateBookingState(event);
  updateSummary();
  if (["startLocation", "endLocation"].includes(event.target.name)) {
    updatePriceEstimation();
  }
  if (event.target.name === "vehicle") {
    updateVehiclePreview();
  }
}

function updateBookingState(event) {
  const { name, value, type } = event.target;

  if (type === "radio") {
    bookingState[name] = value;
  } else if (name === "vehicle") {
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
  if (!vehiclePreview || !vehicleImage || !vehicleImageCaption) return;

  if (bookingState.vehicle && bookingState.vehicle.image) {
    vehiclePreview.classList.remove("hidden");
    vehicleImage.src = bookingState.vehicle.image;
    vehicleImage.alt = `${bookingState.vehicle.label} - Valley Wedding Cars`;
    vehicleImageCaption.textContent = bookingState.vehicle.priceLabel
      ? `${bookingState.vehicle.label} • ${bookingState.vehicle.priceLabel}`
      : bookingState.vehicle.label;
  } else if (bookingState.vehicle) {
    vehiclePreview.classList.remove("hidden");
    vehicleImage.src = "";
    vehicleImage.alt = "";
    vehicleImageCaption.textContent = bookingState.vehicle.label;
  } else {
    vehiclePreview.classList.add("hidden");
    vehicleImage.src = "";
    vehicleImage.alt = "";
    vehicleImageCaption.textContent = "";
  }
}

function toggleDecorationFields() {
  const wantDecoration = document.querySelector(
    'input[name="wantDecoration"]:checked'
  )?.value;
  bookingState.wantDecoration = wantDecoration || "No";

  if (wantDecoration === "Yes") {
    decorationTypeGroup.classList.remove("hidden");
    const artificialRadio = document.querySelector(
      'input[name="decorationType"][value="Artificial"]'
    );
    if (artificialRadio && !document.querySelector('input[name="decorationType"]:checked')) {
      artificialRadio.checked = true;
      bookingState.decorationType = "Artificial";
    }
  } else {
    decorationTypeGroup.classList.add("hidden");
    document
      .querySelectorAll('input[name="decorationType"]')
      .forEach((radio) => {
        radio.checked = false;
      });
    bookingState.decorationType = "";
  }
}

function toggleNamePlateFields() {
  const wantNamePlate = document.querySelector(
    'input[name="wantNamePlate"]:checked'
  )?.value;
  bookingState.wantNamePlate = wantNamePlate || "No";

  if (wantNamePlate === "Yes") {
    namePlateGroup.classList.remove("hidden");
  } else {
    namePlateGroup.classList.add("hidden");
    const namePlateInput = document.querySelector('input[name="namePlateDetails"]');
    if (namePlateInput) {
      namePlateInput.value = "";
    }
    bookingState.namePlateDetails = "";
  }
}

function toggleSelfDriveRequirements() {
  const drivingOption = document.querySelector(
    'input[name="drivingOption"]:checked'
  )?.value;
  bookingState.drivingOption = drivingOption || "";

  if (drivingOption === "SELF_DRIVE") {
    selfDriveReq.classList.remove("hidden");
  } else {
    selfDriveReq.classList.add("hidden");
  }
}

function updateSummary() {
  let summaryHtml = "";

  if (bookingState.enquiryType) {
    summaryHtml += createSummaryItem("Enquiry Type", bookingState.enquiryType);
  }

  if (bookingState.serviceType) {
    summaryHtml += createSummaryItem("Service", bookingState.serviceType);
  }

  if (bookingState.startLocation) {
    summaryHtml += createSummaryItem("Start", bookingState.startLocation);
  }

  if (bookingState.endLocation) {
    summaryHtml += createSummaryItem("End", bookingState.endLocation);
  }

  if (bookingState.vehicle) {
    const vehicleLabel = bookingState.vehicle.priceLabel
      ? `${bookingState.vehicle.label} • ${bookingState.vehicle.priceLabel}`
      : bookingState.vehicle.label;
    summaryHtml += createSummaryItem("Vehicle", vehicleLabel);
  }

  if (bookingState.eventDate) {
    const formattedDate = new Date(bookingState.eventDate).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
    summaryHtml += createSummaryItem("Date", formattedDate);
  }

  if (bookingState.eventTime) {
    const formattedTime = new Date(`2000-01-01T${bookingState.eventTime}`).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }
    );
    summaryHtml += createSummaryItem("Event Time", formattedTime);
  }

  if (bookingState.fullName) {
    summaryHtml += createSummaryItem("Name", bookingState.fullName);
  }

  if (bookingState.phone) {
    summaryHtml += createSummaryItem("Phone", bookingState.phone);
  }

  if (bookingState.email) {
    summaryHtml += createSummaryItem("Email", bookingState.email);
  }

  if (bookingState.drivingOption) {
    const drivingText =
      bookingState.drivingOption === "WITH_DRIVER" ? "Need With Driver" : "Self Drive";
    summaryHtml += createSummaryItem("Driving", drivingText);
  }

  if (bookingState.wantDecoration === "Yes" && bookingState.decorationType) {
    summaryHtml += createSummaryItem("Decoration", bookingState.decorationType);
  } else if (bookingState.wantDecoration === "No") {
    summaryHtml += createSummaryItem("Decoration", "No");
  }

  if (bookingState.wantNamePlate === "Yes" && bookingState.namePlateDetails) {
    summaryHtml += createSummaryItem("Name Plate", bookingState.namePlateDetails);
  } else if (bookingState.wantNamePlate === "No") {
    summaryHtml += createSummaryItem("Name Plate", "No");
  }

  if (bookingState.specialRequests) {
    summaryHtml += createSummaryItem("Message", bookingState.specialRequests);
  }

  summaryContent.innerHTML =
    summaryHtml || '<p class="empty-state">Fill out the form to see your booking summary.</p>';
}

function createSummaryItem(label, value) {
  return `
    <div class="summary-item">
      <span class="summary-label">${label}</span>
      <span class="summary-value">${value}</span>
    </div>
  `;
}

function updatePriceEstimation() {
  if (!bookingState.vehicle) {
    priceEstimation.classList.add("hidden");
    return;
  }

  const discountRow = document.getElementById("discountRow");
  const surchargeRow = document.getElementById("surchargeRow");
  const vehiclePriceElement = document.getElementById("vehiclePrice");
  const decorationPriceElement = document.getElementById("decorationPrice");
  const discountAmountElement = document.getElementById("discountAmount");
  const surchargeAmountElement = document.getElementById("surchargeAmount");
  const totalPriceElement = document.getElementById("totalPrice");

  const vehiclePrice = bookingState.vehicle.price;
  const hasNumericPrice = typeof vehiclePrice === "number" && !Number.isNaN(vehiclePrice);

  if (!hasNumericPrice) {
    priceEstimation.classList.remove("hidden");
    discountRow.hidden = true;
    surchargeRow.hidden = true;
    vehiclePriceElement.textContent = bookingState.vehicle.priceLabel || "Contact for quote";
    decorationPriceElement.textContent = "--";
    discountAmountElement.textContent = "--";
    surchargeAmountElement.textContent = "--";
    totalPriceElement.textContent = "Please contact for pricing";
    return;
  }

  let decorationPrice = 0;
  if (bookingState.wantDecoration === "Yes" && bookingState.decorationType === "Fresh") {
    decorationPrice = 7000;
  }

  let basePrice = vehiclePrice + decorationPrice;
  let discount = 0;
  let surcharge = 0;
  let totalPrice = basePrice;

  const startPinCode = extractPinCode(bookingState.startLocation);
  const endPinCode = extractPinCode(bookingState.endLocation);

  const startInSrinagar = startPinCode && appData.srinagarPins.includes(startPinCode);
  const endInSrinagar = endPinCode && appData.srinagarPins.includes(endPinCode);

  if (startPinCode && endPinCode) {
    if (startInSrinagar && endInSrinagar) {
      discount = Math.round(basePrice * 0.15);
      totalPrice = basePrice - discount;
      discountRow.hidden = false;
      surchargeRow.hidden = true;
    } else if (!startInSrinagar || !endInSrinagar) {
      surcharge = Math.round(basePrice * 0.1);
      totalPrice = basePrice + surcharge;
      surchargeRow.hidden = false;
      discountRow.hidden = true;
    } else {
      discountRow.hidden = true;
      surchargeRow.hidden = true;
    }
  } else {
    discountRow.hidden = true;
    surchargeRow.hidden = true;
  }

  priceEstimation.classList.remove("hidden");
  vehiclePriceElement.textContent = `₹${vehiclePrice.toLocaleString("en-IN")}`;
  decorationPriceElement.textContent = `₹${decorationPrice.toLocaleString("en-IN")}`;
  discountAmountElement.textContent = `-₹${discount.toLocaleString("en-IN")}`;
  surchargeAmountElement.textContent = `+₹${surcharge.toLocaleString("en-IN")}`;
  totalPriceElement.textContent = `₹${totalPrice.toLocaleString("en-IN")}`;
}

function generateWhatsAppMessage() {
  if (!bookingState.vehicle || !bookingState.fullName || !bookingState.phone) {
    alert(
      "Please fill in your vehicle choice, name, and phone number to generate a WhatsApp message."
    );
    return;
  }

  const lines = [];
  lines.push("*Valley Wedding Cars - Booking Request*", "");
  lines.push("*Customer Details:*");
  lines.push(`Name: ${bookingState.fullName}`);
  lines.push(`Phone: ${bookingState.phone}`);
  if (bookingState.email) lines.push(`Email: ${bookingState.email}`);

  lines.push("", "*Booking Details:*");
  lines.push(`Enquiry Type: ${bookingState.enquiryType || "Not specified"}`);
  lines.push(`Service Type: ${bookingState.serviceType || "Not specified"}`);
  lines.push(`Vehicle: ${bookingState.vehicle.label}`);

  if (bookingState.vehicle.priceLabel) {
    lines.push(`Vehicle Pricing: ${bookingState.vehicle.priceLabel}`);
  }

  if (bookingState.wantDecoration === "Yes" && bookingState.decorationType) {
    lines.push(`Decoration: ${bookingState.decorationType}`);
  }

  if (bookingState.wantNamePlate === "Yes" && bookingState.namePlateDetails) {
    lines.push(`Name Plate: ${bookingState.namePlateDetails}`);
  }

  if (bookingState.startLocation) {
    lines.push(`Start Location: ${bookingState.startLocation}`);
  }

  if (bookingState.endLocation) {
    lines.push(`End Location: ${bookingState.endLocation}`);
  }

  if (bookingState.eventDate) {
    const formattedDate = new Date(bookingState.eventDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    lines.push(`Event Date: ${formattedDate}`);
  }

  if (bookingState.eventTime) {
    const formattedTime = new Date(`2000-01-01T${bookingState.eventTime}`).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }
    );
    lines.push(`Event Time: ${formattedTime}`);
  }

  if (bookingState.drivingOption) {
    const drivingText =
      bookingState.drivingOption === "WITH_DRIVER" ? "With Driver" : "Self Drive";
    lines.push(`Driving Option: ${drivingText}`);
  }

  const vehiclePrice = bookingState.vehicle.price;
  const hasNumericPrice = typeof vehiclePrice === "number" && !Number.isNaN(vehiclePrice);

  lines.push("", "*Price Breakdown:*");

  if (!hasNumericPrice) {
    lines.push("Pricing: Please advise the best available quote for this selection.");
  } else {
    let decorationPrice = 0;
    if (bookingState.wantDecoration === "Yes" && bookingState.decorationType === "Fresh") {
      decorationPrice = 7000;
    }
    let basePrice = vehiclePrice + decorationPrice;
    let discount = 0;
    let surcharge = 0;
    let totalPrice = basePrice;

    lines.push(`Vehicle Cost: ₹${vehiclePrice.toLocaleString("en-IN")}`);
    if (decorationPrice > 0) {
      lines.push(`Decoration Cost: ₹${decorationPrice.toLocaleString("en-IN")}`);
    }

    const startPinCode = extractPinCode(bookingState.startLocation);
    const endPinCode = extractPinCode(bookingState.endLocation);
    const startInSrinagar = startPinCode && appData.srinagarPins.includes(startPinCode);
    const endInSrinagar = endPinCode && appData.srinagarPins.includes(endPinCode);

    if (startPinCode && endPinCode) {
      if (startInSrinagar && endInSrinagar) {
        discount = Math.round(basePrice * 0.15);
        totalPrice = basePrice - discount;
        lines.push(`Srinagar Discount (15%): -₹${discount.toLocaleString("en-IN")}`);
      } else if (!startInSrinagar || !endInSrinagar) {
        surcharge = Math.round(basePrice * 0.1);
        totalPrice = basePrice + surcharge;
        lines.push(`Outside Srinagar Surcharge (10%): +₹${surcharge.toLocaleString("en-IN")}`);
      }
    }

    lines.push(`*Total Amount: ₹${totalPrice.toLocaleString("en-IN")}*`);
  }

  if (bookingState.specialRequests) {
    lines.push("", "*Special Requests:*");
    lines.push(bookingState.specialRequests);
  }

  lines.push(
    "",
    "Please confirm the booking details and let me know if any adjustments are required."
  );

  const message = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/?text=${message}`, "_blank");
}

function handleFormSubmit(event) {
  event.preventDefault();

  const isValid = form.reportValidity();
  if (!isValid) {
    return;
  }

  alert(
    "Booking request submitted successfully! You can also use the WhatsApp button to share the summary instantly."
  );
}

// Utility helpers
function extractPinCode(location) {
  const pinCodeRegex = /\b(\d{6})\b/g;
  const matches = location.match(pinCodeRegex);
  return matches ? matches[matches.length - 1] : null;
}

function formatVehiclePrice(price) {
  if (typeof price === "number" && !Number.isNaN(price)) {
    return `₹${price.toLocaleString("en-IN")}`;
  }
  return "Contact for quote";
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

window.addEventListener("input", (event) => {
  if (event.target.type === "email") {
    if (event.target.value && !validateEmail(event.target.value)) {
      event.target.setCustomValidity("Please enter a valid email address");
    } else {
      event.target.setCustomValidity("");
    }
  }

  if (event.target.name === "phone") {
    if (event.target.value && !validatePhone(event.target.value)) {
      event.target.setCustomValidity("Please enter a 10-digit phone number");
    } else {
      event.target.setCustomValidity("");
    }
  }
});
