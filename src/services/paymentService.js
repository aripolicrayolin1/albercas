import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api';
const PROCESSING_DELAY = 1200; // ms

export const paymentService = {
  processPayment: async ({ userId, userName, paymentTypeId, paymentTypeName, amount, method }) => {
    await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY));

    // Simulación de pasarela de pago (98% éxito)
    const success = Math.random() > 0.02;

    if (success) {
      const transaction = {
        id: `p${Date.now()}`,
        userId,
        userName,
        type: paymentTypeName,
        amount,
        method,
        status: 'completado',
        date: new Date().toISOString().split('T')[0],
        reference: `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      try {
        // PERISTENCIA REAL EN LA BASE DE DATOS
        await axios.post(`${API_URL}/payments`, transaction);
        return { success: true, transaction };
      } catch (err) {
        return { success: false, error: 'Error al persistir el pago en el servidor municipal.' };
      }
    } else {
      return { success: false, error: 'Pago declinado por la red bancaria.' };
    }
  },

  validatePaymentMethod: (method, details) => {
    if (method === 'Tarjeta') {
      if (!details?.cardNumber || details.cardNumber.replace(/\s/g, '').length < 16) {
        return { valid: false, error: 'Número de tarjeta inválido' };
      }
    }
    return { valid: true };
  },

  getPaymentMethods: () => [
    { id: 'efectivo', label: 'Efectivo', icon: 'Banknote' },
    { id: 'tarjeta', label: 'Tarjeta', icon: 'CreditCard' },
    { id: 'transferencia', label: 'Transferencia', icon: 'Landmark' },
  ],
};
