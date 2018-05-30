// @flow
import React, { Component } from 'react';
import type { Node } from 'react';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { storiesOf } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number, select } from '@storybook/addon-knobs';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import startCase from 'lodash/startCase';

// Assets and helpers
import StoryLayout from './support/StoryLayout';
import StoryProvider from './support/StoryProvider';
import StoryDecorator from './support/StoryDecorator';
import { generateTransaction, generateAddres, promise } from './support/utils';
import { formattedWalletAmount } from '../../source/renderer/app/utils/ada/formatters';
import { transactionStates, transactionTypes } from '../../source/renderer/app/domains/WalletTransaction';
import { assuranceModeOptions } from '../../source/renderer/app/types/transactionAssuranceTypes.js';

// Screens
import WalletSummary from '../../source/renderer/app/components/wallet/summary/WalletSummary';
import WalletSendForm from '../../source/renderer/app/components/wallet/WalletSendForm';
import WalletReceive from '../../source/renderer/app/components/wallet/WalletReceive';
import WalletTransactionsList from '../../source/renderer/app/components/wallet/transactions/WalletTransactionsList';
// import WalletSettings from '../../source/renderer/app/components/wallet/WalletSettings';


storiesOf('WalletScreens', module)

  .addDecorator((story, context) => {

    const storyWithKnobs = withKnobs(story, context);

    return (
      <StoryDecorator>
        <StoryProvider
          activeWallet={{}}
        >
          <StoryLayout
            storyName={context.story}
          >
            {storyWithKnobs}
          </StoryLayout>
        </StoryProvider>
      </StoryDecorator>
    )
  })

  // ====== Stories ======

  .add('Empty', () => false)

  .add('Wallet Navigation', () => (
    <div>&nbsp;</div>
  ))

  .add('Summary', () => (
    <WalletSummary
      walletName={text('Wallet name', 'Wallet name')}
      amount={text('Amount', '45119903750165.23')}
      pendingAmount={{
        incoming: new BigNumber(number('Incoming', 1)),
        outgoing: new BigNumber(number('Outgoing', 2)),
        total: new BigNumber(3)
      }}
      numberOfTransactions={number('Number of transactions', 20303585)}
      isLoadingTransactions={boolean('isLoadingTransactions', false)}
    />
  ))

  .add('Send', () => (
    <WalletSendForm
      currencyUnit="Ada"
      currencyMaxFractionalDigits={ 6}
      currencyMaxIntegerDigits={11}
      validateAmount={promise(true)}
      calculateTransactionFee={promise(true)}
      addressValidator={()=>{}}
      openDialogAction={()=>{}}
      isDialogOpen={()=> boolean('hasDialog', false)}
      isRestoreActive={boolean('isRestoreActive', false)}
    />
  ))

  .add('Receive', () => (
    <WalletReceive
      walletAddress={text('Wallet address', '5628aab8ac98c963e4a2e8cfce5aa1cbd4384fe2f9a0f3c5f791bfb83a5e02ds')}
      isWalletAddressUsed={boolean('isWalletAddressUsed', false)}
      walletAddresses={[
        ...Array.from(Array(number('Addresses', 1))).map(() => generateAddres()),
        ...Array.from(Array(number('Addresses (used)', 1))).map(() => generateAddres(true)),
      ]}
      onGenerateAddress={()=>{}}
      onCopyAddress={()=>{}}
      isSidebarExpanded
      walletHasPassword={boolean('walletHasPassword', false)}
      isSubmitting={boolean('isSubmitting', false)}
    />
  ))

  .add('Transactions', () => (
    <WalletTransactionsList
      transactions={[
        generateTransaction(transactionTypes.INCOME, new Date(), new BigNumber(1), 1),
        generateTransaction(transactionTypes.EXCHANGE, new Date(), new BigNumber(1)),
        generateTransaction(transactionTypes.EXPEND, moment().subtract(1, 'days').toDate(), new BigNumber(2), 0, transactionStates.PENDING),
        generateTransaction(transactionTypes.INCOME, moment().subtract(1, 'days').toDate(), new BigNumber(1), 0, transactionStates.FAILED),
        generateTransaction(transactionTypes.EXPEND, moment().subtract(2, 'days').toDate(), new BigNumber(3)),
        generateTransaction(transactionTypes.EXPEND, moment().subtract(3, 'days').toDate(), new BigNumber(5)),
      ]}
      isLoadingTransactions={false}
      hasMoreToLoad={false}
      assuranceMode={{ low: 1, medium: 2 }}
      walletId="test-wallet"
      formattedWalletAmount={formattedWalletAmount}
    />
  ));

  // .add('Settings', () => (
  //   <WalletSettings
  //     activeField={null}
  //     assuranceLevels={[
  //       {
  //         "value": assuranceModeOptions.NORMAL,
  //         "label": {
  //           id: 'global.assuranceLevel.normal',
  //           defaultMessage: '!!!Normal',
  //           description: ''
  //         }
  //       },
  //       {
  //         "value": assuranceModeOptions.STRICT,
  //         "label": {
  //           id: 'global.assuranceLevel.strict',
  //           defaultMessage: '!!!Strict',
  //           description: ''
  //         }
  //       }
  //     ]}
  //     isDialogOpen={()=>false}
  //     isInvalid={false}
  //     isSubmitting={false}
  //     isWalletPasswordSet={false}
  //     lastUpdatedField={null}
  //     nameValidator={()=>true}
  //     onCancelEditing={()=>{}}
  //     onFieldValueChange={()=>{}}
  //     onStartEditing={()=>{}}
  //     onStopEditing={()=>{}}
  //     openDialogAction={()=>{}}
  //     walletAssurance={assuranceModeOptions.NORMAL}
  //     walletName="Test wallet"
  //     walletPasswordUpdateDate={moment().subtract(1, 'month').toDate()}
  //   />
  // ));
