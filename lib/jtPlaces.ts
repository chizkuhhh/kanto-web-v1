// Place names accepted for each J&T zone.

export const JT_PLACES: Record<string, string[]> = {
  "Metro Manila": [
    "Metro Manila", "NCR", "National Capital Region", "Metropolitan Manila",
    "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Manila", "Marikina",
    "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "Pateros", "Quezon City",
    "San Juan", "Taguig", "Valenzuela",
  ],

  "Nearby Luzon": [
    "Cavite", "Laguna", "Bulacan", "Rizal", "Batangas", "Pampanga", "Bataan",
    "Nueva Ecija", "Tarlac", "Zambales", "Quezon",
    "Bacoor", "Imus", "Dasmariñas", "General Trias", "Tagaytay", "Cabuyao", "Calamba",
    "Santa Rosa", "San Pedro", "Biñan", "Bocaue", "Meycauayan", "Malolos", "Marilao",
    "Antipolo", "Cainta", "Taytay", "Batangas City", "Lipa", "Angeles City",
    "Olongapo", "Balanga", "Tarlac City", "Cabanatuan",
  ],

  "Far Luzon": [
    "Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan", "Cagayan", "Isabela",
    "Nueva Vizcaya", "Quirino", "Apayao", "Kalinga", "Abra", "Mountain Province",
    "Ifugao", "Benguet", "Aurora", "Albay", "Camarines Norte", "Camarines Sur",
    "Catanduanes", "Masbate", "Sorsogon", "Palawan",
    "Baguio", "Laoag", "Vigan", "Dagupan", "Tuguegarao", "Ilagan", "Legazpi", "Naga",
    "Puerto Princesa", "Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Mindoro",
    "Boac", "Calapan", "Mamburao", "Puerto Galera",
  ],

  "Visayas": [
    "Cebu", "Cebu City", "Mandaue", "Lapu-Lapu", "Talisay",
    "Bohol", "Tagbilaran",
    "Negros Occidental", "Bacolod", "Negros Oriental", "Dumaguete",
    "Iloilo", "Iloilo City", "Capiz", "Roxas City", "Aklan", "Kalibo", "Antique", "Guimaras",
    "Leyte", "Tacloban", "Ormoc", "Southern Leyte", "Biliran",
    "Samar", "Western Samar", "Northern Samar", "Eastern Samar", "Siquijor",
  ],

  "Mindanao": [
    "Davao", "Davao City", "Davao del Sur", "Davao del Norte", "Davao de Oro",
    "Davao Oriental", "Davao Occidental",
    "Zamboanga", "Zamboanga City", "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay",
    "Cagayan de Oro", "Misamis Oriental", "Misamis Occidental", "Bukidnon",
    "Lanao del Norte", "Lanao del Sur", "Iligan", "Marawi",
    "Agusan del Norte", "Agusan del Sur", "Butuan",
    "Surigao del Norte", "Surigao del Sur",
    "South Cotabato", "General Santos", "Koronadal",
    "North Cotabato", "Cotabato", "Kidapawan", "Cotabato City", "Maguindanao",
    "Sultan Kudarat", "Sarangani", "Basilan",
  ],

  "Remote islands": [
    "Batanes", "Basco", "Sulu", "Jolo", "Tawi-Tawi", "Bongao", "Camiguin", "Siargao", 
    "Romblon", "Dinagat Islands", "Dinagat", "Romblon Island",
  ],
}

// Lowercases, strips accents, and turns punctuation into spaces.
// Words are kept, so "Quezon" and "Quezon City" stay different.
export function normalizePlace(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}