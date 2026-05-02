export const countries = [
  {
    nationality: "Sri Lankan",
    country: "Sri Lanka",
    code: "+94",
    placeholder: "715648460",
    minLength: 9,
    maxLength: 9,
    groupPattern: [2, 2, 2, 3],
  },
  {
    nationality: "Indian",
    country: "India",
    code: "+91",
    placeholder: "9876543210",
    minLength: 10,
    maxLength: 10,
    groupPattern: [5, 5],
  },
  {
    nationality: "British",
    country: "United Kingdom",
    code: "+44",
    placeholder: "7123456789",
    minLength: 10,
    maxLength: 10,
    groupPattern: [4, 3, 3],
  },
  {
    nationality: "American",
    country: "United States",
    code: "+1",
    placeholder: "2025550188",
    minLength: 10,
    maxLength: 10,
    groupPattern: [3, 3, 4],
  },
  {
    nationality: "Australian",
    country: "Australia",
    code: "+61",
    placeholder: "412345678",
    minLength: 9,
    maxLength: 9,
    groupPattern: [3, 3, 3],
  },
  {
    nationality: "Chinese",
    country: "China",
    code: "+86",
    placeholder: "13800138000",
    minLength: 11,
    maxLength: 11,
    groupPattern: [3, 4, 4],
  },
  {
    nationality: "German",
    country: "Germany",
    code: "+49",
    placeholder: "15123456789",
    minLength: 10,
    maxLength: 11,
    groupPattern: [3, 4, 4],
  },
  {
    nationality: "French",
    country: "France",
    code: "+33",
    placeholder: "612345678",
    minLength: 9,
    maxLength: 9,
    groupPattern: [1, 2, 2, 2, 2],
  },
  {
    nationality: "Japanese",
    country: "Japan",
    code: "+81",
    placeholder: "9012345678",
    minLength: 10,
    maxLength: 10,
    groupPattern: [2, 4, 4],
  },
  {
    nationality: "Other",
    country: "Other",
    code: "+",
    placeholder: "Enter full number",
    minLength: 6,
    maxLength: 15,
    groupPattern: [3, 3, 3, 3, 3],
  },
];

export const getDefaultCountry = () => countries[0];

export const getCountryByNationality = (nationality) => {
  return countries.find((item) => item.nationality === nationality) || countries[0];
};

export const getCountryByCountryName = (countryName) => {
  return countries.find((item) => item.country === countryName) || countries[0];
};

export const onlyDigits = (value) => {
  return String(value || "").replace(/\D/g, "");
};

export const groupPhoneDigits = (digits, groupPattern) => {
  const cleanDigits = onlyDigits(digits);

  if (!cleanDigits) return "";

  const groups = [];
  let start = 0;

  for (const size of groupPattern) {
    if (start >= cleanDigits.length) break;

    groups.push(cleanDigits.slice(start, start + size));
    start += size;
  }

  if (start < cleanDigits.length) {
    groups.push(cleanDigits.slice(start));
  }

  return groups.filter(Boolean).join(" ");
};

export const formatCountryPhone = (countryData, localNumber) => {
  const digits = onlyDigits(localNumber);

  if (!digits) {
    return `${countryData.code} ${groupPhoneDigits(
      countryData.placeholder,
      countryData.groupPattern
    )}`;
  }

  if (countryData.code === "+") {
    return digits;
  }

  return `${countryData.code} ${groupPhoneDigits(
    digits,
    countryData.groupPattern
  )}`.trim();
};

export const validateCountryPhone = (countryData, localNumber) => {
  const digits = onlyDigits(localNumber);

  if (!digits) {
    return {
      valid: false,
      message: "WhatsApp / phone number is required",
    };
  }

  if (
    digits.length < countryData.minLength ||
    digits.length > countryData.maxLength
  ) {
    return {
      valid: false,
      message: `${countryData.country} phone number must be ${
        countryData.minLength
      }${
        countryData.minLength !== countryData.maxLength
          ? `-${countryData.maxLength}`
          : ""
      } digits after ${countryData.code}. Example: ${formatCountryPhone(
        countryData,
        countryData.placeholder
      )}`,
    };
  }

  return {
    valid: true,
    message: "",
  };
};