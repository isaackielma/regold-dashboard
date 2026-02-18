import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { fetchHoldings, fetchOrders, createOrder, cancelOrder } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input, FormField } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Spinner';
import { formatEur, formatTokens, formatDate } from '../../utils/format';
import type { Order, OrderSide, OrderType, CreateOrderInput } from '../../types';

interface OrderFormState {
  side:             OrderSide;
  orderType:        OrderType;
  tokenAmount:      string;
  limitPriceEur:    string;
  protectedExitEur: string;
  investorNote:     string;
}

const INITIAL_FORM: OrderFormState = {
  side:             'buy',
  orderType:        'market',
  tokenAmount:      '',
  limitPriceEur:    '',
  protectedExitEur: '',
  investorNote:     '',
};

function orderTypeLabel(t: OrderType): string {
  return { market: 'Market', limit: 'Limit', protected: 'Protected Exit' }[t];
}

function orderTypeDescription(t: OrderType): string {
  return {
    market:    'Executes immediately at the current gold price.',
    limit:     'Executes only when the price reaches your target.',
    protected: 'Limit order with an automatic exit if the price moves against your position.',
  }[t];
}

function statusBadgeClass(status: Order['status']): string {
  const map: Record<Order['status'], string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    filled:    'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    rejected:  'bg-red-100 text-red-700',
    expired:   'bg-orange-100 text-orange-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-500';
}

function sideBadgeClass(side: OrderSide): string {
  return side === 'buy'
    ? 'bg-rebijoux-teal/10 text-rebijoux-teal'
    : 'bg-rebijoux-orange/10 text-rebijoux-orange';
}

interface OrderFormProps {
  currentPriceEur: number;
  tokenBalance:    number;
  onOrderPlaced:   () => void;
}

