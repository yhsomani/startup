import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface PaymentFormProps {
  courseId?: string;
  courseTitle?: string;
  amount: number;
  currency?: string;
  onPaymentSuccess: (transactionId: string, paymentId: string) => void;
  onPaymentError: (error: string) => void;
  isEnrolled?: boolean;
}

const PaymentFormInner: React.FC<PaymentFormProps> = ({
  courseId,
  courseTitle,
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Create payment intent when component mounts or amount changes
  useEffect(() => {
    if (courseId && amount > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [courseId, amount]);

  const createPaymentIntent = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const response = await api.post('/payments/create-payment-intent', {
        amount,
        currency,
        courseId
      });

      setClientSecret(response.data.clientSecret);
      setPaymentIntentId(response.data.paymentIntentId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create payment intent';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Customer Name', // In production, get from user profile
            email: 'customer@example.com', // In production, get from user profile
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment with our backend
        const confirmResponse = await api.post('/payments/confirm-payment', {
          paymentIntentId: paymentIntentId
        });

        onPaymentSuccess(confirmResponse.data.transactionId, paymentIntentId!);

        // Reset form
        setClientSecret(null);
        setPaymentIntentId(null);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
    hidePostalCode: true,
  };

  if (!clientSecret) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        margin: '1rem auto'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            {isProcessing ? 'Initializing Payment...' : 'Ready to Pay'}
          </h3>
          {!isProcessing && (
            <button
              onClick={createPaymentIntent}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Initialize Payment
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      maxWidth: '500px',
      margin: '1rem auto'
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Complete Your Purchase
        </h2>
        {courseTitle && (
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            {courseTitle}
          </p>
        )}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Total Amount:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5' }}>
              ${amount} {currency}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Card Information
          </label>
          <div style={{
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0.75rem',
            backgroundColor: '#fafafa'
          }}>
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <span>🔒</span>
          <span>Your payment information is encrypted and secure</span>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          style={{
            width: '100%',
            padding: '0.875rem',
            backgroundColor: isProcessing ? '#9ca3af' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: isProcessing ? 'wait' : 'pointer',
            opacity: isProcessing ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isProcessing ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Processing...
            </>
          ) : (
            <>Pay ${amount} {currency}</>
          )}
        </button>
      </form>

      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#9ca3af'
      }}>
        <p>Powered by Stripe</p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  if (!props.courseId) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem auto',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#dc2626' }}>
          Please select a course before proceeding with payment.
        </p>
      </div>
    );
  }

  if (!props.isEnrolled) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem auto',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>
          You must enroll in this course before purchasing access.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default PaymentForm;