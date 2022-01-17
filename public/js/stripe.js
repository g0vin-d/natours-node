/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51KADQmSGBnwpt1NnVRxuN5xiU0lpiMKac6vwbXbUpR8AG2uuA0t3dBVCG9auUiNvwHQ4VjRye7Fex7q5PMprq01O00FAlux1qH'
);

export const bookTour = async (tourId) => {
  try {
    //1) get checkout session from api
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);

    console.log(session);

    // 2) redirect to stripe payment
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
