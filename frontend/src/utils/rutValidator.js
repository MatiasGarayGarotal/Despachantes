/**
 * Validadores para documentos de identidad uruguayos
 * - RUT: Registro Único Tributario (12 dígitos)
 * - CI: Cédula de Identidad (7-8 dígitos)
 */

/**
 * Valida un Número de Identidad Tributaria (RUT) uruguayo
 * Algoritmo DGI oficial con pesos [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
 */
function validateRUT(rut) {
    const digits = rut.replace(/\D/g, '');
    if (digits.length !== 12) return false;

    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + parseInt(digits[i]) * w, 0);
    const remainder = sum % 11;

    // remainder === 0 → dígito verificador = 0
    // remainder === 1 → inválido (DGI nunca asigna)
    // remainder >= 2 → dígito verificador = 11 - remainder
    if (remainder === 1) return false;
    const check = remainder === 0 ? 0 : 11 - remainder;

    return check === parseInt(digits[11]);
}

/**
 * Valida una Cédula de Identidad (CI) uruguaya
 */
function validateCI(ci) {
    const digits = ci.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 8) return false;

    const padded = digits.padStart(8, '0');
    const weights = [2, 9, 8, 7, 6, 3, 4];
    const sum = weights.reduce((acc, w, i) => acc + parseInt(padded[i]) * w, 0);
    const check = (10 - (sum % 10)) % 10;

    return check === parseInt(padded[7]);
}

/**
 * Dispatcher que valida según el tipo de documento
 */
export function getDocValidation(tipoDocumento, value) {
    if (!value || value.replace(/\D/g, '').length === 0) return 'empty';
    if (tipoDocumento === 'RUT') return validateRUT(value) ? 'valid' : 'invalid';
    if (tipoDocumento === 'CI') return validateCI(value) ? 'valid' : 'invalid';
    return 'empty';
}

export { validateRUT, validateCI };