function OrderForm({ currentPriceEur, tokenBalance, onOrderPlaced }: OrderFormProps) {
  const [form,       setForm]       = useState<OrderFormState>(INITIAL_FORM);
  const [errors,     setErrors]     = useState<Partial<Record<keyof OrderFormState, string>>>({});
  const [status,     setStatus]     = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const qty     = parseFloat(form.tokenAmount) || 0;
  const lxPrice = parseFloat(form.limitPriceEur) || currentPriceEur;
  const execPx  = form.orderType === 'market' ? currentPriceEur : lxPrice;
  const estTotal = qty * execPx;
  const isBuy   = form.side === 'buy';

  function field<K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setStatus(null);
  }

  function fillPercent(pct: number) {
    if (form.side === 'sell') {
      field('tokenAmount', (Math.floor(tokenBalance * pct * 1000) / 1000).toString());
    }
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (qty <= 0)
      e.tokenAmount = 'Enter a valid quantity.';
    if (form.side === 'sell' && qty > tokenBalance)
      e.tokenAmount = `You only hold ${formatTokens(tokenBalance)} tokens.`;
    if (form.orderType !== 'market' && !form.limitPriceEur)
      e.limitPriceEur = 'Enter a limit price.';
    if (form.orderType === 'protected' && !form.protectedExitEur)
      e.protectedExitEur = 'Enter a Protected Exit price.';
    if (form.orderType === 'protected' && form.limitPriceEur && form.protectedExitEur) {
      const lx = parseFloat(form.limitPriceEur);
      const px = parseFloat(form.protectedExitEur);
      if (form.side === 'sell' && px >= lx)
        e.protectedExitEur = 'Protected Exit must be below your limit price for sell orders.';
      if (form.side === 'buy' && px <= lx)
        e.protectedExitEur = 'Protected Exit must be above your limit price for buy orders.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleReview() {
    if (validate()) setConfirming(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setStatus(null);
    try {
      const input: CreateOrderInput = {
        side:      form.side,
        orderType: form.orderType,
        tokenAmount: qty,
        ...(form.limitPriceEur    && { limitPriceEur:    parseFloat(form.limitPriceEur) }),
        ...(form.protectedExitEur && { protectedExitEur: parseFloat(form.protectedExitEur) }),
        ...(form.investorNote.trim() && { investorNote: form.investorNote.trim() }),
      };
      await createOrder(input);
      setStatus({
        type: 'success',
        message: `${isBuy ? 'Buy' : 'Sell'} order for ${formatTokens(qty)} tokens ${
          form.orderType === 'market' ? 'executed' : 'placed'
        } successfully.`,
      });
      setForm(INITIAL_FORM);
      setConfirming(false);
      onOrderPlaced();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order failed. Please try again.';
      setStatus({ type: 'error', message: msg });
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
      <h3 className="text-base font-semibold text-gray-800">Place an Order</h3>

      {currentPriceEur === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
          No gold price available today. Orders will execute at €0.00 until a price is loaded.
        </div>
      )}

      {/* Buy / Sell toggle */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Direction</p>
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {(['buy', 'sell'] as OrderSide[]).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => { field('side', side); setConfirming(false); }}
              className={clsx(
                'flex-1 py-2.5 text-sm font-semibold capitalize transition',
                form.side === side
                  ? side === 'buy' ? 'bg-rebijoux-teal text-white' : 'bg-rebijoux-orange text-white'
                  : 'text-gray-500 hover:bg-gray-50',
              )}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Order type selector */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Order Type</p>
        <div className="flex gap-2 flex-wrap">
          {(['market', 'limit', 'protected'] as OrderType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { field('orderType', t); setConfirming(false); }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
                form.orderType === t
                  ? 'bg-rebijoux-teal text-white border-rebijoux-teal'
                  : 'text-gray-500 border-gray-200 hover:border-rebijoux-teal hover:text-rebijoux-teal',
              )}
            >
              {orderTypeLabel(t)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">{orderTypeDescription(form.orderType)}</p>
      </div>

      {form.orderType !== 'market' && (
        <FormField label="Limit Price (EUR)" error={errors.limitPriceEur}>
          <Input
            type="number" min="0" step="0.01"
            placeholder={currentPriceEur > 0 ? currentPriceEur.toFixed(2) : '0.00'}
            value={form.limitPriceEur}
            onChange={(e) => field('limitPriceEur', e.target.value)}
            error={errors.limitPriceEur}
          />
        </FormField>
      )}

      {form.orderType === 'protected' && (
        <FormField label="Protected Exit Price (EUR)" error={errors.protectedExitEur}>
          <Input
            type="number" min="0" step="0.01"
            placeholder="Auto-exit if price crosses this level"
            value={form.protectedExitEur}
            onChange={(e) => field('protectedExitEur', e.target.value)}
            error={errors.protectedExitEur}
          />
          <p className="mt-1 text-xs text-gray-400">
            Your position exits automatically if the gold price reaches this level.
          </p>
        </FormField>
      )}

      <FormField label="Quantity (ReGold Tokens)" error={errors.tokenAmount} required>
        <Input
          type="number" min="0" step="0.01" placeholder="0.00"
          value={form.tokenAmount}
          onChange={(e) => field('tokenAmount', e.target.value)}
          error={errors.tokenAmount}
        />
        {form.side === 'sell' && tokenBalance > 0 && (
          <div className="flex gap-2 mt-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => fillPercent(pct)}
                className="flex-1 py-1 rounded border border-gray-200 text-xs font-medium text-gray-500 hover:border-rebijoux-teal hover:text-rebijoux-teal transition"
              >
                {pct === 1 ? 'MAX' : `${pct * 100}%`}
              </button>
            ))}
          </div>
        )}
        {form.side === 'sell' && (
          <p className="mt-1 text-xs text-gray-400">
            Available: {formatTokens(tokenBalance)} tokens
            {tokenBalance === 0 && ' — no tokens held yet'}
          </p>
        )}
      </FormField>

      {qty > 0 && (
        <div className="bg-rebijoux-beige rounded-md px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">Estimated Total</span>
          <span className={clsx('text-base font-semibold font-serif', isBuy ? 'text-rebijoux-teal' : 'text-rebijoux-orange')}>
            {formatEur(estTotal)}
          </span>
        </div>
      )}

      <FormField label="Internal Note (optional)">
        <Input
          type="text" placeholder="Reference or memo" maxLength={200}
          value={form.investorNote}
          onChange={(e) => field('investorNote', e.target.value)}
        />
      </FormField>

      {status && <Alert type={status.type} message={status.message} />}

      {confirming ? (
        <div className="rounded-lg border border-rebijoux-teal/40 bg-rebijoux-teal/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Confirm your order</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className={clsx('font-semibold capitalize', isBuy ? 'text-rebijoux-teal' : 'text-rebijoux-orange')}>
              {form.side}
            </span>{' '}
            {formatTokens(qty)} tokens
            {form.orderType !== 'market' ? ` at ${formatEur(parseFloat(form.limitPriceEur))}` : ' at market price'}
            {form.orderType === 'protected' ? ` · Protected Exit at ${formatEur(parseFloat(form.protectedExitEur))}` : ''}
            <br />
            <span className="text-gray-500">Estimated Total: </span>
            <strong>{formatEur(estTotal)}</strong>
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={submitting}>Cancel</Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleConfirm}
              className={clsx(!isBuy && 'bg-rebijoux-orange hover:bg-rebijoux-orange/90 focus:ring-rebijoux-orange')}
            >
              Confirm {isBuy ? 'Buy' : 'Sell'}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={handleReview}
          className={clsx('w-full', !isBuy && 'bg-rebijoux-orange hover:bg-rebijoux-orange/90 focus:ring-rebijoux-orange')}
        >
          Review {isBuy ? 'Buy' : 'Sell'} Order
        </Button>
      )}
    </div>
  );
}

