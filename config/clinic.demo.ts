import { ClinicConfig } from "./schema";

export const demoClinicConfig: ClinicConfig = {
  id: "apollo-jubilee-hills",
  name: "Apollo Hospitals - Jubilee Hills Clinic",
  shortName: "Apollo Jubilee Hills",
  tagline: "World-class outpatient consultation & specialist care in Hyderabad",
  logo: "/images/logo.svg",
  favicon: "/favicon.ico",
  theme: {
    primary: "#0284c7", // Trustworthy Sky/Teal
    primaryForeground: "#ffffff",
    accent: "#0d9488", // Calming Medical Teal
    accentForeground: "#ffffff",
    radius: "0.625rem",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  contact: {
    phones: ["+91 40 2360 7777", "+91 91212 34567"],
    whatsapp: "+919121234567",
    email: "consultations@jubileehills-clinic.demo",
    address: "Road No. 72, Opposite Bharatiya Vidya Bhavan, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033",
    locality: "Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.9936855132204!2d78.40698187588825!3d17.412071801458896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb96dc20d2d385%3A0x6b4db3b2e3f01fa2!2sApollo%20Hospitals%20Jubilee%20Hills!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
    directionsUrl: "https://maps.google.com/?q=Apollo+Hospitals+Jubilee+Hills+Hyderabad",
    coordinates: {
      lat: 17.412072,
      lng: 78.406982,
    },
  },
  hours: {
    schedule: {
      "Monday – Friday": "08:30 AM – 08:00 PM",
      "Saturday": "08:30 AM – 06:00 PM",
      "Sunday": "09:00 AM – 01:00 PM (Select Specialists)",
    },
    emergencyNote: "For critical medical emergencies, please visit the 24/7 Trauma Care Center directly or call 1066.",
  },
  about: {
    intro: "Serving Jubilee Hills, Banjara Hills, and greater Hyderabad with patient-centered outpatient medical consultations. Our outpatient center brings together seasoned clinicians across eight primary and tertiary specialties, providing streamlined clinical assessments without prolonged hospital waiting times.",
    mission: "To deliver prompt, ethical, and evidence-guided clinical consultations in a tranquil environment where doctor-patient conversations receive the time and focus they deserve.",
    whyUs: [
      {
        title: "Senior Medical Consultants",
        description: "Direct consultations with senior specialists possessing 10 to 25+ years of clinical and academic expertise.",
        icon: "Stethoscope",
      },
      {
        title: "Punctual Consultations",
        description: "Dedicated 15-minute appointment slots planned to respect your schedule with minimal waiting room delays.",
        icon: "Clock",
      },
      {
        title: "Zero Account Friction",
        description: "Book directly with your mobile number. No forced passwords, app downloads, or complex registration hurdles.",
        icon: "Smartphone",
      },
      {
        title: "Central Hyderabad Location",
        description: "Conveniently situated on Road No. 72 Jubilee Hills with hassle-free valet parking and barrier-free wheelchair access.",
        icon: "MapPin",
      },
    ],
    establishedYear: 1988,
    stats: [
      { label: "Specialty Departments", value: "8+" },
      { label: "Consultant Doctors", value: "8" },
      { label: "Years in Hyderabad", value: "35+" },
      { label: "Patient Satisfaction", value: "98.4%" },
    ],
  },
  seo: {
    titleTemplate: "%s | Apollo Jubilee Hills Outpatient Clinic",
    defaultTitle: "Apollo Hospitals Jubilee Hills Clinic | Book Doctor Consultation in Hyderabad",
    description: "Book confirmed doctor consultations at Apollo Hospitals Outpatient Clinic, Jubilee Hills, Hyderabad. Specialists in Cardiology, Orthopaedics, Paediatrics, Gynaecology, Dermatology, and more.",
    ogImage: "/images/hero-banner.svg",
    city: "Hyderabad",
    localityKeywords: [
      "Jubilee Hills",
      "Banjara Hills",
      "Film Nagar",
      "Madhapur",
      "Hitec City",
      "Gachibowli",
      "Hyderabad",
    ],
  },
  booking: {
    slotDurationMinutes: 15,
    bookingWindowDays: 30,
    minLeadTimeMinutes: 60,
    cancellationCutoffHours: 2,
    maxActiveBookingsPerPhone: 3,
    timezone: "Asia/Kolkata",
  },
  features: {
    showGallery: false,
    showTestimonials: true,
    showFAQ: true,
  },
  social: {
    twitter: "https://twitter.com",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
  },
  footer: {
    copyright: "© 2026 Apollo Hospitals - Jubilee Hills Clinic Demo. Reusable Clinic Template.",
    disclaimer: "Disclaimer: This website template demonstration uses fictional doctor profiles and representative clinic information for preview purposes. For medical emergencies, please dial emergency services immediately.",
    links: [
      { label: "Privacy Policy (DPDP Act)", href: "/#privacy" },
      { label: "Terms of Consultation", href: "/#terms" },
      { label: "Doctor Directory", href: "/#doctors" },
      { label: "Staff Login", href: "/admin/login" },
    ],
  },
  testimonials: [
    {
      name: "Suresh Konduru",
      locality: "Jubilee Hills, Road No. 36",
      rating: 5,
      review: "Booking a consultation for my mother with the cardiologist took less than a minute on my phone. We arrived 10 minutes prior, and the doctor saw us right on schedule without any crowded queue.",
      date: "August 2026",
    },
    {
      name: "Dr. Radhika Varma",
      locality: "Banjara Hills",
      rating: 5,
      review: "Clean, prompt, and thoroughly professional. The SMS reminders and simple rescheduling feature made it so easy to plan my follow-up visit between meetings.",
      date: "July 2026",
    },
    {
      name: "Arjun Reddy",
      locality: "Madhapur",
      rating: 5,
      review: "Refreshing to see a medical clinic that values patients' time. Clear consultation fee upfront, genuine doctors who listen, and zero unnecessary paperwork.",
      date: "June 2026",
    },
  ],
  faqs: [
    {
      question: "Do I need to create an account to book an appointment?",
      answer: "No. You only need your full name and a valid Indian mobile number. You will receive a unique appointment reference code (e.g. CLN-7K3Q9X) that lets you view, reschedule, or cancel your appointment at any time.",
      category: "Booking",
    },
    {
      question: "How far in advance can I book a doctor consultation?",
      answer: "Consultations can be booked up to 30 days in advance. Slots open automatically on a rolling daily basis.",
      category: "Booking",
    },
    {
      question: "What happens if I need to cancel or reschedule my appointment?",
      answer: "You can easily cancel or reschedule your consultation using your reference number and registered phone number up to 2 hours before the scheduled time at no penalty.",
      category: "Changes & Cancellation",
    },
    {
      question: "What should I bring for my doctor consultation?",
      answer: "Please bring your appointment reference code, any previous medical records or discharge summaries, and a list of current medications you are taking.",
      category: "Consultation",
    },
    {
      question: "Are emergency consultations handled through this website?",
      answer: "No. This booking system is exclusively for scheduled outpatient consultations. If you or someone with you requires immediate or emergency medical care, please visit the 24/7 Emergency Care Wing on Road No. 72 or call 1066 immediately.",
      category: "Emergency",
    },
  ],
};
