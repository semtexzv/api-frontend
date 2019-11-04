import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import {
    PageHeader,
    PageHeaderTitle,
    Main,
    SkeletonTable,
    TableToolbar,
    PrimaryToolbar
} from '@redhat-cloud-services/frontend-components';
import { Pagination } from '@patternfly/react-core';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { connect } from 'react-redux';
import { onLoadApis, onSelectRow } from '../store/actions';
import { filterRows, buildRows, columns, multiDownload } from '../Utilities/overviewRows';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications';

const isNotSelected = ({ selectedRows }) => {
    return !selectedRows ||
        Object.values(selectedRows || {})
        .map(({ isSelected }) => isSelected)
        .filter(Boolean).length === 0;
};

const Overview = ({ loadApis, services, history, selectRow, onError }) => {
    useEffect(() => {
        loadApis();
    }, []);
    const [ sortBy, onSortBy ] = useState({});
    const [ pageSettings, onPaginate ] = useState({
        perPage: 50,
        page: 1
    });
    const [ filter, onChangeFilter ] = useState('');
    const filtered = filter && services.endpoints.filter(row => filterRows(row, filter));
    const rows = services.loaded ?
        buildRows(sortBy, pageSettings, filtered || services.endpoints, services.selectedRows) :
        [];
    return (
        <React.Fragment>
            <PageHeader className="pf-m-light">
                <PageHeaderTitle title='API documentation' />
            </PageHeader>
            <Main className="ins-c-docs__api">
                <React.Fragment>
                    <PrimaryToolbar
                        filterConfig={ {
                            items: [{
                                label: 'Filter by text',
                                type: 'text',
                                filterValues: {
                                    id: 'filter-by-string',
                                    key: 'filter-by-string',
                                    placeholder: 'Filter by text',
                                    value: filter,
                                    onChange: (_e, value) => {
                                        onPaginate({
                                            ...pageSettings,
                                            page: 1
                                        });
                                        onChangeFilter(value);
                                    },
                                    isDisabled: !services.loaded
                                }
                            }]
                        } }
                        actionsConfig={ {
                            actions: [{
                                label: 'Download Selected',
                                props: {
                                    isDisabled: isNotSelected(services),
                                    onClick: () => multiDownload(services.selectedRows, onError)
                                }
                            }]
                        } }
                        { ...services.loaded && {
                            pagination: {
                                ...pageSettings,
                                itemCount: (filtered || services.endpoints).length,
                                onSetPage: (_e, page) => onPaginate({
                                    ...pageSettings,
                                    page
                                }),
                                onPerPageSelect: (_event, perPage) => onPaginate({
                                    ...pageSettings,
                                    perPage
                                })
                            }}
                        }
                        { ...filter.length > 0 && { activeFiltersConfig: {
                            filters: [{
                                name: filter
                            }],
                            onDelete: () => {
                                onPaginate({
                                    ...pageSettings,
                                    page: 1
                                });
                                onChangeFilter('');
                            }
                        }}
                        }
                    />
                    {
                        services.loaded ?
                            <Table
                                aria-label="Sortable Table"
                                variant={ TableVariant.compact }
                                sortBy={ sortBy }
                                onSort={ (_e, index, direction) => onSortBy({ index, direction }) }
                                cells={ columns }
                                rows={ rows }
                                { ...(filtered || services.endpoints).length > 0 && ({
                                    onSelect: (_e, isSelected, rowKey) => {
                                        if (rowKey === -1) {
                                            selectRow(isSelected, rows);
                                        } else {
                                            selectRow(isSelected, rows[rowKey]);
                                        }
                                    }
                                }) }
                            >
                                <TableHeader />
                                <TableBody onRowClick={ (event, data) => {
                                    if (event.target.getAttribute('data-position') === 'title') {
                                        history.push(`/${data.cells[0].value.replace('/api/', '')}`);
                                    } else if (!event.target.matches('input')) {
                                        selectRow(!data.selected, data);
                                    }
                                } }/>
                            </Table> :
                            <SkeletonTable columns={ columns } rowSize={ 28 } />
                    }
                </React.Fragment>
                <TableToolbar isFooter>
                    {
                        services.loaded ?
                            <Pagination
                                variant="bottom"
                                dropDirection="up"
                                itemCount={ (filtered || services.endpoints).length }
                                perPage={ pageSettings.perPage }
                                page={ pageSettings.page }
                                onSetPage={ (_e, page) => onPaginate({
                                    ...pageSettings,
                                    page
                                }) }
                                onPerPageSelect={ (_event, perPage) => onPaginate({
                                    ...pageSettings,
                                    perPage
                                }) }
                            /> :
                            `loading`
                    }
                </TableToolbar>
            </Main>
        </React.Fragment>
    );
};

Overview.propTypes = {
    loadApis: PropTypes.func,
    onError: PropTypes.func,
    services: PropTypes.shape({
        loaded: PropTypes.bool,
        selectedRows: PropTypes.shape({
            isSelected: PropTypes.bool
        })
    }),
    history: PropTypes.shape({
        push: PropTypes.func
    }),
    selectRow: PropTypes.func
};
Overview.defaultProps = {
    loadApis: () => undefined,
    selectRow: () => undefined,
    onError: () => undefined,
    services: {
        loaded: false,
        selectedRows: {}
    }
};

export default withRouter(connect(({ services }) => ({
    services
}), (dispatch) => ({
    loadApis: () => dispatch(onLoadApis()),
    selectRow: (isSelected, row) => dispatch(onSelectRow({ isSelected, row })),
    onError: error => dispatch(addNotification({
        variant: 'danger',
        title: 'Server error',
        description: error,
        dismissable: true
    }))
}))(Overview));
