const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "No se encontró la variable NEXT_PUBLIC_API_URL."
  );
}

export const API_URL = apiUrl.replace(/\/$/, "");