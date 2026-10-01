/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 *
 * All homepage content for WAMARK Nigeria Limited.
 */

export const topbar = {
  email: "info@wamarkng.com",
  phone: "+234 803 7650 357",
  hours: "Mon to Fri: 09:00AM - 05:00PM",
};

export const nav = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about-us/",
    children: [
      { label: "About Us", href: "/about-us/" },
      { label: "Management", href: "/management/" },
    ],
  },
  {
    label: "Services",
    href: "/services/",
  },
  { label: "Projects", href: "/projects/" },
  { label: "Contact Us", href: "/contact-us/" },
];

export const hero = {
  tag: "Security & Surveillance",
  title: "Advanced Security Systems",
  text: "From CCTV and access control to technical surveillance countermeasures, WAMARK provides cutting-edge security solutions to safeguard assets and maintain peace of mind for clients.",
  cta: { label: "Learn More", href: "/services/" },
};

export const features = [
  {
    no: "01",
    icon: "/images/icons/svg-33.svg",
    title: (
      <>
        Security
        <br />
        Systems
      </>
    ),
    text: "CCTV, access control, and intrusion protection for businesses.",
    modalTitle: "Security System Installations",
    modal: {
      intro: "Supply and Installation of Security Equipment and Access Control.",
      bullets: [
        "Supply and Installation of Access control system and solutions.",
        "CCTV Installation.",
        "Metal detector, Baggage Scanner, Explosive detector",
        "Supply of Overt and Covert Bulletproof Jackets",
        "Cooperate Security layout and planning.",
        "Provision of coordinated corporate vehicle tracking systems.",
        "Supply and Installation of Sensor based Intrusion systems.",
        "Supply and Installation of Anti-finger metal security fencing (Interior and Exterior).",
        "Setting up security center for Command, Control and Surveillance.",
        "Cyber security Training.",
      ],
      images: [
        "/images/cctv.webp",
        "/images/airport-detector.webp",
        "/images/cybersecurity-1.webp",
      ],
    },
  },
  {
    no: "02",
    icon: "/images/icons/svg-36.svg",
    title: (
      <>
        Technical
        <br />
        Surveillance
      </>
    ),
    text: "Advanced detection and counter-surveillance solutions.",
    modalTitle: "Technical Surveillance",
    modal: {
      intro:
        "PROVISION OF TECHNICAL SURVEILLANCE (TSU) EQUIPMENT, TECHNICAL SURVEILLANCE COUNTERMEASURES (TSCM), CONSULTANCY SERVICES TO GOVERNMENT AGENCIES, MULTINATIONAL CORPORATIONS, AND VIP'S.",
      bullets: [
        "Supply of Tactical and Strategic System – Real time Multi-technical Services",
        "Electronic eavesdropping detection.",
        "Anti-surveillance services.",
        "Covert camera and transmitter detection",
        "Technical security.",
        "Vetting of Individuals and Cooperate organizations.",
      ],
      images: [
        "/images/imsi-catcher-system.webp",
        "/images/project-at-12-07-55_f4d81555.webp",
        "/images/airport-detector.webp",
      ],
    },
  },
  {
    no: "03",
    icon: "/images/icons/svg-39.svg",
    title: (
      <>
        Oil &amp; Gas
        <br />
        Solutions
      </>
    ),
    text: "Expert pipeline, plant, and flow measurement services.",
    modalTitle: "Oil & Gas Solutions",
    modal: {
      intro: "Oil and Gas Services Includes:",
      bullets: [
        "Flow Measurement Technology.",
        "Fire and Gas Systems.",
        "Plant Installations and Pipeline Maintenance.",
        "Pipeline Security and Surveillance.",
        "Oil and Gas Measurement/Equipment",
      ],
      images: [
        "/images/oilgas.webp",
        "/images/project-0005.webp",
        "/images/project-3.webp",
      ],
    },
  },
];

export const about = {
  tag: "About Us",
  title: "Proven Expertise in Serving Agencies",
  paragraphs: [
    <>
      WAMARK Nigeria Limited is a foremost company specializing in{" "}
      <strong>
        Corporate Security Intelligence Operations, Training anad Oil &amp; Gas
        Services
      </strong>
      . Established in <strong>2017</strong>, we bring together a team of
      experienced engineers, project managers, and retired security
      intelligence operatives.
    </>,
    <>
      Our expertise covers{" "}
      <strong>
        mechanical installations, pipeline maintenance, surveillance, and
        security systems
      </strong>
      , delivering reliable solutions to{" "}
      <strong>corporations, VIPs, and government agencies</strong> across
      Nigeria.
    </>,
  ],
  mission:
    "Our mission is to deliver world-class security surveillance systems, cutting-edge technical solutions, and oil & gas services through a team of experienced professionals—ensuring safety, efficiency, and long-term value for our clients.",
  vision:
    "To be a leading provider of innovative Security, Technical solutions and Oil & Gas sector in Africa, trusted for excellence, reliability, and sustainable impact.",
};

export const clients = [
  { name: "Federal Government", logo: "/images/cross-river-state-gov-t.webp" },
  { name: "Adamawa State Government", logo: "/images/adamawa-state-gov-t.webp" },
  { name: "NNPC", logo: "/images/nnpc-2.webp" },
  { name: "NNPC Limited", logo: "/images/nnpc-ltd.webp" },
];

