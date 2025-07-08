declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const initializePaystack = () => {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      resolve(window.PaystackPop);
    };
    document.head.appendChild(script);
  });
};

export const processPayment = async (
  email: string,
  amount: number,
  onSuccess: (reference: string) => void,
  onCancel: () => void
) => {
  const PaystackPop = await initializePaystack();
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('Paystack public key not configured');
  }

  const handler = PaystackPop.setup({
    key: publicKey,
    email,
    amount: amount * 100, // Convert to kobo
    currency: 'NGN',
    callback: (response: any) => {
      onSuccess(response.reference);
    },
    onClose: () => {
      onCancel();
    },
  });

  handler.openIframe();
};