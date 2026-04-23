"use server";

/**
 * Valida el PIN de modo manual en el servidor.
 * El PIN se lee de la variable de entorno MANUAL_PIN (sin prefijo NEXT_PUBLIC_).
 * Nunca se expone al cliente.
 */
export async function validateManualPin(pin: string): Promise<boolean> {
  const serverPin = process.env.MANUAL_PIN;
  if (!serverPin) return false;
  return pin.trim() === serverPin.trim();
}
