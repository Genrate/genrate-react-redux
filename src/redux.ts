import { KeyValue } from '@genrate/react/lib/src/override';
import { get_value } from '@genrate/react/lib/src/utils';
import { ModelType, arg, model, select } from '@genrate/redux';
import { PayloadAction } from '@reduxjs/toolkit';
import { HookFn, SelectorFn } from '.';
import { store } from '@genrate/react/lib/src/store';
import { useEffect, useLayoutEffect, useReducer } from 'react';

const hookStore = { ...store };

type KeyMap = { $$keyMap: Record<string, true> };

const OverrideRedux = {
  selectors: {} as KeyValue<KeyValue<SelectorFn<any>> & KeyMap>,
  hooks: {} as KeyValue<KeyValue<HookFn<any>> & KeyMap>,
};

export function set_override(
  connId: string,
  override: KeyValue<SelectorFn<any>> | KeyValue<HookFn<any>> | KeyMap,
  type: 'hooks' | 'selector' = 'selector'
) {
  if (type == 'selector') {
    OverrideRedux.selectors[connId] = override as KeyValue<SelectorFn<any>> & KeyMap;
  } else {
    OverrideRedux.hooks[connId] = override as KeyValue<HookFn<any>> & KeyMap;
    hookStore.init(connId, {});
  }
}

export function is_override_exists(connId: string, key: string, type: 'hooks' | 'selector' = 'selector') {
  if (type == 'hooks') {
    return OverrideRedux.hooks[connId]?.$$keyMap[key] ? true : false;
  }

  return OverrideRedux.selectors[connId]?.[key] ? true : false;
}

export function get_overidde_keys(connId: string, type: 'hooks' | 'selector' = 'selector') {
  if (type == 'hooks') {
    return Object.keys(OverrideRedux.hooks[connId] ?? {});
  }

  return Object.keys(OverrideRedux.selectors[connId] ?? {});
}

const GenRateModel = model(
  '$$genrate',
  {} as KeyValue<KeyValue<any>>,
  {
    set: (state, action) => {
      const [connectorId, data] = action.payload;
      state[connectorId] = data;
    },
    unset: (state, action) => {
      const connectorId = action.payload;
      state = { ...state, [connectorId]: undefined };
    },
    setValue: (state, action: PayloadAction<[string, string, any]>) => {
      const [connectorId] = action.payload;
      let [, key, value] = action.payload;

      if (key.indexOf('.') > -1) {
        const keys: string[] = key.split('.');
        key = keys.shift() as string;
        const oldValue = state[connectorId][key];
        value = get_value(oldValue, keys, value);
      }

      state[connectorId] = {
        ...(state[connectorId] ?? {}),
        [key]: value,
      };
    },
  },
  {
    getByKey: (state, connectorId: string, key: string) => {
      const connData = state[connectorId] ?? {};

      let value;
      if (key.indexOf('.')) {
        const keys = key.split('.');
        for (const k of keys) {
          if (!value) value = connData[k];
          else value = value[k];
        }
      } else {
        value = connData[key];
      }

      return value;
    },
  }
);

export const getSelectors = select(
  [(state) => state],
  [arg<string>(1), arg<string[] | true>(2)],
  (state, connId, keys) => {
    const selectors = OverrideRedux.selectors[connId];
    const data: KeyValue = {};

    const selectKeys: string[] = keys === true ? Object.keys(selectors ?? {}) : keys;

    for (const key of selectKeys) {
      const selector = selectors[key](state?.$$genrate?.[connId] || {});
      const fn = (selector as ModelType<unknown>).$$selector ?? selector;
      if (typeof fn == 'function') {
        data[key] = fn(state);
      } else {
        data[key] = fn;
      }
    }

    return data;
  }
);

export const getByExceptKeys = select(
  [GenRateModel],
  [arg<string>(1), arg<string[] | undefined>(2), arg<string[] | undefined>(3)],
  (state, connId, keys, except) => {
    if (keys === undefined) {
      return state[connId] ?? {};
    }

    const allKeys = except !== undefined ? Object.keys(state[connId] ?? {}).filter((k) => except.indexOf(k) < 0) : [];
    const data: KeyValue = {};
    for (const key of keys) {
      const index = allKeys.indexOf(key);
      if (index > -1) {
        allKeys.splice(index, 1);
      }

      data[key] = state[connId]?.[key];
    }

    if (allKeys.length) allKeys.map((k) => (data[k] = state[connId]?.[k]));

    return data;
  }
);

const useOverrideHook = (connId: string, key: string, state: KeyValue) => {
  const result = OverrideRedux.hooks[connId][key](state);

  useLayoutEffect(() => {
    if (key.indexOf('|') > -1 && Array.isArray(result)) {
      key.split('|').forEach((k, i) => {
        hookStore.set(connId, k, result[i]);
      });
    } else {
      hookStore.set(connId, key, result);
    }
  }, [result]);
};

export const useOverrideHooks = (connId: string) => {
  const state = GenRateModel[connId].useAll();
  const selectors = getSelectors.useSelect(connId, true);

  for (const k in OverrideRedux.hooks[connId]) {
    if (k.startsWith('$$')) continue;
    (() => useOverrideHook(connId, k, { ...state, ...selectors }))();
  }
};

export function useHooks(connId: string, keys: string[]) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!keys?.length) return;

    const subs = keys?.map((key) => hookStore.subscribe(connId, key, () => forceUpdate()));

    return () => {
      subs?.map((sub) => sub.unsubscribed());
    };
  }, [keys]);

  const values: KeyValue = {};

  for (const key of keys) {
    values[key] = hookStore.get(connId, key);
  }

  return values;
}

export default GenRateModel;
