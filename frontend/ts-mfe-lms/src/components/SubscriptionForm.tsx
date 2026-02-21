import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface SubscriptionFormProps {
  onSubscriptionSuccess: (subscriptionId: string) => void;
  onSubscriptionError: (error: string) => void;
  currentSubscription?: {
    id: string;
    tier: string;
    status: string;
    endDate?: string;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic',
    tier: 'basic',
    price: 9.99,
    currency: 'USD',
    features: [
      'Access to 50+ courses',
      'Basic certificate',
      'Email support',
      'Mobile access'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Professional',
    tier: 'pro',
    price: 19.99,
    currency: 'USD',
    features: [
      'Access to 200+ courses',
      'Premium certificates',
      'Priority support',
      'Mobile & desktop access',
      'Offline downloads',
      'Live sessions'
    ],
    popular: true
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 49.99,
    currency: 'USD',
    features: [
      'Unlimited course access',
      'Custom certificates',
      'Dedicated support',
      'All platforms access',
      'Offline downloads',
      'Live sessions & workshops',
      'Team management',
      'Custom content'
    ]
  }
];

const SubscriptionFormInner: React.FC<SubscriptionFormProps> = ({
  onSubscriptionSuccess,
  onSubscriptionError
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS[1]); // Default to Pro
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setClientSecret(null);
    setSubscriptionId(null);
    setError(null);
  };

  const createSubscriptionIntent = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const response = await api.post('/payments/create-subscription', {
        tier: selectedPlan.tier,
        price: selectedPlan.price,
        currency: selectedPlan.currency
      });

      // For demo purposes, we'll simulate Stripe subscription creation
      // In production, you would use Stripe Checkout or Subscription API
      setClientSecret(`sk_test_${Date.now()}`);
      setSubscriptionId(response.data.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create subscription';
      setError(errorMessage);
      onSubscriptionError(errorMessage);
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

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm card payment for subscription
      const { error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: 'Subscriber Name',
          email: 'subscriber@example.com',
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // In production, you would attach this payment method to the subscription
      // For demo purposes, we'll simulate success
      setTimeout(() => {
        onSubscriptionSuccess(subscriptionId!);
        setIsProcessing(false);
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Subscription failed';
      setError(errorMessage);
      onSubscriptionError(errorMessage);
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
        maxWidth: '800px',
        margin: '1rem auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Choose Your Subscription Plan
          </h2>
          <p style={{ color: '#6b7280' }}>
            Unlock unlimited access to our entire course library
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanSelect(plan)}
              style={{
                border: selectedPlan.id === plan.id ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: selectedPlan.id === plan.id ? '#f8faff' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  POPULAR
                </div>
              )}

              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#4f46e5' }}>
                  ${plan.price}
                </span>
                <span style={{ color: '#6b7280', marginLeft: '0.25rem' }}>/month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={createSubscriptionIntent}
            disabled={isProcessing}
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: isProcessing ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: isProcessing ? 'wait' : 'pointer',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? 'Processing...' : `Continue with ${selectedPlan.name} Plan`}
          </button>
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
          Complete Your Subscription
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {selectedPlan.name} Plan - ${selectedPlan.price}/month
        </p>
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Monthly Total:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5' }}>
              ${selectedPlan.price} USD
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
            Payment Information
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
          <span>Your payment information is encrypted and secure. Cancel anytime.</span>
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
              Processing Subscription...
            </>
          ) : (
            <>Subscribe Now - ${selectedPlan.price}/month</>
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

const SubscriptionForm: React.FC<SubscriptionFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionFormInner {...props} />
    </Elements>
  );
};

export default SubscriptionForm;