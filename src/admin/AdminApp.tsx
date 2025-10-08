import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Car, PriceRule } from '../shared/types';
import { deleteCar, deletePriceRule, getCars, getPriceRules, saveCar, savePriceRule } from './api';
import { getStoredToken, storeToken } from './auth';
import type { CarDraft, PriceRuleDraft } from './types';

const CAR_CATEGORIES: Car['category'][] = ['sedan', 'suv', 'luxury', 'vintage', 'other'];
const RULE_TYPES: PriceRule['type'][] = ['discount', 'surcharge', 'multiplier'];
const RULE_SCOPES: PriceRule['scope'][] = ['srinagar', 'outside_srinagar', 'weekend', 'custom'];

const EMPTY_CAR: CarDraft = {
  name: '',
  category: 'sedan',
  base_price: 0,
  per_km: 0,
  image_url: '',
  active: true,
};

const EMPTY_RULE: PriceRuleDraft = {
  rule_name: '',
  type: 'discount',
  scope: 'srinagar',
  value: 0,
  active: true,
};

type TabKey = 'cars' | 'rules';

export function AdminApp(): JSX.Element {
  const [token, setToken] = useState<string>(() => getStoredToken());
  const [activeTab, setActiveTab] = useState<TabKey>('cars');
  const [cars, setCars] = useState<Car[]>([]);
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [carDraft, setCarDraft] = useState<CarDraft>({ ...EMPTY_CAR });
  const [ruleDraft, setRuleDraft] = useState<PriceRuleDraft>({ ...EMPTY_RULE });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    storeToken(token);
  }, [token]);

  async function refreshData(): Promise<void> {
    try {
      const [carList, ruleList] = await Promise.all([getCars(), getPriceRules()]);
      setCars(carList);
      setRules(ruleList);
    } catch (err) {
      console.error(err);
      setError('Unable to load data');
    }
  }

  function handleTokenChange(value: string): void {
    setToken(value.trim());
  }

  function startEditCar(car: Car): void {
    setCarDraft({ ...car });
    setActiveTab('cars');
  }

  function startEditRule(rule: PriceRule): void {
    setRuleDraft({ ...rule });
    setActiveTab('rules');
  }

  function resetCarDraft(): void {
    setCarDraft({ ...EMPTY_CAR });
  }

  function resetRuleDraft(): void {
    setRuleDraft({ ...EMPTY_RULE });
  }

  async function handleCarSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) {
      alert('Enter the admin token first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await saveCar(token, carDraft);
      await refreshData();
      resetCarDraft();
      alert('Car saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save car');
    } finally {
      setLoading(false);
    }
  }

  async function handleRuleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) {
      alert('Enter the admin token first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await savePriceRule(token, ruleDraft);
      await refreshData();
      resetRuleDraft();
      alert('Rule saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  }

  async function handleCarDelete(id: string): Promise<void> {
    if (!token) {
      alert('Enter the admin token first.');
      return;
    }
    if (!window.confirm('Delete this car? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deleteCar(token, id);
      await refreshData();
      if (carDraft.id === id) {
        resetCarDraft();
      }
      alert('Car deleted.');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete car');
    } finally {
      setLoading(false);
    }
  }

  async function handleRuleDelete(id: string): Promise<void> {
    if (!token) {
      alert('Enter the admin token first.');
      return;
    }
    if (!window.confirm('Delete this rule? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deletePriceRule(token, id);
      await refreshData();
      if (ruleDraft.id === id) {
        resetRuleDraft();
      }
      alert('Rule deleted.');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setLoading(false);
    }
  }

  const sortedCars = useMemo(
    () => cars.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [cars],
  );

  const sortedRules = useMemo(
    () => rules.slice().sort((a, b) => a.rule_name.localeCompare(b.rule_name)),
    [rules],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Valley Wedding Cars Admin</h1>
            <p className="text-sm text-slate-400">Manage fleet inventory and pricing rules.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="password"
              className="w-64 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
              placeholder="Paste admin token"
              value={token}
              onChange={(event) => handleTokenChange(event.target.value)}
            />
            <button
              type="button"
              onClick={() => handleTokenChange('')}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-6 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('cars')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 'cars' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Cars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 'rules' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Price Rules
          </button>
        </div>

        {error && <p className="mb-4 rounded-md border border-rose-500 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}

        {activeTab === 'cars' ? (
          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Cars</h2>
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Base Price</th>
                      <th className="px-4 py-3">Per Km</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {sortedCars.map((car) => (
                      <tr key={car.id} className="text-sm">
                        <td className="px-4 py-3 font-medium">{car.name}</td>
                        <td className="px-4 py-3 capitalize text-slate-300">{car.category}</td>
                        <td className="px-4 py-3">₹{car.base_price.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">₹{car.per_km.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            car.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {car.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditCar(car)}
                              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleCarDelete(car.id)}
                              className="rounded-md border border-rose-500 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedCars.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                          No cars found. Use the form to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="mb-4 text-lg font-semibold">{carDraft.id ? 'Edit Car' : 'Add Car'}</h3>
              <form onSubmit={(event) => void handleCarSubmit(event)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                    value={carDraft.name ?? ''}
                    onChange={(event) => setCarDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm capitalize text-slate-100 focus:border-emerald-400 focus:outline-none"
                    value={carDraft.category ?? 'sedan'}
                    onChange={(event) => setCarDraft((prev) => ({ ...prev, category: event.target.value as Car['category'] }))}
                  >
                    {CAR_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="capitalize">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">Base Price</label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                      value={carDraft.base_price ?? 0}
                      onChange={(event) => setCarDraft((prev) => ({ ...prev, base_price: Number(event.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Per Km</label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                      value={carDraft.per_km ?? 0}
                      onChange={(event) => setCarDraft((prev) => ({ ...prev, per_km: Number(event.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Image URL</label>
                  <input
                    type="url"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                    value={carDraft.image_url ?? ''}
                    onChange={(event) => setCarDraft((prev) => ({ ...prev, image_url: event.target.value }))}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={carDraft.active ?? true}
                    onChange={(event) => setCarDraft((prev) => ({ ...prev, active: event.target.checked }))}
                    className="h-4 w-4 rounded border border-slate-700 bg-slate-800"
                  />
                  Active
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {carDraft.id ? 'Update Car' : 'Create Car'}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    onClick={() => resetCarDraft()}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Price Rules</h2>
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Rule</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Scope</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {sortedRules.map((rule) => (
                      <tr key={rule.id} className="text-sm">
                        <td className="px-4 py-3 font-medium">{rule.rule_name}</td>
                        <td className="px-4 py-3 capitalize text-slate-300">{rule.type}</td>
                        <td className="px-4 py-3 text-slate-300">{rule.scope}</td>
                        <td className="px-4 py-3">{rule.type === 'multiplier' ? rule.value.toFixed(2) : `${rule.value}`}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            rule.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditRule(rule)}
                              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRuleDelete(rule.id)}
                              className="rounded-md border border-rose-500 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedRules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                          No rules found. Use the form to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="mb-4 text-lg font-semibold">{ruleDraft.id ? 'Edit Rule' : 'Add Rule'}</h3>
              <form onSubmit={(event) => void handleRuleSubmit(event)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Rule Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                    value={ruleDraft.rule_name ?? ''}
                    onChange={(event) => setRuleDraft((prev) => ({ ...prev, rule_name: event.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">Type</label>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm capitalize text-slate-100 focus:border-emerald-400 focus:outline-none"
                      value={ruleDraft.type ?? 'discount'}
                      onChange={(event) => setRuleDraft((prev) => ({ ...prev, type: event.target.value as PriceRule['type'] }))}
                    >
                      {RULE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Scope</label>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                      value={ruleDraft.scope ?? 'srinagar'}
                      onChange={(event) => setRuleDraft((prev) => ({ ...prev, scope: event.target.value as PriceRule['scope'] }))}
                    >
                      {RULE_SCOPES.map((scope) => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                    value={ruleDraft.value ?? 0}
                    onChange={(event) => setRuleDraft((prev) => ({ ...prev, value: Number(event.target.value) }))}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Discounts & surcharges use decimal percentages (e.g. -0.15, 0.10). Multipliers use factors (e.g. 1.10).
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ruleDraft.active ?? true}
                    onChange={(event) => setRuleDraft((prev) => ({ ...prev, active: event.target.checked }))}
                    className="h-4 w-4 rounded border border-slate-700 bg-slate-800"
                  />
                  Active
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {ruleDraft.id ? 'Update Rule' : 'Create Rule'}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    onClick={() => resetRuleDraft()}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
