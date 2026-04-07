// Mock Payment Gateway Service
let transactionCount = 1000;

const PROCESSING_DELAY = 1500; // ms

export const paymentService = {
  processPayment: async ({ userId, userName, paymentTypeId, paymentTypeName, amount, method }) => {
    await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    transactionCount++;

    if (success) {
      const reference = `REF-${new Date().getFullYear()}-${transactionCount}`;
      return {
        success: true,
        transaction: {
          id: `p${Date.now()}`,
          userId,
          userName,
          type: paymentTypeName,
          amount,
          method,
          status: 'completado',
          date: new Date().toISOString().split('T')[0],
          reference,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        error: 'Pago declinado. Verifique los datos del método de pago.',
      };
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
    { id: 'efectivo', label: 'Efectivo', icon: '💵' },
    { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { id: 'transferencia', label: 'Transferencia', icon: '🏦' },
  ],
};