export const stats = [
  { value: 10, suffix: "+", label: "Proven impacts" },
  { value: 120, suffix: "+", label: "Projects Done" },
  { value: 10, suffix: "+", label: "Team Advisors" },
  { value: 50, suffix: "+", label: "Active Clients" },
];

export const services = [
  {
    title: "Technical Surveillance & Countermeasures",
    text: "Bug sweeps, detect and neutralize hidden microphones, cameras, and GPS trackers.",
    image: "/images/airport-detector.webp",
    icon: "/images/icons/svg-33.svg",
  },
  {
    title: "Security Systems Installation",
    text: "Comprehensive CCTV surveillance, smart access control, and intrusion detection systems to ensure total facility protection.",
    image: "/images/cctv.webp",
    icon: "/images/icons/svg-36.svg",
  },
  {
    title: "Oil & Gas Services",
    text: "Comprehensive pipeline, plant, and flow measurement solutions that drive safety, efficiency, and compliance in the sector.",
    image: "/images/oilgas.webp",
    icon: "/images/icons/svg-39.svg",
  },
  {
    title: "Fire & Safety Systems",
    text: "Installation of fire alarms, gas detectors, and safety systems",
    image: "/images/imsi-catcher-system.webp",
    icon: "/images/icons/svg-45.svg",
  },
  {
    title: "Cybersecurity Services",
    text: "Advanced monitoring, detection, and anti-surveillance solutions.",
    image: "/images/cybersecurity-1.webp",
    icon: "/images/icons/svg-48.svg",
  },
  {
    title: "Corporate Security Planning",
    text: "Custom layouts, vetting, and vehicle tracking for businesses.",
    image: "/images/vehicle-tracking.webp",
    icon: "/images/icons/svg-49.svg",
  },
];

export const products = [
  { image: "/images/nnpc.webp", alt: "Flow measurement equipment" },
  { image: "/images/project-4.webp", alt: "Access control turnstile" },
  { image: "/images/project-1-780x694.webp", alt: "CCTV kit" },
  { image: "/images/azura-power.webp", alt: "Safety systems" },
];

export const offers = [
  {
    icon: "/images/icons/svg-39.svg",
    title: (
      <>
        Integrated Oil
        <br />
        &amp; Gas Expertise
      </>
    ),
    text: "Proven capacity in pipeline maintenance, plant installations, and flow measurement technology. Oil and Gas Measurement/Equipment",
  },
  {
    icon: "/images/icons/svg-36.svg",
    title: (
      <>
        Advanced Security &amp;
        <br />
        Surveillance Solutions
      </>
    ),
    text: "Cutting-edge technical surveillance, countermeasures, and security equipment supply for corporations, VIPs, and government agencies.",
  },
  {
    icon: "/images/icons/svg-47.svg",
    title: (
      <>
        Professional Team
        <br />
        &amp; Reliable Delivery
      </>
    ),
    text: "Experienced engineers and security intelligence professionals with a track record of successful projects for government agnecies NNPC, NPDC, and top institutions.",
  },
];

export const portfolio = [
  "/images/project-4.webp",
  "/images/project-1-780x694.webp",
  "/images/cctv.webp",
  "/images/oilgas.webp",
];

export const posts = [
  {
    title: "Test Post 3",
    date: "September 4, 2025",
    image: "/images/picture1.webp",
    excerpt: "Test Post 3",
  },
  {
    title: "Test Post 2",
    date: "September 4, 2025",
    image: "/images/cctv.webp",
    excerpt: "Test Post 2",
  },
  {
    title: "Test Post 1",
    date: "September 4, 2025",
    image: "/images/vehicle-tracking.webp",
    excerpt: "Test Post 1",
  },
];

export const testimonials = [
  {
    quote:
      "WAMARK delivered our office upgrade and remodeling project with precision and professionalism. Their expertise in Oil & Gas facility services and commitment to quality exceeded our expectations.",
    name: "Engr. Musa Ibrahim",
    role: "Project Director, NNPC-Enserv",
  },
  {
    quote:
      "From pipeline maintenance to surveillance systems, WAMARK has consistently delivered reliable solutions. Their experienced engineers and intelligence-trained staff make them a trusted partner in our projects.",
    name: "Ahmed Lawal",
    role: "Operations Manager, NPDC Ltd",
  },
  {
    quote:
      "The CCTV and access control system installed by WAMARK has transformed our security operations. Their team was responsive, efficient, and provided excellent after-service support.",
    name: "Chinwe Okafor",
    role: "Head of Security, University of Nigeria – Teaching Hospital",
  },
];

export const contactInfo = {
  location:
    "Plot 1909, Cadastral Zone E27, Apo Resettlement, Abuja-FCT, Nigeria.",
  phones: "+2348037650357, +2348186318527",
};

export const footer = {
  about:
    "Nigeria Limited is a foremost company which specializes in Oil and Gas Services, Corporate Security Intelligence Operations and Training.",
  services: [
    "Technical Surveillance & Countermeasures",
    "Oil & Gas Services",
    "Access Control & Security Systems",
    "Fire & Safety Systems",
    "Cybersecurity Training",
    "Corporate Security Planning",
  ],
  links: ["Support", "Privacy Policy", "Terms Of Use", "Site Map", "Expert Testimony"],
  socials: [
    { label: "Facebook", icon: "/images/icons/svg-9.svg", href: "#" },
    { label: "X (Twitter)", icon: "/images/icons/svg-11.svg", href: "#" },
    { label: "Instagram", icon: "/images/icons/svg-10.svg", href: "#" },
  ],
};
