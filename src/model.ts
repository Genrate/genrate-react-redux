import { KeyValue } from '@genrate/react/lib/src/override';
import { get_value } from '@genrate/react/lib/src/utils';
import { ModelType, arg, model, select } from '@genrate/redux';
import { PayloadAction } from '@reduxjs/toolkit';
import { SelectorFn } from '.';

const $Override = {
  selectors: {} as KeyValue<KeyValue<SelectorFn<any>>>,
};

export function set_selectors(connId: string, override: KeyValue<SelectorFn<any>>) {
  $Override.selectors[connId] = override as KeyValue<SelectorFn<any>>;
}

export function is_selectors_exists(connId: string, key: string) {
  return $Override.selectors[connId]?.[key] ? true : false;
}

export function get_selector_keys(connId: string) {
  return Object.keys($Override.selectors[connId] ?? {});
}

const ConnectorModel = model(
  '$$connector',
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
    const selectors = $Override.selectors[connId];
    const data: KeyValue = {};

    const selectKeys: string[] = keys === true ? Object.keys(selectors ?? {}) : keys;

    for (const key of selectKeys) {
      const selector = selectors[key](state?.$$connector?.[connId] || {});
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
  [ConnectorModel],
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

export default ConnectorModel;
