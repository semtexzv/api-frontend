import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/files/ReducerRegistry';
import * as ACTIONS from './actionTypes';

const defaultState = { loaded: false, selectedRows: {}};
const disabledApis = [
    'automation-analytics',
    'aiops-insights-clustering',
    'openshift',
    'ruledev',
    'migration-analytics',
    'subscriptions'
];

function dataLoaded(state, { payload }) {
    return {
        ...state,
        endpoints: payload && payload
        .services
        .filter(service => !disabledApis.includes(service.appName) &&
            (!service.api.isBeta || insights.chrome.isBeta())
        )
        .map(service => ({
            ...service,
            version: service.api.versions[0],
            appName: (service.api.alias && service.api.alias[0]) || service.appName
        })),
        loaded: true
    };
}

function detailLoaded(state, { payload: { latest, ...payload }}) {
    return {
        ...state,
        spec: payload,
        latest,
        loaded: true
    };
}

function onSelectRow(state, { payload: { isSelected, row }}) {
    const selectedRows = {
        ...state.selectedRows || {},
        ...Array.isArray(row) ? row.reduce((acc, curr) => ({
            ...acc,
            [curr.cells[0].value]: {
                isSelected,
                appName: curr.cells[0].value,
                version: curr.cells[2].value
            }
        }), {}) : {
            [row.cells[0].value]: {
                isSelected,
                appName: row.cells[0].value,
                version: row.cells[2].value
            }
        }
    };
    return {
        ...state,
        selectedRows
    };
}

export const services = applyReducerHash({
    [`${ACTIONS.LOAD_ALL}_FULFILLED`]: dataLoaded,
    [`${ACTIONS.LOAD_ALL}_PENDING`]: () => defaultState,
    [ACTIONS.SELECT_ROW]: onSelectRow
}, defaultState);

export const detail = applyReducerHash({
    [`${ACTIONS.LOAD_ONE_API}_FULFILLED`]: detailLoaded,
    [`${ACTIONS.LOAD_ONE_API}_PENDING`]: () => ({ loaded: false }),
    [`${ACTIONS.LOAD_ONE_API}_REJECTED`]: () => ({ loaded: true, error: true })
}, defaultState);