interface OrderHistoryProps {
  orders:     Order[];
  onCancel:   (id: string) => void;
  cancelling: string | null;
}

function OrderHistory({ orders: list, onCancel, cancelling }: OrderHistoryProps) {
  if (list.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-sm text-gray-400">No orders yet. Your trade history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              {['Date', 'Side', 'Type', 'Tokens', 'Price', 'Total', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold uppercase', sideBadgeClass(o.side))}>{o.side}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{orderTypeLabel(o.orderType)}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{formatTokens(o.tokenAmount)}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700 text-right">
                  {o.executedPriceEur ? formatEur(o.executedPriceEur) : o.limitPriceEur ? formatEur(o.limitPriceEur) : '—'}
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900 text-right">{o.totalEur ? formatEur(o.totalEur) : '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusBadgeClass(o.status))}>{o.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  {o.status === 'pending' && (
                    <Button
                      variant="ghost"
                      onClick={() => onCancel(o.id)}
                      loading={cancelling === o.id}
                      className="text-xs py-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TradePage() {
  const holdingsAsync = useAsync(fetchHoldings);
  const [ordersKey,   setOrdersKey]   = useState(0);
  const [cancelling,  setCancelling]  = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const ordersAsync = useAsync(() => fetchOrders(100), [ordersKey]);

  function refreshOrders() { setOrdersKey((k) => k + 1); }

  const handleCancel = useCallback(async (id: string) => {
    setCancelling(id);
    setCancelError(null);
    try {
      await cancelOrder(id);
      refreshOrders();
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel order.');
    } finally {
      setCancelling(null);
    }
  }, []);

  if (holdingsAsync.loading) return <PageLoader />;

  // Only hard-crash on unexpected errors, not "no data" errors
  if (holdingsAsync.error && !holdingsAsync.error.includes('not found')) {
    return <Alert type="error" message={holdingsAsync.error} />;
  }

  // Use zeros if no holdings exist yet
  const h = holdingsAsync.data ?? {
    walletAddress:   '—',
    tokenBalance:    0,
    goldGrams:       0,
    pricePerGramEur: 0,
    currentValueEur: 0,
    lastUpdated:     new Date().toISOString(),
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900">Trade ReGold Tokens</h2>
        <p className="mt-1 text-sm text-gray-500">
          {h.pricePerGramEur > 0
            ? <>Current gold price: <span className="font-medium text-rebijoux-teal">{formatEur(h.pricePerGramEur)}</span> / gram · XRPL wallet {h.walletAddress}</>
            : 'No gold price available yet — contact your administrator'}
        </p>
      </div>

      {/* Portfolio snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Token Balance"  value={formatTokens(h.tokenBalance)}   sub="ReGold tokens held"       accent="teal"   />
        <StatCard label="Gold Equivalent" value={`${h.goldGrams.toFixed(2)} g`}  sub="999 fine recycled gold"   accent="teal"   />
        <StatCard label="Portfolio Value" value={formatEur(h.currentValueEur)}   sub={h.pricePerGramEur > 0 ? `at ${formatEur(h.pricePerGramEur)} / gram` : 'Price unavailable'} accent="orange" />
      </div>

      {/* Two-column: form | history */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2">
          <OrderForm
            currentPriceEur={h.pricePerGramEur}
            tokenBalance={h.tokenBalance}
            onOrderPlaced={refreshOrders}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Order History</h3>
            {ordersAsync.loading && <span className="text-xs text-gray-400">Refreshing…</span>}
          </div>

          {cancelError && <Alert type="error" message={cancelError} />}

          {ordersAsync.error ? (
            <Alert type="error" message={ordersAsync.error} />
          ) : (
            <OrderHistory
              orders={ordersAsync.data ?? []}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Market orders</strong> execute immediately at the current gold price.{' '}
          <strong>Limit orders</strong> execute when the price reaches your target.{' '}
          <strong>Protected Exit</strong> orders combine a limit price with an automatic exit to
          safeguard your position if the market moves adversely. All orders are recorded on the XRPL ledger.
        </p>
      </div>
    </div>
  );
}
