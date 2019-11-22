import React, { useEffect, useState } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { PageHeader, PageHeaderTitle, Main } from '@redhat-cloud-services/frontend-components';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { onLoadOneApi } from '../store/actions';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components';
import { Facebook } from 'react-content-loader';
import {
    CardBody,
    Card,
    Breadcrumb,
    BreadcrumbItem,
    Modal,
    Button,
    Level,
    LevelItem,
    ButtonVariant,
    Split,
    SplitItem
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import ReactJson from 'react-json-view';

const Detail = ({ loadApi, detail, match }) => {
    const { params } = match;
    useEffect(() => {
        loadApi(params.apiName);
    }, []);
    const [ isOpen, onModalToggle ] = useState(false);
    return (
        <React.Fragment>
            <PageHeader className="pf-m-light">
                <PageHeaderTitle title={
                    <React.Fragment>
                        <Breadcrumb>
                            <BreadcrumbItem><Link to="/">Overview</Link></BreadcrumbItem>
                            <BreadcrumbItem isActive>
                                { params.apiName }
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <React.Fragment>
                            { detail.loaded && !detail.error &&
                                <Level className="ins-c-docs__api-detail">
                                    <LevelItem className="ins-c-docs__api-detail-info">
                                        {
                                            detail.loaded ? `Detail of ${detail.spec.info.title}` :
                                                <Skeleton size={ SkeletonSize.md } />
                                        }
                                    </LevelItem>
                                    <LevelItem>
                                        <Split gutter="sm">
                                            <SplitItem className="ins-c-docs__api-detail-info">
                                                {
                                                    detail.loaded && !detail.error ? <a
                                                        href={ `${location.origin}${detail.latest}` }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Open Raw <ExternalLinkAltIcon size="sm" />
                                                    </a> :
                                                        <Skeleton size={ SkeletonSize.mdmd } />
                                                }
                                            </SplitItem>
                                            <SplitItem className="ins-c-docs__api-detail-info">
                                                { detail.loaded ? <Button
                                                    onClick={ () => onModalToggle(true) }
                                                    variant={ ButtonVariant.secondary }
                                                >
                                                    Show JSON
                                                </Button> :
                                                    <Skeleton size={ SkeletonSize.md } />
                                                }
                                            </SplitItem>
                                        </Split>
                                    </LevelItem>
                                </Level> }
                        </React.Fragment>

                    </React.Fragment>
                } />
            </PageHeader>
            <Main>
                <React.Fragment>
                    <Card>
                        <CardBody>
                            { detail.loaded &&
                                <SwaggerUI
                                    deepLinking
                                    docExpansion="list"
                                    spec={ detail.spec }
                                    onComplete={ (system) => {
                                        const { layoutActions: { show }} = system;
                                        system.layoutActions.show = (isShownKey, isShown) => {
                                            history.replaceState({}, '', `${location.pathname}#${CSS.escape(isShownKey.join('-'))}`);
                                            show(isShownKey, isShown);
                                        };

                                        if (location.hash && location.hash.length > 0) {
                                            const found = document
                                            .querySelector(`[id$='${location.hash.replace('#', '').replace(/\\./g, '\\\\.')}']`);
                                            if (found) {
                                                found.scrollIntoView();
                                                show(location.hash.replace('#', '').replace(/\\/g, '').split('-'), true);
                                            }
                                        }
                                    } } />
                            }
                            { !detail.loaded &&
                                <Facebook />
                            }
                        </CardBody>
                    </Card>
                </React.Fragment>
            </Main>
            <Modal
                width={ '50%' }
                title="Modal Header"
                isOpen={ isOpen }
                onClose={ () => onModalToggle(false) }
                actions={ [
                    <Button key="close" variant={ ButtonVariant.secondary } onClick={ () => onModalToggle(false) }>
                        Close
                    </Button>
                ] }
            >
                <ReactJson src={ detail.spec } />
            </Modal>
        </React.Fragment>
    );
};

Detail.propTypes = {
    loadApi: PropTypes.func,
    detail: PropTypes.shape({
        loaded: PropTypes.bool
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            apiName: PropTypes.string
        })
    })
};
Detail.defaultProps = {
    loadApi: () => undefined,
    detail: {
        loaded: false
    }
};

export default withRouter(connect(({ detail }) => ({
    detail
}), (dispatch) => ({ loadApi: (api) => dispatch(onLoadOneApi({ name: api, version: 'v1' })) }))(Detail));
