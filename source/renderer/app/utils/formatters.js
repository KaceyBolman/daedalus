// @flow
import BigNumber from 'bignumber.js';
import { DECIMAL_PLACES_IN_ADA, LOVELACES_PER_ADA } from '../config/numbersConfig';

export const formattedWalletAmount = (
  amount: BigNumber,
  withCurrency: boolean = true,
) => {
  let formattedAmount = amount.toFormat(DECIMAL_PLACES_IN_ADA);

  if (withCurrency) formattedAmount += ' ADA';

  return formattedAmount.toString();
};

export const formattedAmountToBigNumber = (amount: string) => {
  const cleanedAmount = amount.replace(/,/g, '');
  return new BigNumber(cleanedAmount !== '' ? cleanedAmount : 0);
};

export const formattedAmountToNaturalUnits = (amount: string): string => {
  const cleanedAmount = amount.replace('.', '').replace(/,/g, '').replace(/^0+/, '');
  return cleanedAmount === '' ? '0' : cleanedAmount;
};

export const formattedAmountWithoutTrailingZeros = (amount: string): string => (
  amount.replace(/0+$/, '').replace(/\.$/, '')
);

export const formattedAmountToLovelace = (amount: string): number => (
  parseInt(formattedAmountToBigNumber(amount).times(LOVELACES_PER_ADA), 10)
);
