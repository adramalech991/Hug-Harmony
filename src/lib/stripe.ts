/* eslint-disable @typescript-eslint/no-explicit-any */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not defined in environment variables, using dummy key for build');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
    apiVersion: '2025-01-27.acacia' as any, // Use latest or pinned version
    typescript: true,
});

export default stripe;
