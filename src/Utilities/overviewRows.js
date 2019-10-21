import React from 'react';
import {
    Badge,
    Bullseye,
    Button,
    EmptyState,
    Title,
    EmptyStateBody,
    EmptyStateVariant
} from '@patternfly/react-core';
import { sortable, SortByDirection, cellWidth } from '@patternfly/react-table';
import { EmptyTable } from '@redhat-cloud-services/frontend-components';
import { ExportIcon } from '@patternfly/react-icons';
import { oneApi } from '../api';
import fileDownload from 'js-file-download';
import JSZip from 'jszip';

const indexToKey = [ 'title', 'appName', 'version' ];

export const columns = [
    { title: 'Application name', transforms: [ sortable ]},
    { title: 'API endpoint', transforms: [ sortable ]},
    { title: 'API version', transforms: [ sortable, cellWidth(10) ]},
    { title: 'Download', transforms: [ cellWidth(10) ]}
];

export const rowMapper = (title, appName, version, selectedRows = []) => ({
    selected: selectedRows[appName] && selectedRows[appName].isSelected,
    cells: [
        {
            title,
            value: appName,
            props: {
                'data-position': 'title'
            }
        },
        `/api/${appName}`,
        {
            title: <Badge>{ version }</Badge>,
            value: version
        },
        {
            title: <Button variant="plain" onClick={ () => downloadFile(appName, version) }> <ExportIcon /> </Button>
        }
    ]});

export const emptyTable = [{
    cells: [{
        title: (<EmptyTable>
            <Bullseye>
                <EmptyState variant={ EmptyStateVariant.full }>
                    <Title headingLevel="h5" size="lg">
                        No matching rules found
                    </Title>
                    <EmptyStateBody>
                        This filter criteria matches no rules. <br /> Try changing your filter settings.
                    </EmptyStateBody>
                </EmptyState>
            </Bullseye>
        </EmptyTable>),
        props: {
            colSpan: columns.length
        }
    }]
}];

export function sortRows(curr, next, key, isDesc) {
    if (key !== undefined) {
        if (isDesc) {
            return curr[key] < next[key] ? 1 :
                (next[key] < curr[key]) ? -1 : 0;
        } else {
            return curr[key] > next[key] ? 1 :
                (next[key] > curr[key]) ? -1 : 0;
        }
    }

    return 0;
}

export function buildRows(sortBy, { page, perPage }, rows, selectedRows) {
    if (rows.length > 0) {
        return rows.sort((curr, next) =>
            sortRows(
                curr,
                next,
                indexToKey[sortBy.index],
                sortBy.direction === SortByDirection.desc)
        )
        .slice((page - 1) * perPage, page * perPage)
        .map(({ frontend, title, appName, version }) => rowMapper((frontend && frontend.title) || title, appName, version, selectedRows));
    }

    return emptyTable;
}

export function filterRows(row, filter) {
    return indexToKey.some(key => row[key] &&
        row[key].toLocaleLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1
    );
}

export function downloadFile(appName, appVersion) {
    oneApi({ name: appName, version: appVersion })
    .then(data => {
        delete data.latest;
        delete data.name;
        fileDownload(data, `${appName}-openapi.json`);
    });
}

export function multiDownload(selectedRows = {}, onError) {
    const zip = new JSZip();
    const allFiles = Object.values(selectedRows || {})
    .filter(({ isSelected }) => isSelected)
    .map(async ({ appName, version }) => {
        try {
            return await oneApi({ name: appName, version });
        } catch (e) {
            onError(e);
        }
    });

    Promise.all(allFiles).then(files => {
        if (files && files.length > 1) {
            files.map(({ name, ...file } = {}) => {
                if (name) {
                    delete file.latest;
                    zip.file(`${name}-openapi.json`, JSON.stringify(file));
                }
            });
            zip.generateAsync({ type: 'blob' })
            .then((content) => fileDownload(content, `cloud-services-openapi.zip`));
        } else if (files && files.length === 1) {
            const { name, ...file } = files[0] || {};
            if (name) {
                delete file.latest;
                fileDownload(JSON.stringify(file), `${name}-openapi.json`);
            }
        }
    });
}
