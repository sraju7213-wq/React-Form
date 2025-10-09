import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteCar, deleteRule, getCars, getRules, saveCar, saveRule } from './api';
import { getToken, setToken } from './auth';
import type { AdminCar, AdminPriceRule } from './types';

type TabKey = 'cars' | 'rules';

const defaultCar: Partial<AdminCar> = {
  name: '',
  category: 'sedan',
  base_price: 0,
  per_km: 0,
  image_url: '',
  active: true,
};

const defaultRule: Partial<AdminPriceRule> = {
  rule_name: '',
  type: 'discount',
  scope: 'srinagar',
  value: 0,
  active: true,
};

const categoryOptions: AdminCar['category'][] = ['sedan', 'suv', 'luxury', 'vintage', 'other'];
const ruleTypeOptions: AdminPriceRule['type'][] = ['discount', 'surcharge', 'multiplier'];
const scopeOptions: AdminPriceRule['scope'][] = ['srinagar', 'outside_srinagar', 'weekend', 'custom'];

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('cars');
  const [tokenInput, setTokenInput] = useState<string>(() => getToken() ?? '');
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [rules, setRules] = useState<AdminPriceRule[]>([]);
  const [carForm, setCarForm] = useState<Partial<AdminCar>>(defaultCar);
  const [ruleForm, setRuleForm] = useState<Partial<AdminPriceRule>>(defaultRule);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const hydrate = useCallback(async () => {
    try {
      setLoading(true);
      const [carsData, rulesData] = await Promise.all([getCars(), getRules()]);
      setCars(carsData);
      setRules(rulesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setToken(tokenInput.trim() ? tokenInput.trim() : null);
  }, [tokenInput]);

  const editingCar = useMemo(() => cars.find((car) => car.id === carForm.id) ?? null, [cars, carForm.id]);
  const editingRule = useMemo(() => rules.find((rule) => rule.id === ruleForm.id) ?? null, [rules, ruleForm.id]);

  const onCarSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    try {
      setLoading(true);
      const payload = {
        ...carForm,
        base_price: Number(carForm.base_price ?? 0),
        per_km: Number(carForm.per_km ?? 0),
      };
      const saved = await saveCar(payload);
      setCars((prev) => {
        const exists = prev.some((car) => car.id === saved.id);
        if (exists) {
          return prev.map((car) => (car.id === saved.id ? saved : car));
        }
        return [...prev, saved];
      });
      setCarForm(defaultCar);
      setSuccess(`Saved car \'${saved.name}\'`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save car';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onRuleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    try {
      setLoading(true);
      const payload = {
        ...ruleForm,
        value: Number(ruleForm.value ?? 0),
      };
      const saved = await saveRule(payload);
      setRules((prev) => {
        const exists = prev.some((rule) => rule.id === saved.id);
        if (exists) {
          return prev.map((rule) => (rule.id === saved.id ? saved : rule));
        }
        return [...prev, saved];
      });
      setRuleForm(defaultRule);
      setSuccess(`Saved rule \'${saved.rule_name}\'`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save rule';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const startEditCar = (car: AdminCar) => {
    setCarForm(car);
    setActiveTab('cars');
  };

  const startEditRule = (rule: AdminPriceRule) => {
    setRuleForm(rule);
    setActiveTab('rules');
  };

  const handleDeleteCar = async (car: AdminCar) => {
    if (!confirm(`Deactivate car ${car.name}?`)) {
      return;
    }
    resetFeedback();
    try {
      setLoading(true);
      await deleteCar(car.id);
      setCars((prev) => prev.filter((item) => item.id !== car.id));
      setSuccess(`Deactivated car \'${car.name}\'`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete car';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (rule: AdminPriceRule) => {
    if (!confirm(`Deactivate rule ${rule.rule_name}?`)) {
      return;
    }
    resetFeedback();
    try {
      setLoading(true);
      await deleteRule(rule.id);
      setRules((prev) => prev.filter((item) => item.id !== rule.id));
      setSuccess(`Deactivated rule \'${rule.rule_name}\'`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete rule';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelCarEdit = () => {
    setCarForm(defaultCar);
  };

  const cancelRuleEdit = () => {
    setRuleForm(defaultRule);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white shadow">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Valley Wedding Cars Admin</h1>
            <p className="text-sm text-slate-300">Manage vehicles and price rules in real time.</p>
          </div>
          <label className="flex flex-col text-sm text-slate-200 md:w-80">
            <span className="mb-1 font-medium">Admin API Token</span>
            <input
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              type="password"
              placeholder="Paste token"
              className="rounded border border-slate-500 bg-slate-800 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cars')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === 'cars'
                ? 'bg-amber-500 text-slate-900 shadow'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Cars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-900 shadow'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Price Rules
          </button>
        </div>

        {loading && <div className="mb-4 rounded bg-blue-100 px-4 py-3 text-sm text-blue-900">Loading…</div>}
        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded bg-emerald-100 px-4 py-3 text-sm text-emerald-900">
            {success}
          </div>
        )}

        {activeTab === 'cars' ? (
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold">{editingCar ? 'Edit Car' : 'Add Car'}</h2>
              <form className="space-y-4" onSubmit={onCarSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    required
                    value={carForm.name ?? ''}
                    onChange={(event) => setCarForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Category</label>
                  <select
                    value={carForm.category ?? 'sedan'}
                    onChange={(event) =>
                      setCarForm((prev) => ({ ...prev, category: event.target.value as AdminCar['category'] }))
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    <span>Base Price (₹)</span>
                    <input
                      type="number"
                      min={0}
                      required
                      value={carForm.base_price ?? 0}
                      onChange={(event) =>
                        setCarForm((prev) => ({ ...prev, base_price: Number(event.target.value) }))
                      }
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    <span>Per Km (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={carForm.per_km ?? 0}
                      onChange={(event) =>
                        setCarForm((prev) => ({ ...prev, per_km: Number(event.target.value) }))
                      }
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Image URL</label>
                  <input
                    type="url"
                    value={carForm.image_url ?? ''}
                    onChange={(event) => setCarForm((prev) => ({ ...prev, image_url: event.target.value }))}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="car-active"
                    type="checkbox"
                    checked={carForm.active ?? true}
                    onChange={(event) => setCarForm((prev) => ({ ...prev, active: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="car-active" className="text-sm text-slate-700">
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400"
                  >
                    {editingCar ? 'Update Car' : 'Create Car'}
                  </button>
                  {editingCar && (
                    <button
                      type="button"
                      onClick={cancelCarEdit}
                      className="rounded px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Base
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Per Km
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {cars.map((car) => (
                    <tr key={car.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{car.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{car.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">₹{car.base_price.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">₹{car.per_km.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                            car.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {car.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCar(car)}
                            className="text-amber-600 hover:text-amber-500"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCar(car)}
                            className="text-red-600 hover:text-red-500"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cars.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No cars yet. Add one using the form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold">{editingRule ? 'Edit Price Rule' : 'Add Price Rule'}</h2>
              <form className="space-y-4" onSubmit={onRuleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.rule_name ?? ''}
                    onChange={(event) => setRuleForm((prev) => ({ ...prev, rule_name: event.target.value }))}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    <span>Type</span>
                    <select
                      value={ruleForm.type ?? 'discount'}
                      onChange={(event) =>
                        setRuleForm((prev) => ({ ...prev, type: event.target.value as AdminPriceRule['type'] }))
                      }
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                    >
                      {ruleTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    <span>Scope</span>
                    <select
                      value={ruleForm.scope ?? 'srinagar'}
                      onChange={(event) =>
                        setRuleForm((prev) => ({ ...prev, scope: event.target.value as AdminPriceRule['scope'] }))
                      }
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                    >
                      {scopeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.value ?? 0}
                    onChange={(event) => setRuleForm((prev) => ({ ...prev, value: Number(event.target.value) }))}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Discounts/surcharges use +/- decimals (e.g. -0.15 or 0.1). Multipliers use factors (e.g. 1.1).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="rule-active"
                    type="checkbox"
                    checked={ruleForm.active ?? true}
                    onChange={(event) => setRuleForm((prev) => ({ ...prev, active: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="rule-active" className="text-sm text-slate-700">
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                  {editingRule && (
                    <button
                      type="button"
                      onClick={cancelRuleEdit}
                      className="rounded px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Scope
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{rule.rule_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{rule.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{rule.scope}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{rule.value}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                            rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {rule.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditRule(rule)}
                            className="text-amber-600 hover:text-amber-500"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule)}
                            className="text-red-600 hover:text-red-500"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No rules yet. Add one using the form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminApp;
