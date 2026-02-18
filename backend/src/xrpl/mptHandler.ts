// XRPL MPToken integration — stub implementation
//
// These functions return mock data until you're ready to connect a live XRPL node.
// When you're ready, install the `xrpl` package and replace the bodies below
// with real Client calls. The function signatures and return shapes stay the same
// so nothing else in the codebase changes.
//
// Testnet endpoint:  wss://s.altnet.rippletest.net:51233
// Mainnet endpoint:  wss://xrplcluster.com
//
// MPToken spec: https://xrpl.org/docs/concepts/tokens/fungible-tokens/multi-purpose-tokens

import { logger } from '../utils/logger';

export async function getInvestorTokenBalance(walletAddress: string): Promise<number> {
  logger.debug('[XRPL stub] getInvestorTokenBalance', { walletAddress });
  // TODO: replace with:
  //   const client = new Client(process.env.XRPL_SERVER_URL);
  //   await client.connect();
  //   const resp = await client.request({ command: 'account_lines', account: walletAddress });
  //   const line = resp.result.lines.find(l => l.currency === process.env.XRPL_MPT_CURRENCY);
  //   return line ? parseFloat(line.balance) : 0;
  return 1000;
}

export async function getLedgerTransactionHistory(walletAddress: string): Promise<unknown[]> {
  logger.debug('[XRPL stub] getLedgerTransactionHistory', { walletAddress });
  // TODO: replace with:
  //   const resp = await client.request({ command: 'account_tx', account: walletAddress });
  //   return resp.result.transactions;
  return [];
}

export async function validateTokenIntegrity(walletAddress: string): Promise<boolean> {
  logger.debug('[XRPL stub] validateTokenIntegrity', { walletAddress });
  // TODO: verify the issuer address matches XRPL_MPT_ISSUER and currency = XRPL_MPT_CURRENCY
  return true;
}
